import { Request, Response } from "express"
import { handleError } from "express-ext"
import { Attributes, ErrorMessage, Log } from "onecore"
import { SignupService, Status, User } from "signup-service"
import { validate } from "xvalidators"
import { getResource } from "../resources"

export const userModel: Attributes = {
  username: {
    required: true,
    length: 100,
    resource: "username",
  },
  email: {
    required: true,
    length: 120,
    resource: "email",
  },
  password: {
    required: true,
    length: 100,
    resource: "password",
  },
}
export interface UserSignUp {
  username: string
  email: string
  password: string
}

export class SignUpController {
  constructor(private service: SignupService<string, User>, private status: Status, private log: Log) {
    this.render = this.render.bind(this)
    this.submit = this.submit.bind(this)
    this.verify = this.verify.bind(this)
  }
  render(req: Request, res: Response) {
    const resource = getResource(req)
    res.render("signup", {
      resource,
      user: {
        username: "minhduc",
        email: "minhduc140583@gmail.com",
        password: "Password1!",
      },
      message: "Enter sign up",
    })
  }
  submit(req: Request, res: Response) {
    const resource = getResource(req)
    const info: UserSignUp = req.body
    console.log("user " + JSON.stringify(info))
    const errors = validate<UserSignUp>(info, userModel, resource, true)
    if (errors.length > 0) {
      console.log("Sign up error: " + JSON.stringify(errors))
      res.status(422).json(errors)
    } else {
      const user: User = {
        username: info.username,
        contact: info.email,
        password: info.password,
      }
      this.service
        .signup(user)
        .then((result) => {
          if (result === this.status.success) {
            res.status(201).json(result).end()
          } else if (result === this.status.username) {
            const error: ErrorMessage = {
              field: "username",
              code: "duplicate",
              message: resource.error_sign_up_username,
            }
            res.status(409).json([error]).end()
          } else if (result === this.status.contact) {
            const error: ErrorMessage = {
              field: "email",
              code: "duplicate",
              message: resource.error_sign_up_contact,
            }
            res.status(409).json([error]).end()
          } else {
            res.status(500).json("Fail").end()
          }
        })
        .catch((err) => handleError(err, res, this.log))
    }
  }
  verify(req: Request, res: Response) {
    let userId = req.params.id
    let passcode = req.params.code
    const resource = getResource(req)
    this.service
      .verify(userId, passcode)
      .then((success) => {
        const message = success ? resource.success_activate_account : resource.fail_activate_account
        res.render("verify-account", { resource, message })
      })
      .catch((err) => handleError(err, res, this.log))
  }
}

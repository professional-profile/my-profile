import { Authenticator } from "authen-service"
import { Request, Response } from "express"
import { handleError } from "express-ext"
import { Attributes, Log, StringMap } from "onecore"
import { validate } from "xvalidators"
import { getResource } from "../resources"

export const userModel: Attributes = {
  username: {
    required: true,
    length: 100,
    resource: "username",
  },
  password: {
    required: true,
    length: 100,
    resource: "password",
  },
}
export interface User {
  username: string
  password: string
}

export const map: StringMap = {
  "2": "fail_authentication",
  "3": "fail_expired_password",
  "4": "fail_locked_account",
  "9": "fail_disabled_account",
}
export class SigninController {
  constructor(private authenticator: Authenticator<User, string>, private log: Log) {
    this.render = this.render.bind(this)
    this.submit = this.submit.bind(this)
  }
  render(req: Request, res: Response) {
    const resource = getResource(req)
    res.render("signin", {
      resource,
      user: {
        username: "kaka",
        password: "Password1!",
      },
      message: "Enter login",
    })
  }
  submit(req: Request, res: Response) {
    const resource = getResource(req)
    const user: User = req.body
    console.log("user " + JSON.stringify(user))
    const errors = validate<User>(user, userModel, resource, true)
    if (errors.length > 0) {
      console.log("Login error: " + JSON.stringify(errors))
      res.status(422).json(errors)
    } else {
      this.authenticator
        .authenticate(user)
        .then((result) => {
          console.log("Result " + JSON.stringify(result))
          if (result.status === 1) {
            res.status(200).json(result.user).end()
          } else {
            res.status(403).json(result).end()
          }
        })
        .catch((err) => handleError(err, res, this.log))
    }
  }
}

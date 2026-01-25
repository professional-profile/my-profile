import { Authenticator } from "authen-service"
import { Request, Response } from "express"
import { handleError, query } from "express-ext"
import { sign } from "jsonwebtoken"
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
  constructor(
    private authenticator: Authenticator<User, string>,
    private token: string,
    private secret: string,
    private expiresIn: number,
    private remember: string,
    private rememberSecret: string,
    private rememberExpiresIn: number,
    private log: Log,
  ) {
    this.render = this.render.bind(this)
    this.submit = this.submit.bind(this)
  }
  render(req: Request, res: Response) {
    const resource = getResource(req)
    res.render("signin", {
      resource,
      user: {
        username: "minhduc",
        password: "Password1!",
      },
      message: "Enter login",
    })
  }
  submit(req: Request, res: Response) {
    const resource = getResource(req)
    const user: User = req.body
    console.log("User = " + JSON.stringify(user))

    const errors = validate<User>(user, userModel, resource, true)
    if (errors.length > 0) {
      console.log("Login error = " + JSON.stringify(errors))
      res.status(422).json(errors).end()
    } else {
      this.authenticator
        .authenticate(user)
        .then((result) => {
          if (result.status === 1 && result.user) {
            console.log("User = " + JSON.stringify(result.user))
            const account = result.user
            const token = sign({ id: account.id, username: user.username, language: account.language, dateFormat: account.dateFormat }, this.secret, {
              expiresIn: this.expiresIn,
            })

            const remember = sign(
              { id: account.id, username: user.username, language: account.language, dateFormat: account.dateFormat },
              this.rememberSecret,
              { expiresIn: this.rememberExpiresIn },
            )
            console.log("Login successfully with token = " + token)
            res.cookie(this.token, token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: this.expiresIn })

            res.cookie(this.remember, remember, { httpOnly: true, secure: true, sameSite: "lax", maxAge: this.rememberExpiresIn })

            let redirectUrl = query(req, "redirectUrl")
            if (!redirectUrl || redirectUrl === "") {
              redirectUrl = "news"
            }
            return res.redirect(redirectUrl)
          } else {
            let key: string | undefined = map["" + result.status]
            const message = key ? resource[key] : resource.fail_authentication
            res.render("signin", { resource, user, message })
          }
        })
        .catch((err) => handleError(err, res, this.log))
    }
  }
}

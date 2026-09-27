import { Authenticator } from "authen-service"
import { Request, Response } from "express"
import { handleError, query } from "express-web-kit"
import { sign } from "jsonwebtoken"
import { Attributes, StringMap } from "onecore"
import { validate } from "validation-core"
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
  ) {
    this.render = this.render.bind(this)
    this.submit = this.submit.bind(this)
    this.signout = this.signout.bind(this)
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
            if (!account.displayName) {
              account.displayName = (account.username ? account.username : (account.email ? account.email : account.id))
            }
            const token = sign({ id: account.id, username: user.username, displayName: account.displayName, language: account.language, dateFormat: account.dateFormat }, this.secret, {
              expiresIn: this.expiresIn,
            })

            const remember = sign(
              { id: account.id, username: user.username, displayName: account.displayName, language: account.language, dateFormat: account.dateFormat },
              this.rememberSecret,
              { expiresIn: this.rememberExpiresIn },
            )
            console.log("Login successfully with token = " + token)
            res.cookie(this.token, token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: this.expiresIn })

            res.cookie(this.remember, remember, { httpOnly: true, secure: true, sameSite: "lax", maxAge: this.rememberExpiresIn })

            let redirectUrl = query(req, "redirectUrl")
            if (!redirectUrl || redirectUrl === "") {
              redirectUrl = "/companies/fpt-software/review"
            }
            return res.redirect(redirectUrl)
          } else {
            let key: string | undefined = map["" + result.status]
            const message = key ? resource[key] : resource.fail_authentication
            res.render("signin", { resource, user, message })
          }
        })
        .catch((err) => handleError(err, res))
    }
  }
  signout(req: Request, res: Response) {
    res.clearCookie(this.remember)
    res.clearCookie(this.token)
    return res.redirect("/login")
  }
}

import { Request, Response } from "express"
import { formatText, handleError } from "express-core-web"
import { PasswordChange, PasswordReset, PasswordService } from "password-service"
import { isEmpty } from "validation-core"
import { getResource } from "../resources"
import { render } from "../template"

export class PasswordController {
  constructor(private service: PasswordService<string>) {
    this.renderForgotPassword = this.renderForgotPassword.bind(this)
    this.forgotPassword = this.forgotPassword.bind(this)
    this.renderResetPassword = this.renderResetPassword.bind(this)
    this.resetPassword = this.resetPassword.bind(this)
    this.renderChangePassword = this.renderChangePassword.bind(this)
    this.changePassword = this.changePassword.bind(this)
  }
  renderForgotPassword(req: Request, res: Response) {
    const resource = getResource(req)
    res.render("forgot-password", {
      resource,
      user: {
        contact: "minhduc",
      },
      message: resource.forgot_password_message,
    })
  }
  forgotPassword(req: Request, res: Response) {
    const resource = getResource(req)
    const contact = req.body.contact as string
    if (isEmpty(contact)) {
      res.status(401).end(formatText(resource.required, resource.username_or_email))
      return
    }
    this.service
      .forgot(contact)
      .then((result) => {
        const status = result ? 200 : 404
        res.status(status).json(result).end()
      })
      .catch((err) => handleError(err, res))
  }
  renderResetPassword(req: Request, res: Response) {
    const resource = getResource(req)
    res.render("reset-password", {
      resource,
      user: {
        username: "minhduc",
        password: "Password1!",
      },
      message: "Enter login",
    })
  }
  resetPassword(req: Request, res: Response) {
    const resource = getResource(req)
    const user: PasswordReset = req.body
    if (isEmpty(user.username)) {
      res.status(401).end(formatText(resource.required, resource.username))
      return
    }
    if (isEmpty(user.passcode)) {
      res.status(401).end(formatText(resource.required, resource.passcode))
      return
    }
    if (isEmpty(user.password)) {
      res.status(401).end(formatText(resource.required, resource.new_password))
      return
    }
    this.service
      .reset(user)
      .then((result) => {
        const status = result > 0 ? 200 : result < 0 ? 409 : 403
        res.status(status).json(result).end()
      })
      .catch((err) => handleError(err, res))
  }
  renderChangePassword(req: Request, res: Response) {
    const resource = getResource(req)
    render(req, res, "change-password", {
      resource,
      user: {
        username: "kaka",
        password: "Password1!",
      },
      message: "Enter login",
    })
  }
  changePassword(req: Request, res: Response) {
    const resource = getResource(req)
    const user: PasswordChange = req.body
    user.username = res.locals.username
    if (isEmpty(user.currentPassword)) {
      res.status(401).end(formatText(resource.required, resource.current_password))
      return
    }
    if (isEmpty(user.password)) {
      res.status(401).end(formatText(resource.required, resource.new_password))
      return
    }
    this.service
      .change(user)
      .then((result) => {
        if (result < 0) {
          res.status(409).json(result).end()
        } else {
          res.status(200).json(result).end()
        }
      })
      .catch((err) => handleError(err, res))
  }
}

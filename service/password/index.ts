import { Request, Response } from "express"
import { formatText, handleError } from "express-ext"
import { Log } from "onecore"
import { PasswordChange, PasswordReset, PasswordService } from "password-service"
import { isEmpty } from "xvalidators"
import { getResource } from "../resources"

export class PasswordController {
  constructor(private service: PasswordService<string>, private log: Log) {
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
      return res.status(401).end(formatText(resource.required, resource.username_or_email))
    }
    this.service
      .forgot(contact)
      .then((result) => {
        const status = result ? 200 : 404
        res.status(status).json(result).end()
      })
      .catch((err) => handleError(err, res, this.log))
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
    const pass: PasswordReset = req.body
    if (isEmpty(pass.username)) {
      return res.status(401).end(formatText(resource.required, resource.username))
    }
    if (isEmpty(pass.passcode)) {
      return res.status(401).end(formatText(resource.required, resource.passcode))
    }
    if (isEmpty(pass.password)) {
      return res.status(401).end(formatText(resource.required, resource.new_password))
    }
    this.service
      .reset(pass)
      .then((result) => {
        const status = result > 0 ? 200 : result < 0 ? 409 : 403
        res.status(status).json(result).end()
      })
      .catch((err) => handleError(err, res, this.log))
  }
  renderChangePassword(req: Request, res: Response) {
    const resource = getResource(req)
    res.render("change-password", {
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
    const pass: PasswordChange = req.body
    if (isEmpty(pass.username)) {
      return res.status(401).end(formatText(resource.required, resource.username))
    }
    if (isEmpty(pass.currentPassword)) {
      return res.status(401).end(formatText(resource.required, resource.current_password))
    }
    if (isEmpty(pass.password)) {
      return res.status(401).end(formatText(resource.required, resource.new_password))
    }
    this.service
      .change(pass)
      .then((result) => {
        if (result < 0) {
          res.status(409).json(result).end()
        } else {
          res.status(200).json(result).end()
        }
      })
      .catch((err) => handleError(err, res, this.log))
  }
}

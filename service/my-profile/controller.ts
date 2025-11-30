import { Request, Response } from "express"
import { escape, handleError, respondError } from "express-ext"
import { Log } from "onecore"
import { validate } from "xvalidators"
import { getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { MyProfileService, User, userModel, UserSettings } from "./user"

export class MyProfileController {
  constructor(private service: MyProfileService, private log: Log) {
    this.getInterests = this.getInterests.bind(this)
    this.getInterestsUpdate = this.getInterestsUpdate.bind(this)

    this.view = this.view.bind(this)
    this.submit = this.submit.bind(this)
    this.viewSettings = this.viewSettings.bind(this)
    this.saveSettings = this.saveSettings.bind(this)
  }
  view(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const lang = getLang(req)
    const resource = getResource(lang)
    this.service
      .getMyProfile(userId)
      .then((user) => {
        if (!user) {
          renderError404(req, res, resource)
        } else {
          render(req, res, "my-profile", { resource, user: escape(user) })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
  getInterests(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const lang = getLang(req)
    const resource = getResource(lang)
    this.service
      .getMyProfile(userId)
      .then((user) => {
        if (!user) {
          res.status(404).end("Cannot load user profile")
        } else {
          res.render("pages/user/interests", { resource, user })
        }
      })
      .catch((err) => handleError(err, res, this.log))
  }
  getInterestsUpdate(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const lang = getLang(req)
    const resource = getResource(lang)
    console.log("user id " + userId)
    this.service
      .getMyProfile(userId)
      .then((user) => {
        if (!user) {
          res.status(404).end("Cannot load user profile")
        } else {
          res.render("pages/user/interests_update", { resource, user: escape(user) })
        }
      })
      .catch((err) => handleError(err, res, this.log))
  }
  submit(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    console.log("Enter submit my profile")
    const user = req.body as User
    user.id = res.locals.userId as string
    console.log("my profile " + JSON.stringify(user))
    const errors = validate<User>(user, userModel, resource, true, true)
    if (errors.length > 0) {
      return respondError(res, errors)
    }
    this.service
      .saveMyProfile(user)
      .then((result) => {
        if (result === 0) {
          res.status(410).end()
        } else {
          res.status(200).json(user).end()
        }
      })
      .catch((err) => handleError(err, res, this.log))
  }
  viewSettings(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const lang = getLang(req)
    const resource = getResource(lang)
    this.service
      .getMySettings(userId)
      .then((settings) => {
        if (!settings) {
          renderError404(req, res, resource)
        } else {
          render(req, res, "settings", { resource, settings: escape(settings) })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
  saveSettings(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const settings: UserSettings = req.body
    if (!settings) {
      return res.status(400).send("data cannot be empty")
    }
    this.service
      .saveMySettings(userId, settings)
      .then((result) => {
        if (result === 0) {
          res.status(410).end()
        } else {
          res.status(200).json(result).end()
        }
      })
      .catch((err) => handleError(err, res, this.log))
  }
}

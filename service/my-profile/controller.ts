import { Request, Response } from "express"
import {
  escape,
  handleError,
  respondError
} from "express-ext"
import { isSuccessful, Log, SaveStrings } from "onecore"
import { validate } from "xvalidators"
import { getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { MyProfileService, User, userModel, UserSettings } from "./user"

const targetTemplates: string[] = ["interests", "bio", "skills", "achievements"]
export class MyProfileController {
  constructor(private service: MyProfileService, private log: Log, private saveSkills?: SaveStrings, private saveInterests?: SaveStrings) {
    this.viewSettings = this.viewSettings.bind(this)
    this.saveSettings = this.saveSettings.bind(this)

    this.getPartial = this.getPartial.bind(this)
    this.getInfo = this.getInfo.bind(this)
    this.getBio = this.getBio.bind(this)
    this.getBioUpdate = this.getBioUpdate.bind(this)
    this.getInfoUpdate = this.getInfoUpdate.bind(this)
    this.getSkills = this.getSkills.bind(this)
    this.getSkillsUpdate = this.getSkillsUpdate.bind(this)
    this.getInterests = this.getInterests.bind(this)
    this.getInterestsUpdate = this.getInterestsUpdate.bind(this)
    this.getAchievements = this.getAchievements.bind(this)
    this.getAchievementsUpdate = this.getAchievementsUpdate.bind(this)

    this.view = this.view.bind(this)
    this.submit = this.submit.bind(this)
  }
  async viewSettings(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const lang = getLang(req)
    const resource = getResource(lang)
    try {
      const settings = await this.service.getMySettings(userId)
      if (!settings) {
        return renderError404(req, res, resource)
      }
      render(req, res, "settings", { resource, settings: escape(settings) })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async saveSettings(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const settings: UserSettings = req.body
    try {
      const result = await this.service.saveMySettings(userId, settings)
      const status = isSuccessful(result) ? 200 : 410
      res.status(status).json(result).end()
    } catch (err) {
      handleError(err, res, this.log)
    }
  }
  async getPartial(req: Request, res: Response, name: string) {
    const userId: string = res.locals.userId
    const lang = getLang(req)
    const resource = getResource(lang)
    try {
      const user = await this.service.getMyProfile(userId)
      if (!user) {
        res.status(404).end("Cannot load user profile")
      } else {
        res.render("pages/my-profile/" + name, { resource, user: escape(user) })
      }
    } catch (err) {
      handleError(err, res, this.log)
    }
  }
  getInfo(req: Request, res: Response) {
    this.getPartial(req, res, "info")
  }
  getInfoUpdate(req: Request, res: Response) {
    this.getPartial(req, res, "info_update")
  }
  getBio(req: Request, res: Response) {
    this.getPartial(req, res, "bio")
  }
  getBioUpdate(req: Request, res: Response) {
    this.getPartial(req, res, "bio_update")
  }
  getSkills(req: Request, res: Response) {
    this.getPartial(req, res, "skills")
  }
  getSkillsUpdate(req: Request, res: Response) {
    this.getPartial(req, res, "skills_update")
  }
  getInterests(req: Request, res: Response) {
    this.getPartial(req, res, "interests")
  }
  getInterestsUpdate(req: Request, res: Response) {
    this.getPartial(req, res, "interests_update")
  }
  getAchievements(req: Request, res: Response) {
    this.getPartial(req, res, "achievements")
  }
  getAchievementsUpdate(req: Request, res: Response) {
    this.getPartial(req, res, "achievements_update")
  }
  async view(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const lang = getLang(req)
    const resource = getResource(lang)
    try {
      const user = await this.service.getMyProfile(userId)
      if (!user) {
          renderError404(req, res, resource)
        } else {
          render(req, res, "my-profile", { resource, user: escape(user) })
        }
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async submit(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    console.log("Enter submit my profile")
    const user = req.body as User
    const keys = Object.keys(user)
    let targetTemplate: string | undefined
    if (keys.length === 1 && targetTemplates.includes(keys[0])) {
      targetTemplate = keys[0]
    } else {
      targetTemplate = "info"
    }
    user.id = res.locals.userId as string
    console.log("my profile " + JSON.stringify(user))
    const errors = validate<User>(user, userModel, resource, true, true)
    if (errors.length > 0) {
      respondError(res, errors)
      return
    }
    if (this.saveSkills && user.skills) {
      const skills = user.skills.map((i) => i.skill)
      this.saveSkills(skills)
    }
    if (this.saveInterests && user.interests) {
      this.saveInterests(user.interests)
    }
    try {
      const result = await this.service.saveMyProfile(user)
      if (result === 0) {
        res.status(410).end()
      } else if (targetTemplate) {
        res.render("pages/my-profile/" + targetTemplate, { resource, user: escape(user) })
      } else {
        delete user.id
        res.status(200).json(user).end()
      }
    } catch (err) {
      handleError(err, res, this.log)
    }
  }
}

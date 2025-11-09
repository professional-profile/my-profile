import { Request, Response } from "express"
import { escape, handleError, respondError } from "express-ext"
import { Log } from "onecore"
import { DB, Repository } from "query-core"
import { validate } from "xvalidators"
import { getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { MyProfileService, User, userModel, UserRepository, UserSettings } from "./user"

const settings: UserSettings = {
  language: "en-us",
  dateFormat: "dd/mm/yyyy",
  timeFormat: "hh:mm:ss",
  notification: true,
  dateTimeFormat: "dd-mm-yyyy:hh:mm",
  emailFeedUpdates: true,
  notifyPostMentions: true,
  emailPostMentions: false,
  emailCommentsOfYourPosts: true,
  notifyCommentsOfYourPosts: true,
  showMyProfileInSpacesAroundMe: true,
  emailEventInvitations: true,
  emailWhenNewEventsAround: false,
  showAroundMeResultsInMemberFeed: true,
  followingListPublicOnMyProfile: true,
  notifyWhenNewEventsAround: true,
  searchEnginesLinksToMyProfile: false,
  notifyFeedUpdates: false,
  notifyEventInvitations: false,
}
export class SqlUserRepository extends Repository<User, string> implements UserRepository {
  constructor(db: DB) {
    super(db, "users", userModel)
  }
}

export class MyProfileUseCase implements MyProfileService {
  constructor(private repository: UserRepository) {}
  getMyProfile(id: string): Promise<User | null> {
    return this.repository.load(id).then((user) => {
      let rs = null
      if (user) {
        delete user.settings
        rs = user
      }
      return rs
    })
  }
  saveMyProfile(user: User): Promise<number> {
    return this.repository.patch(user)
  }
  getMySettings(id: string): Promise<UserSettings | null> {
    return this.repository.load(id).then((user) => (user && user.settings ? user.settings : settings))
  }
  saveMySettings(id: string, settings: UserSettings): Promise<number> {
    return this.repository.patch({ id, settings })
  }
}

export class MyProfileController {
  constructor(private service: MyProfileService, private log: Log) {
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
  submit(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const user = req.body as User
    user.id = res.locals.userId as string
    const errors = validate<User>(user, userModel, resource)
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

export function useMyProfileController(db: DB, log: Log): MyProfileController {
  const repository = new SqlUserRepository(db)
  const service = new MyProfileUseCase(repository)
  return new MyProfileController(service, log)
}

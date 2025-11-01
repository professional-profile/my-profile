import { Request, Response } from "express"
import { escape, handleError, respondError } from "express-ext"
import { Log } from "onecore"
import { DB, Repository } from "query-core"
import { validate } from "xvalidators"
import { getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { MyProfileService, User, userModel, UserRepository } from "./user"

export class SqlUserRepositoy extends Repository<User, string> implements UserRepository {
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
}

export class MyProfileController {
  constructor(private service: MyProfileService, private log: Log) {
    this.view = this.view.bind(this)
    this.submit = this.submit.bind(this)
  }
  view(req: Request, res: Response) {
    const account = res.locals.account
    console.log(req.originalUrl)
    if (!account) {
      return res.redirect(`login?redirectUrl=${req.url}`)
    }
    const id = account.id
    const lang = getLang(req)
    const resource = getResource(lang)
    this.service
      .getMyProfile(id)
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
    const account = res.locals.account
    console.log(req.originalUrl)
    if (!account) {
      console.log("not log in")
      return res.redirect(`login?redirectUrl=${req.url}`)
    }
    const userId: string = account.id
    const lang = getLang(req)
    const resource = getResource(lang)
    const user = req.body as User
    const errors = validate<User>(user, userModel, resource)
    if (errors.length > 0) {
      return respondError(res, errors)
    }
    user.id = userId
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
}

export function useMyProfileController(db: DB, log: Log): MyProfileController {
  const repository = new SqlUserRepositoy(db)
  const service = new MyProfileUseCase(repository)
  return new MyProfileController(service, log)
}

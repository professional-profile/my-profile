import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  escape,
  escapeArray,
  FollowController,
  fromRequest,
  getOffset,
  getSearch,
  hasSearch,
  resources
} from "express-ext"
import { Log } from "onecore"
import { getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { UserFilter, UserService } from "./user"

const fields = ["id", "username", "email", "displayName", "status"]
export class UserController extends FollowController {
  constructor(protected service: UserService, protected log: Log) {
    super(service, log, "id", "userId")
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
    this.getFollowers = this.getFollowers.bind(this)
    this.getFollowing = this.getFollowing.bind(this)
  }
  search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    let filter: UserFilter = {
      q: "",
      limit: resources.defaultLimit,
    }
    if (hasSearch(req)) {
      filter = fromRequest<UserFilter>(req, ["status"])
    }
    const { page, limit, sort } = filter
    const offset = getOffset(limit, page)
    filter.userId = res.locals.userId
    this.service
      .search(filter, limit, page)
      .then((result) => {
        const list = escapeArray(result.list, offset, "sequence")
        if (list && list.length > 0) {
          list.forEach((user) => {
            if (!user.username) {
              user.username = user.id
            }
          })
        }
        const search = getSearch(req.url)
        render(req, res, "users", {
          resource,
          limits: resources.limits,
          filter,
          list,
          pages: buildPages(limit, result.total),
          pageSearch: buildPageSearch(search),
          sort: buildSortSearch(search, fields, sort),
          message: buildMessage(resource, list, limit, page, result.total),
        })
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
  view(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const id = req.params.id
    const userId: string = res.locals.userId
    this.service
      .load(id, userId)
      .then((user) => {
        if (!user) {
          return renderError404(req, res, resource)
        }
        const partial = req.query.partial as string
        const view = partial === "true" ? "user/main" : "user"
        render(req, res, view, {
          resource,
          user: escape(user),
        })
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
  getFollowers(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const id = req.params.id
    const userId: string = res.locals.userId
    this.service
      .load(id, userId)
      .then((user) => {
        if (!user) {
          return renderError404(req, res, resource)
        }
        let filter: UserFilter = {
          q: "",
          limit: resources.defaultLimit,
        }
        if (hasSearch(req)) {
          filter = fromRequest<UserFilter>(req, ["status"])
        }
        const { page, limit, sort } = filter
        const offset = getOffset(limit, page)
        filter.userId = res.locals.userId
        this.service
          .search(filter, limit, page)
          .then((result) => {
            const list = escapeArray(result.list, offset, "sequence")
            if (list && list.length > 0) {
              list.forEach((user) => {
                if (!user.username) {
                  user.username = user.id
                }
              })
            }
            const search = getSearch(req.url)
            const partial = req.query.partial as string
            const view = partial === "true" ? "user/followers" : "user-followers"
            render(req, res, view, {
              resource,
              user: escape(user),
              limits: resources.limits,
              filter,
              list,
              pages: buildPages(limit, result.total),
              pageSearch: buildPageSearch(search),
              sort: buildSortSearch(search, fields, sort),
              message: buildMessage(resource, list, limit, page, result.total),
            })
          })
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
  getFollowing(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const id = req.params.id
    const userId: string = res.locals.userId
    this.service
      .load(id, userId)
      .then((user) => {
        if (!user) {
          return renderError404(req, res, resource)
        }
        let filter: UserFilter = {
          q: "",
          limit: resources.defaultLimit,
        }
        if (hasSearch(req)) {
          filter = fromRequest<UserFilter>(req, ["status"])
        }
        const { page, limit, sort } = filter
        const offset = getOffset(limit, page)
        filter.userId = res.locals.userId
        this.service
          .search(filter, limit, page)
          .then((result) => {
            const list = escapeArray(result.list, offset, "sequence")
            if (list && list.length > 0) {
              list.forEach((user) => {
                if (!user.username) {
                  user.username = user.id
                }
              })
            }
            const search = getSearch(req.url)
            const partial = req.query.partial as string
            const view = partial === "true" ? "user/following" : "user-following"
            render(req, res, view, {
              resource,
              user: escape(user),
              limits: resources.limits,
              filter,
              list,
              pages: buildPages(limit, result.total),
              pageSearch: buildPageSearch(search),
              sort: buildSortSearch(search, fields, sort),
              message: buildMessage(resource, list, limit, page, result.total),
            })
          })
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
}

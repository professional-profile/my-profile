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
  isPartial,
  isSubPartial,
  resources
} from "express-web-utilities"
import { getLang, getLangSearch, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { UserFilter, UserService } from "./user"

const fields = ["id", "username", "email", "displayName", "status"]
export class UserController extends FollowController {
  constructor(protected service: UserService) {
    super(service, "id", "userId")
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
    this.getFollowers = this.getFollowers.bind(this)
    this.getFollowing = this.getFollowing.bind(this)
  }
  async search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const langSearch = getLangSearch(lang)
    let filter: UserFilter = { limit: resources.defaultLimit }
    if (hasSearch(req)) {
      filter = fromRequest<UserFilter>(req, ["status"])
    }
    const { page, limit, sort } = filter
    const offset = getOffset(limit, page)
    filter.userId = res.locals.userId
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list, offset, "sequence")
      if (list.length > 0) {
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
        langSearch,
        sort: buildSortSearch(search, fields, sort),
        message: buildMessage(resource, list, limit, page, result.total),
      })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async view(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const langSearch = getLangSearch(lang)
    const id = req.params.id
    const userId: string = res.locals.userId
    try {
      const user = await this.service.load(id, userId)
      if (!user) {
        return renderError404(req, res, resource)
      }
      const partial = isPartial(req)
      const subPartial = isSubPartial(req)
      const view = partial && subPartial ? "user/main" : "user"
      render(req, res, view, { resource, langSearch, user: escape(user) })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async getFollowers(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const userId: string = res.locals.userId
    let filter: UserFilter = { limit: resources.defaultLimit }
    if (hasSearch(req)) {
      filter = fromRequest<UserFilter>(req, ["status"])
    }
    filter.userId = userId
    const id = await this.service.getIdBySlug(req.params.id)
    filter.followedUserId = id
    const { page, limit, sort } = filter
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list)
      if (list.length > 0) {
        list.forEach((user) => {
          if (!user.username) {
            user.username = user.id
          }
        })
      }
      const search = getSearch(req.url)
      const ctx: any = {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        sort: buildSortSearch(search, fields, sort),
        message: buildMessage(resource, list, limit, page, result.total),
      }
      const partial = isPartial(req)
      const subPartial = isSubPartial(req)
      const view = partial && subPartial ? "user/followers" : "user-followers"
      if (!partial) {
        const id = req.params.id
        const user = await this.service.load(id, userId)
        if (!user) {
          return renderError404(req, res, resource)
        }
        ctx.user = escape(user)
      }
      render(req, res, view, ctx)
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async getFollowing(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const userId = res.locals.userId
    let filter: UserFilter = { limit: resources.defaultLimit }
    if (hasSearch(req)) {
      filter = fromRequest<UserFilter>(req, ["status"])
    }
    filter.userId = userId
    const id = await this.service.getIdBySlug(req.params.id)
    filter.followingUserId = id
    const { page, limit, sort } = filter
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list)
      if (list.length > 0) {
        list.forEach((user) => {
          if (!user.username) {
            user.username = user.id
          }
        })
      }
      const search = getSearch(req.url)
      const ctx: any = {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        sort: buildSortSearch(search, fields, sort),
        message: buildMessage(resource, list, limit, page, result.total),
      }
      const partial = isPartial(req)
      const subPartial = isSubPartial(req)
      const view = partial && subPartial ? "user/following" : "user-following"
      if (!partial) {
        const id = req.params.id
        const user = await this.service.load(id, userId)
        if (!user) {
          return renderError404(req, res, resource)
        }
        ctx.user = escape(user)
      }
      render(req, res, view, ctx)
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
}

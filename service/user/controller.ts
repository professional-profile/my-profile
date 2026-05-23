import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSorts,
  buildSortSearch,
  escape,
  escapeArray,
  FollowController,
  format,
  fromRequest,
  getSearch,
  getSortText,
  hasSearch,
  isPartial,
  isSubPartial,
  removeSort,
  resources
} from "express-core-web"
import { Item } from "onecore"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getLangSearch, getResource } from "../resources"
import { Published } from "../shared/article"
import { render, renderError404, renderError500 } from "../template"
import { ArticleFilter } from "./article"
import { CompanyFilter } from "./company"
import { User, UserFilter, UserService } from "./user"

const fields = ["id", "username", "email", "displayName", "status"]
export class UserController extends FollowController {
  constructor(protected service: UserService) {
    super(service, "id", "userId")
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
    this.getFollowers = this.getFollowers.bind(this)
    this.getFollowing = this.getFollowing.bind(this)
    this.getArticles = this.getArticles.bind(this)
    this.getCompanies = this.getCompanies.bind(this)
  }
  async search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const langSearch = getLangSearch(lang)
    let filter: UserFilter = { limit: resources.defaultLimit }
    if (hasSearch(req)) {
      filter = fromRequest<UserFilter>(req, ["status"])
    }
    filter.userId = res.locals.userId
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
    const slug = req.params.slug
    const userId: string = res.locals.userId
    try {
      const user = await this.service.load(slug, userId)
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
    const id = await this.service.getIdBySlug(req.params.slug)
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
        const slug = req.params.slug
        const user = await this.service.load(slug, userId)
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
    const id = await this.service.getIdBySlug(req.params.slug)
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
        const slug = req.params.slug
        const user = await this.service.load(slug, userId)
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
  async getArticles(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const langSearch = getLangSearch(lang)
    const userId = res.locals.userId
    let filter: ArticleFilter = {
      limit: resources.defaultLimit,
      publishedAt: {},
    }
    if (hasSearch(req)) {
      filter = fromRequest<ArticleFilter>(req)
      format(filter, ["publishedAt"])
    }
    if (!filter.sort) {
      filter.sort = "-publishedAt"
    }
    filter.status = Published
    filter.userId = userId
    const { page, limit } = filter

    const slug = req.params.slug
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    const view = partial && subPartial ? "user/articles" : "user-articles"
    let authorId = ""
    let user: User | null = null
    try {
      if (partial) {
        authorId = await this.service.getIdBySlug(slug)
      } else {
        user = await this.service.load(slug, userId)
        if (!user) {
          return renderError404(req, res, resource)
        }
        authorId = user.id
      }
      filter.authorId = authorId
      const result = await this.service.getArticles(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of result.list) {
        item.publishedAt = formatDateTime(item.publishedAt, dateFormat)
      }
      const search = getSearch(req.url)
      const sortSearch = removeSort(search)
      const prefix = sortSearch ? `?${sortSearch}&` : "?"
      const sort1: Item = { id: "timeDescSort", value: `${prefix}${resources.sort}=-publishedAt`, text: resource.sort_time_desc }
      const sort2: Item = { id: "timeAscSort", value: `${prefix}${resources.sort}=publishedAt`, text: resource.sort_time_asc }
      const sortText = filter.sort == "publishedAt" ? resource.sort_desc_time_asc : resource.sort_desc_time_desc
      const ctx: any = {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        langSearch,
        sorts: [sort1, sort2],
        sortText,
        message: buildMessage(resource, list, limit, page, result.total),
      }
      if (user) {
        ctx.user = escape(user)
      }
      render(req, res, view, ctx)
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async getCompanies(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const langSearch = getLangSearch(lang)
    let filter: CompanyFilter = { limit: resources.defaultLimit }
    if (hasSearch(req)) {
      filter = fromRequest<CompanyFilter>(req)
    }
    if (!filter.sort) {
      filter.sort = "-following_at"
    }
    filter.status = Published
    filter.currentUserId = res.locals.userId
    const { page, limit } = filter

    const slug = req.params.slug
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    const view = partial && subPartial ? "user/companies" : "user-companies"
    let user: User | null = null
    try {
      if (partial) {
        const id = await this.service.getIdBySlug(slug)
        filter.userId = id
      } else {
        user = await this.service.load(slug, res.locals.userId)
        if (!user) {
          return renderError404(req, res, resource)
        }
        filter.userId = user.id
      }
      const result = await this.service.getCompanies(filter, limit, page)
      const list = escapeArray(result.list)
      const search = getSearch(req.url)

      const sortSearch = removeSort(search)
      const prefix = sortSearch ? `?${sortSearch}&` : `?`
      const sort1: Item = { id: "followingDescSort", value: "-followingAt", text: resource.sort_time_desc }
      const sort2: Item = { id: "followingAscSort", value: "followingAt", text: resource.sort_time_asc }
      const sort3: Item = { id: "nameAscSort", value: "name", text: resource.sort_name_asc }
      const sort4: Item = { id: "nameDescSort", value: "-name", text: resource.sort_name_desc }
      const sorts = [sort1, sort2, sort3, sort4]
      const sortText = getSortText(sorts, filter.sort, resource.sort_time_desc)
      buildSorts(sorts, `${prefix}${resources.sort}=`)

      const ctx: any = {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        langSearch,
        sorts,
        sortText,
        message: buildMessage(resource, list, limit, page, result.total),
      }
      if (user) {
        ctx.user = escape(user)
      }
      render(req, res, view, ctx)
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
}

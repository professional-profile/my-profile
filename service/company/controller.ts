import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  escape,
  escapeArray,
  FollowController,
  fromRequest,
  getSearch,
  hasSearch,
  isPartial,
  isSubPartial,
  removeSort,
  resources
} from "express-core-web"
import { Item } from "onecore"
import { getLang, getLangSearch, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { Company, CompanyFilter, CompanyService } from "./company"
import { UserFilter } from "./user"

export class CompanyController extends FollowController {
  constructor(protected service: CompanyService) {
    super(service, "id", "userId")
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
    this.getFollowers = this.getFollowers.bind(this)
  }
  async search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const langSearch = getLangSearch(lang)
    let filter: CompanyFilter = { limit: resources.defaultLimit }
    if (hasSearch(req)) {
      filter = fromRequest<CompanyFilter>(req)
    }
    filter.userId = res.locals.userId
    const { page, limit, sort } = filter
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list)
      const search = getSearch(req.url)

      const sortSearch = removeSort(search)
      const prefix = sortSearch ? `?${sortSearch}&` : "?"
      const sort1: Item = { id: "timeDescSort", value: `${prefix}${resources.sort}=-publishedAt`, text: resource.sort_time_desc }
      const sort2: Item = { id: "timeAscSort", value: `${prefix}${resources.sort}=publishedAt`, text: resource.sort_time_asc }
      const sortText = sort == "publishedAt" ? resource.sort_desc_time_asc : resource.sort_desc_time_desc

      render(req, res, "companies", {
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
      })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async view(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const slug = req.params.slug
    const userId: string = res.locals.userId
    try {
      const company = await this.service.load(slug, userId)
      if (!company) {
        return renderError404(req, res, resource)
      }
      render(req, res, "company", { resource, company })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }

  async getFollowers(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const slug = req.params.slug
    const userId: string = res.locals.userId
    let id = ""
    let company: Company | null = null
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    const view = partial && subPartial ? "shared/followers" : "company-followers"
    try {
      if (partial) {
        id = await this.service.getIdBySlug(slug)
      } else {
        company = await this.service.load(slug, userId)
        if (!company) {
          return renderError404(req, res, resource)
        }
        id = company.id
      }
      let filter: UserFilter = { limit: resources.defaultLimit, companyId: id }
      if (hasSearch(req)) {
        filter = fromRequest<UserFilter>(req)
      }
      filter.userId = userId
      filter.companyId = id
      const { page, limit } = filter
      const result = await this.service.getFollowers(filter, limit, page)
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
        message: buildMessage(resource, list, limit, page, result.total),
      }
      if (company) {
        ctx.company = escape(company)
      }
      render(req, res, view, ctx)
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
}

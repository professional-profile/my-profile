import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSorts,
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
} from "express-web-kit"
import { Item } from "onecore"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getLangSearch, getResource } from "../resources"
import { Published } from "../shared/article"
import { JobFilter } from "../shared/job"
import { render, renderError404, renderError500 } from "../template"
import { ArticleFilter } from "./article"
import { Company, CompanyFilter, CompanyService } from "./company"
import { UserFilter } from "./user"

export class CompanyController extends FollowController {
  constructor(protected service: CompanyService) {
    super(service, "id", "userId")
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
    this.getArticles = this.getArticles.bind(this)
    this.getJobs = this.getJobs.bind(this)
    this.getFollowers = this.getFollowers.bind(this)
    this.review = this.review.bind(this)
    this.getJobs = this.getJobs.bind(this)
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
      render(req, res, "companies", {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        langSearch,
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
    const slug = req.params.slug as string
    const userId: string = res.locals.userId
    try {
      const company = await this.service.load(slug, userId)
      if (!company) {
        return renderError404(req, res, resource)
      }
      const partial = isPartial(req)
      const subPartial = isSubPartial(req)
      const view = partial && subPartial ? "company/main" : "company"
      render(req, res, view, { resource, langSearch, company: escape(company) })
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

    const slug = req.params.slug as string
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    const view = partial && subPartial ? "company/articles" : "company-articles"
    let companyId = ""
    let company: Company | null = null
    try {
      if (partial) {
        companyId = await this.service.getIdBySlug(slug)
      } else {
        company = await this.service.load(slug, userId)
        if (!company) {
          return renderError404(req, res, resource)
        }
        companyId = company.id
      }
      filter.companyId = companyId
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
      if (company) {
        ctx.company = escape(company)
      }
      render(req, res, view, ctx)
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }

  async getJobs(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const langSearch = getLangSearch(lang)
    const userId = res.locals.userId
    let filter: JobFilter = {
      limit: resources.defaultLimit,
      publishedAt: {},
    }
    if (hasSearch(req)) {
      filter = fromRequest<JobFilter>(req)
      format(filter, ["publishedAt"])
    }
    if (!filter.sort) {
      filter.sort = "-publishedAt"
    }
    //filter.status = Published
    const { page, limit } = filter

    const slug = req.params.slug as string
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    const view = partial && subPartial ? "company/jobs" : "company-jobs"
    let companyId = ""
    let company: Company | null = null
    try {
      if (partial) {
        companyId = await this.service.getIdBySlug(slug)
      } else {
        company = await this.service.load(slug, userId)
        if (!company) {
          return renderError404(req, res, resource)
        }
        companyId = company.id
      }
      filter.companyId = companyId
      const result = await this.service.getJobs(filter, limit, page)
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
      if (company) {
        ctx.company = escape(company)
      }
      render(req, res, view, ctx)
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }

  async getFollowers(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const slug = req.params.slug as string
    const userId: string = res.locals.userId
    let id = ""
    let company: Company | null = null
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    const view = partial && subPartial ? "company/followers" : "company-followers"
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
      if (!filter.sort) {
        filter.sort = "-followedAt"
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

      const sortSearch = removeSort(search)
      const prefix = sortSearch ? `?${sortSearch}&` : `?`
      const sort1: Item = { id: "timeDescSort", value: "-followedAt", text: resource.sort_time_desc }
      const sort2: Item = { id: "timeAscSort", value: "followedAt", text: resource.sort_time_asc }
      const sort3: Item = { id: "nameAscSort", value: "displayName", text: resource.sort_name_asc }
      const sort4: Item = { id: "nameDescSort", value: "-displayName", text: resource.sort_name_desc }
      const sorts = [sort1, sort2, sort3, sort4]
      const sortText = getSortText(sorts, filter.sort, resource.sort_time_desc, true)
      buildSorts(sorts, `${prefix}${resources.sort}=`)

      const ctx: any = {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        sorts,
        sortText,
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

  async review(req: Request, res: Response) {
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    const view = partial && subPartial ? "company/reviews" : "company-reviews"
    render(req, res, view, {})
  }
}

import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSorts,
  escape,
  escapeArray,
  escapeHTML,
  FollowController,
  format,
  fromRequest,
  getSearch,
  getSortText,
  handleError,
  hasSearch,
  isPartial,
  isSubPartial,
  removeField,
  removeSort,
  resources
} from "express-web-kit"
import { Item } from "onecore"
import { RateService, SubmittedRate } from "rate-service"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getLangSearch, getResource } from "../resources"
import { Published } from "../shared/article"
import { Company } from "../shared/company"
import { JobFilter } from "../shared/job"
import { calculatePercent, formatRate } from "../shared/rate"
import { RateFilter } from "../shared/rates"
import { render, renderError404, renderError500 } from "../template"
import { ArticleFilter, CompanyFilter, CompanyService, UserFilter } from "./company"

export class CompanyController extends FollowController {
  constructor(protected service: CompanyService, protected rateService: RateService) {
    super(service, "id", "userId")
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
    this.getArticles = this.getArticles.bind(this)
    this.getJobs = this.getJobs.bind(this)
    this.getFollowers = this.getFollowers.bind(this)
    this.review = this.review.bind(this)
    this.getJobs = this.getJobs.bind(this)
    this.review = this.review.bind(this)
    this.rate = this.rate.bind(this)
    this.setUseful = this.setUseful.bind(this)
    this.removeUseful = this.removeUseful.bind(this)
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
    filter.status = Published
    filter.userId = userId
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
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    const view = partial && subPartial ? "company/followers" : "company-followers"
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
      let filter: UserFilter = { limit: resources.defaultLimit, companyId }
      if (hasSearch(req)) {
        filter = fromRequest<UserFilter>(req)
      }
      if (!filter.sort) {
        filter.sort = "-followedAt"
      }
      filter.userId = userId
      filter.companyId = companyId
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
      const sort1: Item = { id: "timeDescSort", value: "-followedAt", text: resource.sort_time_desc, fulltext: resource.sort_desc_time_desc }
      const sort2: Item = { id: "timeAscSort", value: "followedAt", text: resource.sort_time_asc, fulltext: resource.sort_desc_time_asc }
      const sort3: Item = { id: "nameAscSort", value: "displayName", text: resource.sort_name_asc, fulltext: resource.sort_desc_name_asc }
      const sort4: Item = { id: "nameDescSort", value: "-displayName", text: resource.sort_name_desc, fulltext: resource.sort_desc_name_desc }
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
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const userId: string = res.locals.userId
    const slug = req.params.slug as string
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    let view = !partial && !subPartial ? "company-reviews" : "company/reviews"
    if (req.query.dropdownChange === "true") {
      view = "shared/reviews"
    }
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
      let filter: RateFilter = { id: companyId, limit: resources.defaultLimit }
      if (hasSearch(req)) {
        filter = fromRequest<RateFilter>(req)
        format(filter, ["time"])
      }
      if (!filter.sort) {
        filter.sort = "-usefulCount"
      }
      filter.id = companyId
      filter.userId = res.locals.userId
      const { page, limit } = filter
      const result = await this.service.searchRates(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of result.list) {
        item.time = formatDateTime(item.time, dateFormat)
        calculatePercent(item)
      }
      let search = getSearch(req.url)
      search = removeField(search, "dropdownChange")

      let rateSearch = removeField(search, "rate")
      rateSearch = removeField(rateSearch, resources.partial)
      rateSearch = removeField(rateSearch, resources.subPartial)
      rateSearch = rateSearch ? `dropdownChange=true&${rateSearch}` : `dropdownChange=true`
      const srate = req.query.rate
      const rateText = typeof srate === 'string' ? `${srate} ☆` : resource.all
      let ratePrefix = rateSearch ? `?${rateSearch}` : `?`
      const rates: Item[] = [{ id: "rateAll", value: `${ratePrefix}`, text: resource.all }]
      ratePrefix = rateSearch ? `?${rateSearch}&` : `?`
      for (let i = 1; i <= 5; i++) {
        rates.push({ id: `rate${i}`, value: `${ratePrefix}rate=${i}`, text: `${i} ☆` })
      }

      const sortSearch = removeSort(search)
      const prefix = sortSearch ? `?${sortSearch}&` : `?`
      const sort0: Item = { id: "usefulDescSort", value: "-usefulCount", text: resource.sort_useful_desc, fulltext: resource.sort_desc_useful_desc }
      const sort1: Item = { id: "timeDescSort", value: "-time", text: resource.sort_time_desc, fulltext: resource.sort_desc_time_desc }
      const sort2: Item = { id: "timeAscSort", value: "time", text: resource.sort_time_asc, fulltext: resource.sort_desc_time_asc }
      const sort3: Item = { id: "rateDescSort", value: "-rate", text: resource.sort_rate_desc, fulltext: resource.sort_desc_rate_desc }
      const sort4: Item = { id: "rateAscSort", value: "rate", text: resource.sort_rate_asc, fulltext: resource.sort_desc_rate_asc }
      const sorts = [sort0, sort1, sort2, sort3, sort4]
      const sortText = getSortText(sorts, filter.sort, resource.sort_desc_useful_desc)
      buildSorts(sorts, `${prefix}dropdownChange=true&${resources.sort}=`)

      if (filter.sort && filter.sort != "time" && filter.sort != "-time") {
        filter.sort = filter.sort + ",-time"
      }
      const ctx: any = {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        sorts,
        sortText,
        rates,
        rateText,
        message: buildMessage(resource, list, limit, page, result.total),
      }
      if (company) {
        ctx.company = escape(company)
      }
      if (!req.query.dropdownChange) {
        const summary = await this.service.getRateSummary(companyId)
        ctx.rate = formatRate(summary)
        if (userId) {
          const userRate = await this.rateService.getRate(companyId, userId)
          ctx.review = userRate ? { rate: userRate.rate, review: escapeHTML(userRate.review) } : {}
        }
      }
      render(req, res, view, ctx)
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async rate(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const rate = req.body as SubmittedRate
    const slug = req.params.slug as string
    try {
      const id = await this.service.getIdBySlug(slug)
      /*
      if (id === slug) {
        res.status(404).json(0).end()
        return
      }
      */
      rate.id = id
      rate.author = res.locals.userId
      await this.rateService.rate(rate)
      const rateSummary = await this.service.getRateSummary(id)
      res.render("partials/rating-summary", { resource, rate: formatRate(rateSummary) })
    } catch (err) {
      handleError(err, res)
    }
  }
  async setUseful(req: Request, res: Response) {
    const rateId = req.params.rateId as string
    const userId: string = res.locals.userId
    try {
      const result = await this.rateService.setUseful(rateId, userId)
      const status = result > 0 ? 200 : 409
      res.status(status).json(result).end()
    } catch (err) {
      handleError(err, res)
    }
  }
  async removeUseful(req: Request, res: Response) {
    const rateId = req.params.rateId as string
    const userId: string = res.locals.userId
    try {
      const result = await this.rateService.removeUseful(rateId, userId)
      const status = result > 0 ? 200 : 410
      res.status(status).json(result).end()
    } catch (err) {
      handleError(err, res)
    }
  }
}

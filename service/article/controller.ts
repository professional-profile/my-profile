import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  escapeArray,
  escapeHTML,
  format,
  fromRequest,
  getSearch,
  handleError,
  hasSearch,
  isPartial,
  isSubPartial,
  removeSort,
  resources,
  SavedController
} from "express-ext"
import { Item } from "onecore"
import { RateService, SubmittedRate } from "rate-sql"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getLangSearch, getResource } from "../resources"
import { calculatePercent, formatRate } from "../shared/rate"
import { RateFilter } from "../shared/rates"
import { render, renderError404, renderError500 } from "../template"
import { ArticleFilter, ArticleService, Published } from "./article"

const fields = ["id", "title", "publishedAt", "description"]
export class ArticleController extends SavedController {
  constructor(protected service: ArticleService, protected rateService: RateService) {
    super(service, "id", "userId")
    this.search = this.search.bind(this)
    this.getSavedArticles = this.getSavedArticles.bind(this)
    this.view = this.view.bind(this)
    this.review = this.review.bind(this)
    this.rate = this.rate.bind(this)
    this.setUseful = this.setUseful.bind(this)
    this.removeUseful = this.removeUseful.bind(this)
  }
  async search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    console.log("lang:" + lang)
    const langSearch = getLangSearch(lang)
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
    filter.userId = res.locals.userId
    const { page, limit } = filter
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of result.list) {
        item.publishedAt = formatDateTime(item.publishedAt, dateFormat)
      }
      const search = getSearch(req.url)
      const sortSearch = removeSort(search)
      console.log("search " + search)
      console.log("sort search " + sortSearch)
      const prefix = sortSearch ? `?${sortSearch}&` : "?"
      const s1: Item = {id: "timeDescSort", value: `${prefix}${resources.sort}=-publishedAt`, text: resource.sort_time_desc}
      const s2: Item = {id: "timeAscSort", value: `${prefix}${resources.sort}=publishedAt`, text: resource.sort_time_asc}
      const sortText = filter.sort == "publishedAt" ? resource.sort_desc_time_asc : resource.sort_desc_time_desc
      render(req, res, "articles", {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        langSearch,
        sorts: [s1, s2],
        sortText,
        message: buildMessage(resource, list, limit, page, result.total),
      })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async getSavedArticles(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    let filter: ArticleFilter = {
      limit: resources.defaultLimit,
      publishedAt: {},
    }
    if (hasSearch(req)) {
      filter = fromRequest<ArticleFilter>(req)
      format(filter, ["publishedAt"])
    }
    if (!filter.sort) {
      filter.sort = "-savedAt"
    }
    filter.status = Published
    filter.userId = res.locals.userId
    filter.isSaved = true
    const { page, limit, sort } = filter
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of result.list) {
        item.publishedAt = formatDateTime(item.publishedAt, dateFormat)
      }
      const search = getSearch(req.url)
      render(req, res, "articles", {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
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
    const dateFormat = getDateFormat(lang)
    const slug = req.params.id
    const userId: string = res.locals.userId
    try {
      const article = await this.service.load(slug, userId)
      if (!article) {
        return renderError404(req, res, resource)
      }
      const id = await this.service.getIdBySlug(slug)
      const rate = await this.service.getRateSummary(id)
      article.publishedAt = formatDateTime(article.publishedAt, dateFormat)
      render(req, res, "article", { resource, article, rate: formatRate(rate) })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async review(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const userId: string = res.locals.userId
    const partial = isPartial(req)
    const subPartial = isSubPartial(req)
    const view = partial && subPartial ? "shared/reviews" : "article-review"
    try {
      const id = await this.service.getIdBySlug(req.params.id)
      let filter: RateFilter = { id, limit: resources.defaultLimit}
      if (hasSearch(req)) {
        filter = fromRequest<RateFilter>(req)
        format(filter, ["time"])
      }
      if (!filter.sort) {
        filter.sort = "-time"
      }
      filter.id = id
      filter.userId = res.locals.userId
      const { page, limit } = filter
      const result = await this.service.searchRates(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of result.list) {
        item.time = formatDateTime(item.time, dateFormat)
        calculatePercent(item)
      }
      const search = getSearch(req.url)
      const sortSearch = removeSort(search)
      console.log("search " + search)
      console.log("sort search " + sortSearch)
      const prefix = sortSearch ? `?${sortSearch}&${resources.subPartial}=true&` : `?${resources.subPartial}=true&`
      const s1: Item = {id: "timeDescSort", value: `${prefix}${resources.sort}=-time`, text: resource.sort_time_desc}
      const s2: Item = {id: "timeAscSort", value: `${prefix}${resources.sort}=time`, text: resource.sort_time_asc}
      const s3: Item = {id: "rateDescSort", value: `${prefix}${resources.sort}=-rate`, text: resource.sort_rate_desc}
      const s4: Item = {id: "rateAscSort", value: `${prefix}${resources.sort}=rate`, text: resource.sort_rate_asc}
      let sortText = resource.sort_desc_time_desc
      switch(filter.sort) {
        case "time":
          sortText = resource.sort_desc_time_asc
          break
        case "-rate":
          sortText = resource.sort_desc_rate_desc
          break
        case "rate":
          sortText = resource.sort_desc_rate_asc
      }
      const ctx: any = {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        sorts: [s1, s2, s3, s4],
        sortText,
        message: buildMessage(resource, list, limit, page, result.total),
      }
      if (!partial || !subPartial) {
        const summary = await this.service.getRateSummary(id)
        ctx.rate = formatRate(summary)
        if (userId) {
          const userRate = await this.rateService.getRate(id, userId)
          ctx.review = userRate ? {rate: userRate.rate, review: escapeHTML(userRate.review)} : {}
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
    const slug = req.params.id
    try {
      const id = await this.service.getIdBySlug(slug)
      if (id === slug) {
        res.status(404).json(0).end()
        return
      }
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
    const rateId = req.params.rateId
    const userId: string = res.locals.userId
    try {
      const result = await this.service.setUseful(rateId, userId)
      const status = result > 0 ? 200 : 409
      res.status(status).json(result).end()
    } catch (err) {
      handleError(err, res)
    }
  }
  async removeUseful(req: Request, res: Response) {
    const rateId = req.params.rateId
    const userId: string = res.locals.userId
    try {
      const result = await this.service.removeUseful(rateId, userId)
      const status = result > 0 ? 200 : 410
      res.status(status).json(result).end()
    } catch (err) {
      handleError(err, res)
    }
  }
}

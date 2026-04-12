import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  escapeArray,
  format,
  fromRequest,
  getSearch,
  handleError,
  hasSearch,
  resources,
  SavedController
} from "express-ext"
import { RateFilter } from "shared/rates"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getResource } from "../resources"
import { calculatePercent, formatRate, Rate } from "../shared/rate"
import { render, renderError404, renderError500 } from "../template"
import { ArticleFilter, ArticleService, Published } from "./article"

const fields = ["id", "title", "publishedAt", "description"]
export class ArticleController extends SavedController {
  constructor(protected service: ArticleService) {
    super(service, "id", "userId")
    this.search = this.search.bind(this)
    this.getSavedArticles = this.getSavedArticles.bind(this)
    this.view = this.view.bind(this)
    this.review = this.review.bind(this)
    this.rate = this.rate.bind(this)
  }
  async search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    let filter: ArticleFilter = {
      limit: resources.defaultLimit,
      q: "",
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
  async getSavedArticles(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    let filter: ArticleFilter = {
      limit: resources.defaultLimit,
      q: "",
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
    try {
      const id = await this.service.getIdBySlug(req.params.id)
      const rate = await this.service.getRateSummary(id)
      let filter: RateFilter = { id, limit: resources.defaultLimit}
      if (hasSearch(req)) {
        filter = fromRequest<RateFilter>(req)
        format(filter, ["time"])
      }
      if (!filter.sort) {
        filter.sort = "-time"
      }
      const { page, limit, sort } = filter
      const result = await this.service.searchRates(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of result.list) {
        item.time = formatDateTime(item.time, dateFormat)
        calculatePercent(item)
      }
      const search = getSearch(req.url)
      render(req, res, "article-review", {
        resource,
        rate: formatRate(rate),
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
  async rate(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const rate = req.body as Rate    
    const slug = req.params.id
    console.log("JSON rate " + JSON.stringify(rate))
    try {
      const article = await this.service.load(slug)
      if (!article) {
        res.status(404).json(0).end()
        return
      }
      rate.id = article.id
      rate.author = res.locals.userId
      console.log("JSON rate " + JSON.stringify(rate))
      await this.service.rate(rate)
      const rateSummary = await this.service.getRateSummary(article.id)
      console.log("rate summary " + JSON.stringify(rateSummary))
      res.render("partials/rating-summary", { resource, rate: formatRate(rateSummary) })
    } catch (err) {
      handleError(err, res)
    }
  }
  async searchRates(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    let filter: RateFilter = {
      limit: resources.defaultLimit,
      id: req.params.id
    }
    if (hasSearch(req)) {
      filter = fromRequest<RateFilter>(req)
      format(filter, ["time"])
    }
    if (!filter.sort) {
      filter.sort = "-time"
    }
    const { page, limit, sort } = filter
    try {
      const result = await this.service.searchRates(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of result.list) {
        item.time = formatDateTime(item.time, dateFormat)
      }
      const search = getSearch(req.url)
      render(req, res, "rates", {
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
}

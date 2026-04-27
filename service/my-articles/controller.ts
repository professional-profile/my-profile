import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  escape,
  escapeArray,
  format,
  fromRequest,
  getSearch,
  handleError,
  hasSearch,
  isSuccessful,
  removeSort,
  resources,
  respondError
} from "express-core-web"
import { Item } from "onecore"
import { formatDateTime } from "ui-formatter"
import { validate } from "validation-core"
import { getDateFormat, getLang, getLangSearch, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { Article, ArticleFilter, articleModel, ArticleService } from "./article"

const fields = ["title", "publishedAt", "description"]
export class MyArticlesController {
  constructor(private service: ArticleService) {
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
    this.submit = this.submit.bind(this)
  }
  async search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const langSearch = getLangSearch(lang)
    let filter: ArticleFilter = {
      limit: resources.defaultLimit,
      status: [],
      publishedAt: {},
    }
    if (hasSearch(req)) {
      filter = fromRequest<ArticleFilter>(req, ["status"])
      format(filter, ["publishedAt"])
    }
    filter.authorId = res.locals.userId as string
    if (!filter.sort) {
      filter.sort = "-publishedAt"
    }
    const { page, limit, sort } = filter
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of result.list) {
        item.publishedAt = formatDateTime(item.publishedAt, dateFormat)
      }
      const search = getSearch(req.url)
      const sortSearch = removeSort(search)
      const prefix = sortSearch ? `?${sortSearch}&` : "?"
      const sort1: Item = {id: "timeDescSort", value: `${prefix}${resources.sort}=-publishedAt`, text: resource.sort_time_desc}
      const sort2: Item = {id: "timeAscSort", value: `${prefix}${resources.sort}=publishedAt`, text: resource.sort_time_asc}
      const sortText = filter.sort == "publishedAt" ? resource.sort_desc_time_asc : resource.sort_desc_time_desc
      render(req, res, "my-articles", {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        langSearch,
        sorts: [sort1, sort2],
        sortText,
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
    const id = req.params.id
    const userId: string = res.locals.userId
    try {
      const article = await this.service.load(id)
      if (!article || article.authorId !== userId) {
        return renderError404(req, res, resource)
      }
      article.publishedAt = formatDateTime(article.publishedAt, dateFormat)
      render(req, res, "my-article", { resource, article: escape(article) })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async submit(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const userId: string = res.locals.userId
    const article = req.body as Article
    const errors = validate<Article>(article, articleModel, resource)
    if (errors.length > 0) {
      return respondError(res, errors)
    }
    const id = req.params.id
    const editMode = id !== "new"
    try {
      if (!editMode) {
        article.authorId = userId
        const result = await this.service.create(article)
        const status = isSuccessful(result) ? 201 : 409
        res.status(status).json(result).end()
      } else {
        const existingArticle = await this.service.load(id)
        if (!existingArticle) {
          res.status(410).end()
        } else if (existingArticle.authorId !== userId) {
          res.status(404).end()
        }
        const result = await this.service.update(article)
        const status = isSuccessful(result) ? 200 : 410
        res.status(status).json(result).end()
      }
    } catch (err) {
      handleError(err, res)
    }
  }
}

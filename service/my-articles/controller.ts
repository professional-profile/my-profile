import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  cloneFilter,
  escape,
  escapeArray,
  format,
  fromRequest,
  getSearch,
  handleError,
  hasSearch,
  queryLimit,
  queryPage,
  resources,
  respondError,
} from "express-ext"
import { Log } from "onecore"
import { formatDateTime } from "ui-formatter"
import { validate } from "xvalidators"
import { getDateFormat, getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { Article, ArticleFilter, articleModel, ArticleService } from "./article"

const fields = ["title", "publishedAt", "description"]
export class MyArticlesController {
  constructor(private service: ArticleService, private log: Log) {
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
    this.submit = this.submit.bind(this)
  }
  search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    let filter: ArticleFilter = {
      limit: resources.defaultLimit,
      q: "",
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
    const page = queryPage(req, filter)
    const limit = queryLimit(req)
    this.service
      .search(cloneFilter(filter, limit, page), limit, page)
      .then((result) => {
        const list = escapeArray(result.list)
        for (const item of result.list) {
          item.publishedAt = formatDateTime(item.publishedAt, dateFormat)
        }
        const search = getSearch(req.url)
        render(req, res, "my-articles", {
          resource,
          limits: resources.limits,
          filter,
          list,
          pages: buildPages(limit, result.total),
          pageSearch: buildPageSearch(search),
          sort: buildSortSearch(search, fields, filter.sort),
          message: buildMessage(resource, list, limit, page, result.total),
        })
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
  view(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const id = req.params.id
    this.service
      .load(id)
      .then((article) => {
        if (!article || article.authorId !== userId) {
          renderError404(req, res, resource)
        } else {
          article.publishedAt = formatDateTime(article.publishedAt, dateFormat)
          render(req, res, "my-article", { resource, article: escape(article) })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
  submit(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const lang = getLang(req)
    const resource = getResource(lang)
    const article = req.body as Article
    const errors = validate<Article>(article, articleModel, resource)
    if (errors.length > 0) {
      respondError(res, errors)
    } else {
      const id = req.params.id
      const editMode = id !== "new"
      if (!editMode) {
        article.authorId = userId
        this.service
          .create(article)
          .then((result) => {
            if (result === 0) {
              res.status(410).end()
            } else {
              res.status(201).json(result).end()
            }
          })
          .catch((err) => handleError(err, res, this.log))
      } else {
        this.service.load(id).then((existingArticle) => {
          if (!existingArticle) {
            return res.status(410).end()
          }
          if (existingArticle.authorId !== userId) {
            return res.status(404).end()
          }
          this.service
            .update(article)
            .then((result) => {
              if (result === 0) {
                res.status(410).end()
              } else {
                res.status(200).json(result).end()
              }
            })
            .catch((err) => handleError(err, res, this.log))
        })
      }
    }
  }
}

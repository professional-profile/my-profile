import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  cloneFilter,
  escapeArray,
  format,
  fromRequest,
  getSearch,
  hasSearch,
  queryLimit,
  queryPage,
  resources,
} from "express-ext"
import { SearchResult } from "onecore"
import { DB, SearchBuilder } from "query-core"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { Article, ArticleFilter, articleModel, ArticleRepository, ArticleService } from "./article"
import { buildQuery } from "./query"
export * from "./article"

export class SqlArticleRepository extends SearchBuilder<Article, ArticleFilter> implements ArticleRepository {
  constructor(db: DB) {
    super(db.query, "articles", articleModel, db.driver, buildQuery)
  }
  load(id: string): Promise<Article | null> {
    const query = `select * from articles where slug = ${this.param(1)}`
    return this.query<Article>(query, [id], this.map).then((articles) => (articles && articles.length > 0 ? articles[0] : null))
  }
}

export class ArticleUseCase implements ArticleService {
  constructor(private repository: ArticleRepository) {}
  search(filter: ArticleFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Article>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string): Promise<Article | null> {
    return this.repository.load(id)
  }
}

const fields = ["title", "publishedAt", "description"]
export class ArticleController {
  constructor(private service: ArticleService) {
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
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
      filter = fromRequest<ArticleFilter>(req)
      format(filter, ["publishedAt"])
    }
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
        render(req, res, "news", {
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
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const id = req.params.id
    this.service
      .load(id)
      .then((article) => {
        if (!article) {
          renderError404(req, res, resource)
        } else {
          article.publishedAt = formatDateTime(article.publishedAt, dateFormat)
          render(req, res, "article", { resource, article })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
}

export function useArticleController(db: DB): ArticleController {
  const repository = new SqlArticleRepository(db)
  const service = new ArticleUseCase(repository)
  return new ArticleController(service)
}

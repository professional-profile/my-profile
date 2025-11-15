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
  handleError,
  hasSearch,
  queryLimit,
  queryPage,
  resources,
} from "express-ext"
import { Log, SearchResult } from "onecore"
import { DB, SearchRepository } from "query-core"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { Article, ArticleFilter, articleModel, ArticleRepository, ArticleService } from "./article"
import { buildQuery } from "./query"
export * from "./article"

const Published = "P"

export interface SavedRepository {
  isSaved(userId: string, id: string): Promise<boolean>
  save(userId: string, id: string): Promise<number>
  remove(userId: string, id: string): Promise<number>
  count(userId: string): Promise<number>
}
export class SqlSavedRepository {
  constructor(protected db: DB, protected table: string, protected userId: string, protected id: string, protected saveAt: string) {
    this.isSaved = this.isSaved.bind(this)
    this.save = this.save.bind(this)
    this.remove = this.remove.bind(this)
    this.count = this.count.bind(this)
  }
  isSaved(userId: string, id: string): Promise<boolean> {
    const sql = `select ${this.userId} from ${this.table} where ${this.userId} = ${this.db.param(1)} and ${this.id} = ${this.db.param(2)}`
    return this.db.query<any>(sql, [userId, id]).then((rows) => {
      return rows.length > 0 ? true : false
    })
  }
  save(userId: string, id: string): Promise<number> {
    const sql = `insert into ${this.table} (${this.userId}, ${this.id}, ${this.saveAt})
    values (${this.db.param(1)}, ${this.db.param(2)}, ${this.db.param(3)})
    on conflict (${this.userId}, ${this.id}) do nothing`
    return this.db.exec(sql, [userId, id, new Date()])
  }
  remove(userId: string, id: string): Promise<number> {
    const sql = `delete from ${this.table} where ${this.userId} = ${this.db.param(1)} and ${this.id} = ${this.db.param(2)}`
    return this.db.exec(sql, [userId, id])
  }
  count(userId: string): Promise<number> {
    const sql = `select count(*) as total from ${this.table} where ${this.userId} = ${this.db.param(1)}`
    return this.db.query<any>(sql, [userId]).then((rows) => {
      return rows[0]["total"] as number
    })
  }
}

export class SqlArticleRepository extends SearchRepository<Article, ArticleFilter> implements ArticleRepository {
  constructor(db: DB) {
    super(db.query, "articles", articleModel, db.driver, buildQuery)
  }
  load(id: string): Promise<Article | null> {
    const query = `select * from articles where slug = ${this.param(1)}`
    return this.query<Article>(query, [id], this.map).then((articles) => (articles && articles.length > 0 ? articles[0] : null))
  }
}

export class ArticleUseCase implements ArticleService {
  constructor(private repository: ArticleRepository, private savedRepository: SavedRepository, private max: number) {}
  search(filter: ArticleFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Article>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string): Promise<Article | null> {
    return this.repository.load(id)
  }
  isSaved(userId: string, id: string): Promise<boolean> {
    return this.savedRepository.isSaved(userId, id)
  }
  save(userId: string, id: string): Promise<number> {
    return this.savedRepository.count(userId).then((count) => {
      if (count >= this.max) {
        return -1
      } else {
        return this.savedRepository.save(userId, id)
      }
    })
  }
  remove(userId: string, id: string): Promise<number> {
    return this.savedRepository.remove(userId, id)
  }
}

const fields = ["title", "publishedAt", "description"]
export class ArticleController {
  constructor(private service: ArticleService, private log: Log) {
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
    this.getSavedArticles = this.getSavedArticles.bind(this)
    this.save = this.save.bind(this)
    this.remove = this.remove.bind(this)
  }
  search(req: Request, res: Response) {
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
    filter.currentUserId = res.locals.userId
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
  getSavedArticles(req: Request, res: Response) {
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
    filter.currentUserId = res.locals.userId
    filter.isSaved = true
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
          const userId: string = res.locals.userId
          article.publishedAt = formatDateTime(article.publishedAt, dateFormat)
          if (userId) {
            this.service.isSaved(userId, article.id).then((isSaved) => {
              article.isSaved = isSaved
              render(req, res, "article", { resource, article })
            })
          } else {
            render(req, res, "article", { resource, article })
          }
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
  save(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const id = req.params.id
    if (!id || id.length === 0) {
      return res.status(400).end(`'id' cannot be empty`)
    }
    this.service
      .save(userId, id)
      .then((result) => {
        const status = result > 0 ? 200 : result === 0 ? 409 : 422
        res.status(status).json(result).end()
      })
      .catch((err) => handleError(err, res, this.log))
  }
  remove(req: Request, res: Response) {
    const userId: string = res.locals.userId
    const id = req.params.id
    if (!id || id.length === 0) {
      return res.status(400).end(`id' cannot be empty`)
    }
    this.service
      .remove(userId, id)
      .then((result) => {
        const status = result > 0 ? 200 : 410
        res.status(status).json(result).end()
      })
      .catch((err) => handleError(err, res, this.log))
  }
}

export function useArticleController(db: DB, log: Log): ArticleController {
  const repository = new SqlArticleRepository(db)
  const savedRepository = new SqlSavedRepository(db, "saved_articles", "user_id", "id", "saved_at")
  const service = new ArticleUseCase(repository, savedRepository, 3)
  return new ArticleController(service, log)
}

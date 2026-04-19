import { DB } from "onecore"
import { param } from "pg-extension"
import { Attribute, Attributes, buildSort, SearchRepository, SqlLoader, Statement } from "sql-core"
import { RateSummary, rateSummaryModel, RateSummaryRepository } from "../shared/rate"
import { Article, ArticleFilter, articleModel, ArticleRepository } from "./article"

export class SqlRateSummaryRepository extends SqlLoader<RateSummary, string> implements RateSummaryRepository {
  constructor(db: DB) {
    super(db, "article_info", rateSummaryModel)
  }
}

export class SqlArticleRepository extends SearchRepository<Article, ArticleFilter> implements ArticleRepository {
  constructor(db: DB) {
    super(db, "articles", articleModel, buildQuery)
  }
  async load(id: string, userId?: string): Promise<Article | null> {
    const params = []
    let query: string
    if (userId) {
      query = `select a.*, sa.saved_at 
        from articles a 
        left join saved_articles sa 
          on sa.id = a.id and sa.user_id = ${this.db.param(1)} where a.slug = ${this.db.param(2)}`
      params.push(userId)
    } else {
      query = `select a.* from articles a where a.slug = ${this.db.param(1)}`
    }
    params.push(id)
    const articles = await this.db.query<Article>(query, params, this.map)
    return articles && articles.length > 0 ? articles[0] : null
  }
  async getIdBySlug(slug: string): Promise<string> {
    const query = `select a.id from articles a where a.slug = ${this.db.param(1)}`
    const articles = await this.db.query<Article>(query, [slug], this.map)
    return (articles && articles.length > 0 ? articles[0].id : slug)
  }
}

export function buildQuery(filter: ArticleFilter): Statement {
  const where: string[] = []
  const params = []
  let i = 1
  let query: string
  if (filter.userId) {
    if (filter.isSaved) {
      query = `select a.id, a.thumbnail, a.slug, a.title, a.description, a.published_at, sa.saved_at 
        from saved_articles sa 
        inner join articles a
        on sa.user_id = ${param(i++)} and sa.id = a.id`
    } else {
      query = `select a.id, a.thumbnail, a.slug, a.title, a.description, a.published_at, sa.saved_at 
        from articles a 
        left join saved_articles sa 
        on sa.id = a.id and sa.user_id = ${param(i++)}`
    }
    params.push(filter.userId)
  } else {
    query = `select a.id, a.thumbnail, a.slug, a.title, a.description, a.published_at from articles a`
  }

  if (filter.authorId) {
    params.push(filter.authorId)
    where.push(`author_id = ${param(i++)}`)
  }

  if (filter.tags && filter.tags.length > 0) {
    params.push(filter.tags)
    where.push(`tags && ${param(i++)}`)
  }

  if (filter.publishedAt) {
    if (filter.publishedAt.min) {
      where.push(`published_at >= ${param(i++)}`)
      params.push(filter.publishedAt.min)
    }
    if (filter.publishedAt.max) {
      where.push(`published_at <= ${param(i++)}`)
      params.push(filter.publishedAt.max)
    }
  }

  if (filter.status && filter.status.length > 0) {
    params.push(filter.status)
    where.push(`status = ${param(i++)}`)
  }

  if (filter.q) {
    const q = filter.q.replace(/%/g, "\\%").replace(/_/g, "\\_")
    where.push(`(title ilike ${param(i++)} or description ilike ${param(i++)})`)
    params.push(`%${q}%`, `%${q}%`)
  }

  if (where.length > 0) {
    query = query + ` where ` + where.join(` and `)
  }
  const orderBy = buildSort(filter.sort, articleModel)
  if (orderBy) {
    query = query + ` order by ${orderBy}`
  }
  return { query, params }
}

export interface UsefulRepository {
  setUseful(rateId: string, userId: string): Promise<number>
  removeUseful(rateId: string, userId: string): Promise<number>
}
export interface RateReaction {
  rateId: string;
  userId: string;
  time: Date;
  reaction: number;
}
export class SqlUsefulRepository implements UsefulRepository {
  constructor(protected db: DB, protected usefulTable: string, protected attributes: Attributes, protected buildToSave: (obj: RateReaction, table: string, attrs: Attributes) => Statement,
      protected rateTable: string, protected rateIdCol: string, protected usefulCol: string) {
    this.setUseful = this.setUseful.bind(this)
    this.removeUseful = this.removeUseful.bind(this)
  }
  setUseful(rateId: string, userId: string): Promise<number> {
    const obj: RateReaction = { rateId, userId, time: new Date(), reaction: 1 };
    const stm1 = this.buildToSave(obj, this.usefulTable, this.attributes)
    const query = `update ${this.rateTable} set ${this.usefulCol} = ${this.usefulCol} + 1 where ${this.rateIdCol} = ${this.db.param(1)}`
    const stm2: Statement = { query, params: [rateId] }
    console.log(stm1.query)
    console.log(stm2.query)
    return this.db.executeBatch([stm1, stm2], true)
  }
  removeUseful(rateId: string, userId: string): Promise<number> {
    const atr1 = this.attributes["rateId"] as Attribute
    const atr2 = this.attributes["userId"] as Attribute
    const col1 = atr1.column ? atr1.column : "rateid"
    const col2 = atr2.column ? atr2.column : "userid"
    const query1 = `delete from ${this.usefulTable} where ${col1} = ${this.db.param(1)} and ${col2} = ${this.db.param(2)}`
    const stm1: Statement = {query: query1, params: [rateId, userId] }
    const query2 = `update ${this.rateTable} set ${this.usefulCol} = ${this.usefulCol} - 1 where ${this.rateIdCol} = ${this.db.param(1)}`
    const stm2: Statement = { query: query2, params: [rateId] }
    console.log(stm1.query)
    console.log(stm2.query)
    return this.db.executeBatch([stm1, stm2], true)
  }
}

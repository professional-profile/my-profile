import { Log, SavedRepository, SavedService, SearchResult } from "onecore"
import { SqlSavedRepository } from "pg-extension"
import { DB, SearchRepository } from "query-core"
import { Article, ArticleFilter, articleModel, ArticleRepository, ArticleService } from "./article"
import { ArticleController } from "./controller"
import { buildQuery } from "./query"

export * from "./controller"

export class SqlArticleRepository extends SearchRepository<Article, ArticleFilter> implements ArticleRepository {
  constructor(db: DB) {
    super(db.query, "articles", articleModel, db.driver, buildQuery)
  }
  load(id: string): Promise<Article | null> {
    const query = `select * from articles where slug = ${this.param(1)}`
    return this.query<Article>(query, [id], this.map).then((articles) => (articles && articles.length > 0 ? articles[0] : null))
  }
}

export class ArticleUseCase extends SavedService<string, string> implements ArticleService {
  constructor(private repository: ArticleRepository, savedRepository: SavedRepository<string, string>, max: number) {
    super(savedRepository, max)
  }
  search(filter: ArticleFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Article>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string): Promise<Article | null> {
    return this.repository.load(id)
  }
}

export function useArticleController(db: DB, log: Log): ArticleController {
  const repository = new SqlArticleRepository(db)
  const savedRepository = new SqlSavedRepository(db, "saved_articles", "user_id", "id", "saved_at")
  const service = new ArticleUseCase(repository, savedRepository, 3)
  return new ArticleController(service, log)
}

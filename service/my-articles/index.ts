import { nanoid } from "nanoid"
import { Log, Search, UseCase } from "onecore"
import { DB, Repository, SearchBuilder } from "query-core"
import { slugify } from "../common/slug"
import { Article, ArticleFilter, articleModel, ArticleRepository, ArticleService } from "./article"
import { MyArticlesController } from "./controller"
import { buildQuery } from "./query"

export * from "./controller"

export class SqlArticleRepository extends Repository<Article, string> implements ArticleRepository {
  constructor(db: DB) {
    super(db, "articles", articleModel)
  }
}
const draft = "D"
export class ArticleUseCase extends UseCase<Article, string, ArticleFilter> implements ArticleService {
  constructor(search: Search<Article, ArticleFilter>, repository: ArticleRepository) {
    super(search, repository)
  }
  create(article: Article, ctx?: any): Promise<number> {
    article.id = nanoid(10)
    article.slug = slugify(article.title, article.id)
    return this.repository.create(article, ctx)
  }
  async update(article: Article, ctx?: any): Promise<number> {
    const existingArticle = await this.repository.load(article.id)
    if (!existingArticle) {
      return 0
    }
    if (existingArticle.status === draft) {
      article.slug = slugify(article.title, article.id)
    }
    return this.repository.update(article, ctx)
  }
  async patch(article: Partial<Article>, ctx?: any): Promise<number> {
    if (article.title && article.title.length > 0) {
      const id = article.id as string
      const existingArticle = await this.repository.load(id)
      if (!existingArticle) {
        return 0
      }
      if (existingArticle.status === draft) {
        article.slug = slugify(article.title, id)
      }
      return this.repository.patch(article, ctx)
    } else {
      delete article.slug
      return this.repository.patch(article, ctx)
    }
  }
}

export function useMyArticlesController(db: DB, log: Log): MyArticlesController {
  const builder = new SearchBuilder<Article, ArticleFilter>(db.query, "articles", articleModel, db.driver, buildQuery)
  const repository = new SqlArticleRepository(db)
  const service = new ArticleUseCase(builder.search, repository)
  return new MyArticlesController(service, log)
}

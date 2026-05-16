import { nanoid } from "nanoid"
import { SavedRepository, SavedService, SearchResult } from "onecore"
import { buildToSave, SqlSavedRepository } from "pg-extension"
import { Rate, Rater, SqlRateRepository } from "rate-sql"
import { buildToInsert, buildToUpdate, DB } from "sql-core"
import { rateModel, rateReactionModel, RateSummary, RateSummaryRepository, zeroSummary } from "../shared/rate"
import { RateFilter, RatesRepository, Rate as SearchRate, SearchRateRepository } from "../shared/rates"
import { Article, ArticleFilter, ArticleRepository, ArticleService } from "./article"
import { ArticleController } from "./controller"
import { SqlArticleRepository, SqlRateSummaryRepository, SqlUsefulRepository } from "./repository"
export * from "./controller"

export class ArticleUseCase extends SavedService<string, string> implements ArticleService {
  constructor(protected repository: ArticleRepository, protected savedRepository: SavedRepository<string, string>, protected max: number, protected rateSummaryRepository: RateSummaryRepository, protected ratesRepository: RatesRepository) {
    super(savedRepository, max)
  }
  search(filter: ArticleFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Article>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(slug: string, userId?: string): Promise<Article | null> {
    return this.repository.load(slug, userId)
  }
  getIdBySlug(slug: string): Promise<string> {
    return this.repository.getIdBySlug(slug)
  }
  async getRateSummary(id: string): Promise<RateSummary> {
    let rateSummary = await this.rateSummaryRepository.load(id)
    return (rateSummary ? rateSummary : { ...zeroSummary, id})
  }
  searchRates(filter: RateFilter, limit: number, page?: number | string, fields?: string[]): Promise<SearchResult<SearchRate>> {
    return this.ratesRepository.search(filter, limit, page, fields)
  }
}

export function useArticleController(db: DB): ArticleController {
  const repository = new SqlArticleRepository(db)
  const savedRepository = new SqlSavedRepository(db, "saved_articles", "user_id", "id", "saved_at")
  const ratesRepository = new SearchRateRepository(db)
  const rateSummaryRepository = new SqlRateSummaryRepository(db)
  const rateRepository = new SqlRateRepository<Rate>(db, "article_rates", rateModel, 5, "article_info", buildToInsert, buildToUpdate, generateId, "rateId", "rate", "count", "score", "author", "id")
  const usefulRepository = new SqlUsefulRepository(db, "article_rate_reactions", rateReactionModel, buildToSave, "article_rates", "rate_id", "useful_count")
  const rateService = new Rater(db, rateRepository, rateSummaryRepository, usefulRepository)
  const service = new ArticleUseCase(repository, savedRepository, 200, rateSummaryRepository, ratesRepository)
  return new ArticleController(service, rateService)
}
function generateId(): string {
  return nanoid(10)
}

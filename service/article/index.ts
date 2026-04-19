import { nanoid } from "nanoid"
import { SavedRepository, SearchResult } from "onecore"
import { buildToSave, SqlSavedRepository } from "pg-extension"
import { Rate, Rater, SqlRateRepository } from "rate-sql"
import { buildToInsert, buildToUpdate, DB } from "sql-core"
import { rateModel, rateReactionModel, RateSummary, RateSummaryRepository, zeroSummary } from "../shared/rate"
import { RateFilter, RatesRepository, Rate as SearchRate, SearchRateRepository } from "../shared/rates"
import { Article, ArticleFilter, ArticleRepository, ArticleService } from "./article"
import { ArticleController } from "./controller"
import { SqlArticleRepository, SqlRateSummaryRepository, SqlUsefulRepository, UsefulRepository } from "./repository"
export * from "./controller"

export class ArticleUseCase implements ArticleService {
  constructor(protected repository: ArticleRepository, protected savedRepository: SavedRepository<string, string>, protected max: number, protected rateSummaryRepository: RateSummaryRepository, protected ratesRepository: RatesRepository, protected usefulRepository: UsefulRepository) {
  }
  search(filter: ArticleFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Article>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string, userId?: string): Promise<Article | null> {
    return this.repository.load(id, userId)
  }
  getIdBySlug(slug: string): Promise<string> {
    return this.repository.getIdBySlug(slug)
  }
  async getRateSummary(id: string): Promise<RateSummary> {
    let rateSummary = await this.rateSummaryRepository.load(id)
    return (rateSummary ? rateSummary : { ...zeroSummary, id})
  }
  async save(userId: string, id: string): Promise<number> {
    const count = await this.savedRepository.count(userId)
    if (count >= this.max) {
      return -1
    } else {
      return this.savedRepository.save(userId, id)
    }
  }
  remove(userId: string, id: string): Promise<number> {
    return this.savedRepository.remove(userId, id)
  }
  searchRates(filter: RateFilter, limit: number, page?: number | string, fields?: string[]): Promise<SearchResult<SearchRate>> {
    return this.ratesRepository.search(filter, limit, page, fields)
  }
  setUseful(rateId: string, userId: string): Promise<number> {
    return this.usefulRepository.setUseful(rateId, userId)
  }
  removeUseful(rateId: string, userId: string): Promise<number> {
    return this.usefulRepository.removeUseful(rateId, userId)
  }
}

export function useArticleController(db: DB): ArticleController {
  const repository = new SqlArticleRepository(db)
  const savedRepository = new SqlSavedRepository(db, "saved_articles", "user_id", "id", "saved_at")
  const rateSummaryRepository = new SqlRateSummaryRepository(db)
  const ratesRepository = new SearchRateRepository(db)
  const rateRepository = new SqlRateRepository<Rate>(db, "article_rates", rateModel, 5, "article_info", buildToInsert, buildToUpdate, generateId, "rateId", "rate", "count", "score", "author", "id")
  const usefulRepository = new SqlUsefulRepository(db, "article_rate_reactions", rateReactionModel, buildToSave, "article_rates", "rate_id", "useful_count")
  const rateService = new Rater(db, rateRepository, rateSummaryRepository)
  const service = new ArticleUseCase(repository, savedRepository, 200, rateSummaryRepository, ratesRepository, usefulRepository)
  return new ArticleController(service, rateService)
}
function generateId(): string {
  return nanoid(10)
}

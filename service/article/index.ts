import { nanoid } from "nanoid"
import { SavedRepository, SearchResult } from "onecore"
import { SqlSavedRepository } from "pg-extension"
import { buildToInsert, buildToUpdate, DB } from "query-core"
import { History, Rate, rateModel, RateRepository, RateSummary, RateSummaryRepository, zeroSummary } from "../shared/rate"
import { SqlRateRepository } from "../shared/rate-query"
import { RateFilter, RatesRepository, Rate as SearchRate, SearchRateRepository } from "../shared/rates"
import { Article, ArticleFilter, ArticleRepository, ArticleService } from "./article"
import { ArticleController } from "./controller"
import { SqlArticleRepository, SqlRateSummaryRepository } from "./repository"
export * from "./controller"

export class ArticleUseCase implements ArticleService {
  constructor(protected db: DB, protected repository: ArticleRepository, protected savedRepository: SavedRepository<string, string>, protected max: number, protected rateSummaryRepository: RateSummaryRepository, protected rateRepository: RateRepository, protected ratesRepository: RatesRepository) {
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
  async rate(rate: Rate): Promise<number> {
    console.log("JSON rate " + JSON.stringify(rate))
    const tx = await this.db.beginTransaction()
    try {
      const info = await this.rateSummaryRepository.exist(rate.id, tx);
      if (!info) {
        const res = await this.rateRepository.create(rate, true, tx);
        return res;
      }
      const exist = await this.rateRepository.load(rate.id, rate.author, tx);
      if (!exist) {
        console.log("enter create")
        const res = await this.rateRepository.create(rate, false, tx);
        return res;
      }
      console.log("Existing rate " + JSON.stringify(exist)) 
      const history: History = { review: exist.review, rate: exist.rate, time: exist.time };
      if (exist.histories && exist.histories.length > 0) {
        const histories = exist.histories;
        histories.push(history);
        exist.histories = histories;
      } else {
        exist.histories = [history];
      }
      const oldRate = exist.rate
      exist.rate = rate.rate
      exist.review = rate.review
      exist.time = new Date()
      console.log("enter update " + JSON.stringify(exist))
      const count = await this.rateRepository.update(exist, oldRate, tx);
      tx.commit()
      return count;
    } catch (err) {
      tx.rollback()
      throw err
    }
  }
  searchRates(filter: RateFilter, limit: number, page?: number | string, fields?: string[]): Promise<SearchResult<SearchRate>> {
    return this.ratesRepository.search(filter, limit, page, fields)
  }
}

export function useArticleController(db: DB): ArticleController {
  const repository = new SqlArticleRepository(db)
  const savedRepository = new SqlSavedRepository(db, "saved_articles", "user_id", "id", "saved_at")
  const rateSummaryRepository = new SqlRateSummaryRepository(db)
  const rateRepository = new SqlRateRepository<Rate>(db, "article_rates", rateModel, 5, "article_info", buildToInsert, buildToUpdate, generateId, "rateId", "rate", "count", "score", "author", "id")
  const ratesRepository = new SearchRateRepository(db)
  const service = new ArticleUseCase(db, repository, savedRepository, 200, rateSummaryRepository, rateRepository, ratesRepository)
  return new ArticleController(service)
}
function generateId(): string {
  return nanoid(10)
}
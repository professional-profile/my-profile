import { nanoid } from "nanoid"
import { DB } from "onecore"
import { buildToSave } from "pg-extension"
import { Rate, Rater, SqlRateRepository } from "rate-service"
import { SqlUsefulRepository } from "rate-sql"
import { SqlSavedRepository } from "saved-service"
import { buildToInsert, buildToUpdate } from "sql-core"
import { rateModel, rateReactionModel } from "../shared/rate"
import { SearchRateRepository } from "../shared/rates"
import { ArticleController } from "./controller"
import { SqlArticleRepository, SqlRateSummaryRepository } from "./repository"
import { ArticleUseCase } from "./service"
export * from "./controller"

export function useArticleController(db: DB): ArticleController {
  const repository = new SqlArticleRepository(db)
  const savedRepository = new SqlSavedRepository(db, "saved_articles", "user_id", "id", "saved_at")
  const rateSummaryRepository = new SqlRateSummaryRepository(db)
  const ratesRepository = new SearchRateRepository(db)
  const rateRepository = new SqlRateRepository<Rate>(db, "article_rates", rateModel, 5, "article_info", buildToInsert, buildToUpdate, generateId, "rateId", "rate", "count", "score", "author", "id")
  const usefulRepository = new SqlUsefulRepository(db, "article_rate_reactions", rateReactionModel, buildToSave, "article_rates", "rate_id", "useful_count")
  const rateService = new Rater(db, rateRepository, rateSummaryRepository, usefulRepository)
  const service = new ArticleUseCase(repository, savedRepository, 200, rateSummaryRepository, ratesRepository)
  return new ArticleController(service, rateService)
}
function generateId(): string {
  return nanoid(10)
}

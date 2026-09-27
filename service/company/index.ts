import { SqlFollowRepository } from "follow-service"
import { nanoid } from "nanoid"
import { DB } from "onecore"
import { buildToSave } from "postgres-kit"
import { Rater, SqlRateRepository } from "rate-service"
import { SqlUsefulRepository } from "rate-sql"
import { buildToInsert, buildToUpdate } from "sql-core"
import { rateModel, rateReactionModel } from "../shared/rate"
import { createSearchRateRepository, Rate } from "../shared/rates"
import { SqlArticleRepository } from "./article"
import { CompanyController } from "./controller"
import { SqlJobRepository } from "./job"
import { SqlCompanyRepository, SqlRateSummaryRepository } from "./repository"
import { CompanyUseCase } from "./service"
import { SqlUserRepository } from "./user"
export * from "./controller"

export function useCompanyController(db: DB): CompanyController {
  const followRepository = new SqlFollowRepository<string>(
    db.executeBatch,
    "company_followers",
    "id",
    "follower",
    "followed_at",
    "company_following",
    "id",
    "following",
    "following_at",
    "company_info",
    "id",
    "follower_count",
  )
  const repository = new SqlCompanyRepository(db)
  const articleRepository = new SqlArticleRepository(db)
  const jobRepository = new SqlJobRepository(db)
  const userRepository = new SqlUserRepository(db)
  const rateSummaryRepository = new SqlRateSummaryRepository(db)
  const ratesRepository = createSearchRateRepository(db, "company_rates", "company_rate_reactions")
  const service = new CompanyUseCase(repository, articleRepository, jobRepository, userRepository, followRepository, rateSummaryRepository, ratesRepository)

  const rateRepository = new SqlRateRepository<Rate>(db, "company_rates", rateModel, 5, "company_info", buildToInsert, buildToUpdate, generateId, "rateId", "rate", "count", "score", "author", "id")
  const usefulRepository = new SqlUsefulRepository(db, "company_rate_reactions", rateReactionModel, buildToSave, "company_rates", "rate_id", "useful_count")
  const rateService = new Rater(db, rateRepository, rateSummaryRepository, usefulRepository)
  return new CompanyController(service, rateService)
}
function generateId(): string {
  return nanoid(10)
}

import { SqlFollowRepository } from "follow-service"
import { nanoid } from "nanoid"
import { DB } from "onecore"
import { SqlArticleRepository } from "./article"
import { CompanyController } from "./controller"
import { SqlCompanyRepository } from "./repository"
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
  const userRepository = new SqlUserRepository(db)
  const service = new CompanyUseCase(repository, followRepository, articleRepository, userRepository)
  /*
    const rateRepository = new SqlRatesRepository<Rates>(db, "company_rates", rateModel, 5, "company_info", ["company_rate1", "company_rate2", "company_rate3", "company_rate4", "company_rate5"], buildToSave, generateId, "rateId", "rate", "count", "score", "author", "id")
    const rateService = new Rater(rateRepository)
    const rate: SubmittedRate = { id: "nab", author: "acAoryR2VH", rates: [4, 5, 3, 3, 2], review: "Good company" }
    rateService.rate(rate)
    */
  return new CompanyController(service)
}
function generateId(): string {
  return nanoid(10)
}

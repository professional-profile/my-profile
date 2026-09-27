import { SqlFollowRepository } from "follow-service"
import { nanoid } from "nanoid"
import { DB } from "onecore"
import { SqlArticleRepository } from "./article"
import { CompanyController } from "./controller"
import { SqlJobRepository } from "./job"
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
  const jobRepository = new SqlJobRepository(db)
  const userRepository = new SqlUserRepository(db)
  const service = new CompanyUseCase(repository, articleRepository, jobRepository, userRepository, followRepository)
  return new CompanyController(service)
}
function generateId(): string {
  return nanoid(10)
}

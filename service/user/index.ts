import { FollowUserRepository } from "follow-service"
import { DB } from "onecore"
import { SqlArticleRepository } from "./article-repository"
import { SqlCompanyRepository } from "./company-repository"
import { UserController } from "./controller"
import { SqlUserRepository } from "./repository"
import { UserUseCase } from "./service"
export * from "./controller"

export function useUserController(db: DB): UserController {
  const followRepository = new FollowUserRepository<string>(
    db.executeBatch,
    "user_followers",
    "id",
    "follower",
    "followed_at",
    "user_following",
    "id",
    "following",
    "following_at",
    "user_info",
    "id",
    "follower_count",
    "following_count",
  )
  const repository = new SqlUserRepository(db)
  const articleRepository = new SqlArticleRepository(db)
  const companyRepository = new SqlCompanyRepository(db)
  const service = new UserUseCase(repository, followRepository, articleRepository, companyRepository)
  return new UserController(service)
}

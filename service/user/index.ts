import { FollowService, SearchResult } from "onecore"
import { FollowRepository } from "pg-extension"
import { DB } from "sql-core"
import { UserController } from "./controller"
import { SqlUserRepository } from "./repository"
import { User, UserFilter, UserRepository, UserService } from "./user"
export * from "./controller"

export class UserUseCase extends FollowService<string> implements UserService {
  constructor(protected repository: UserRepository, protected followRepository: FollowRepository<string>) {
    super(followRepository)
  }
  search(filter: UserFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<User>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(slug: string, userId?: string): Promise<User | null> {
    return this.repository.load(slug, userId)
  }
  getIdBySlug(slug: string): Promise<string> {
    return this.repository.getIdBySlug(slug)
  }
}

export function useUserController(db: DB): UserController {
  const followRepository = new FollowRepository<string>(
    db.executeBatch,
    "user_following",
    "id",
    "following",
    "following_at",
    "user_followers",
    "id",
    "follower",
    "followed_at",
    "user_info",
    "id",
    "follower_count",
    "following_count",
  )
  const repository = new SqlUserRepository(db)
  const service = new UserUseCase(repository, followRepository)
  return new UserController(service)
}

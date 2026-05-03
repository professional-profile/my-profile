import { SearchResult } from "onecore"
import { FollowRepository } from "pg-extension"
import { DB } from "sql-core"
import { UserController } from "./controller"
import { SqlUserRepository } from "./repository"
import { User, UserFilter, UserRepository, UserService } from "./user"
export * from "./controller"

export class UserUseCase implements UserService {
  constructor(private repository: UserRepository, private followRepository: FollowRepository<string>) {}
  search(filter: UserFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<User>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(slug: string, userId?: string): Promise<User | null> {
    return this.repository.load(slug, userId)
  }
  getIdBySlug(slug: string): Promise<string> {
    return this.repository.getIdBySlug(slug)
  }
  follow(id: string, target: string): Promise<number> {
    return this.followRepository.follow(id, target)
  }
  unfollow(id: string, target: string): Promise<number> {
    return this.followRepository.unfollow(id, target)
  }
  checkFollow(id: string, target: string): Promise<number> {
    return this.followRepository.checkFollow(id, target).then((result) => (result ? 1 : 0))
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

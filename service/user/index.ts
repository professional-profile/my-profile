import { Log, SearchResult } from "onecore"
import { FollowRepository } from "pg-extension"
import { DB, SearchRepository } from "query-core"
import { UserController } from "./controller"
import { buildQuery } from "./query"
import { User, UserFilter, userModel, UserRepository, UserService } from "./user"
export * from "./controller"

export class SqlUserRepository extends SearchRepository<User, UserFilter> implements UserRepository {
  constructor(db: DB) {
    super(db.query, "users", userModel, db.driver, buildQuery)
  }
  load(id: string, userId?: string): Promise<User | null> {
    let params = []
    let query: string

    if (userId && userId.length > 0) {
      query = `select u.*, ui.follower_count, ui.following_count, uf.following_at, ur.followed_at
        from users u
        left join user_info ui on u.id = ui.id
        left join user_followings uf on uf.id = ${this.param(1)} and uf.following = u.id
        left join user_followers ur on ur.id = ${this.param(2)} and ur.follower = u.id
        where u.username = ${this.param(3)}`
      params.push(userId, userId)
    } else {
      query = `select u.*, ui.follower_count, ui.following_count
        from users u
        left join user_info ui on u.id = ui.id
        where u.username = ${this.param(1)}`
    }
    params.push(id)

    return this.query<User>(query, params, this.map).then((users) => {
      if (users && users.length > 0) {
        return users[0]
      } else {
        params = []
        query = `select * from users where id = ${this.param(1)}`
        if (userId && userId.length > 0) {
          query = `select u.*, ui.follower_count, ui.following_count, uf.following_at, ur.followed_at
            from users u
            left join user_info ui on u.id = ui.id
            left join user_followings uf on uf.id = ${this.param(1)} and uf.following = u.id
            left join user_followers ur on ur.id = ${this.param(2)} and ur.follower = u.id
            where u.id = ${this.param(3)}`
          params.push(userId, userId)
        } else {
          query = `select u.*, ui.follower_count, ui.following_count
            from users u
            left join user_info ui on u.id = ui.id
            where u.id = ${this.param(1)}`
        }
        params.push(id)
        return this.query<User>(query, [id], this.map).then((users) => (users && users.length > 0 ? users[0] : null))
      }
    })
  }
}

export class UserUseCase implements UserService {
  constructor(private repository: UserRepository, private followRepository: FollowRepository<string>) {}
  search(filter: UserFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<User>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string, userId?: string): Promise<User | null> {
    return this.repository.load(id, userId)
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

export function useUserController(db: DB, log: Log): UserController {
  const followRepository = new FollowRepository<string>(
    db.execBatch,
    "user_followings",
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
  return new UserController(service, log)
}

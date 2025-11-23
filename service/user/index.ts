import { Log, SearchResult, Statement } from "onecore"
import { DB, SearchRepository } from "query-core"
import { UserController } from "./controller"
import { buildQuery } from "./query"
import { User, UserFilter, userModel, UserRepository, UserService } from "./user"

export * from "./controller"

export class FollowRepository<ID> {
  constructor(
    public execute: (statements: Statement[], firstSuccess?: boolean, ctx?: any) => Promise<number>,
    public followingTable: string,
    public id: string,
    public following: string,
    public following_at: string,
    public followerTable: string,
    public followerId: string,
    public follower: string,
    public followed_at: string,
    public infoTable: string,
    public infoId: string,
    public followerCount: string,
    public followingCount: string,
  ) {
    this.follow = this.follow.bind(this)
    this.unfollow = this.unfollow.bind(this)
    this.checkFollow = this.checkFollow.bind(this)
  }
  follow(id: ID, target: ID): Promise<number> {
    const now = new Date()
    const double = `select * from ${this.followingTable} where ${this.id} = $1 and ${this.following}=$2 `
    const query1 = `insert into ${this.followingTable}(${this.id}, ${this.following}, ${this.following_at}) values ($1, $2, $3) on conflict (${this.id}, ${this.following}) do nothing`
    const query2 = `insert into ${this.followerTable}(${this.followerId}, ${this.follower}, ${this.followed_at}) values ($1, $2, $3) on conflict (${this.followerId}, ${this.follower}) do nothing`
    const query3 = `
            insert into ${this.infoTable}(${this.infoId},${this.followingCount}, ${this.followerCount})
            values ($1, 1, 0)
            on conflict (${this.infoId}) do update set ${this.followingCount} =   ${this.infoTable}.${this.followingCount} + 1`
    const query4 = `
            insert into ${this.infoTable}(${this.infoId},${this.followingCount}, ${this.followerCount})
            values ($1, 0, 1)
            on conflict (${this.infoId}) do update set ${this.followerCount} = ${this.infoTable}.${this.followerCount} + 1`
    return this.execute([{ query: double, params: [id, target] }], true).then((data) => {
      if (data > 0) {
        return 0
      } else {
        return this.execute(
          [
            { query: query1, params: [id, target, now] },
            { query: query2, params: [target, id, now] },
            { query: query3, params: [id] },
            { query: query4, params: [target] },
          ],
          true,
        )
      }
    })
  }
  unfollow(id: ID, target: ID): Promise<number> {
    const query1 = `delete from ${this.followingTable} where ${this.id} = $1 and ${this.following}=$2`
    const query2 = `delete from ${this.followerTable} where ${this.followerId} = $1 and ${this.follower}=$2`
    const query3 = `
            update ${this.infoTable}
            set ${this.followingCount} = ${this.followingCount} -1
            where ${this.infoId} = $1`
    const query4 = `
            update ${this.infoTable}
            set ${this.followerCount} =${this.followerCount} - 1
            where ${this.infoId} = $1`
    return this.execute(
      [
        { query: query1, params: [id, target] },
        { query: query2, params: [target, id] },
        { query: query3, params: [id] },
        { query: query4, params: [target] },
      ],
      true,
    )
  }
  checkFollow(id: ID, target: ID): Promise<boolean> {
    const check = `select ${this.id} from ${this.followingTable} where ${this.id} = $1 and ${this.following} = $2 `
    return this.execute([{ query: check, params: [id, target] }]).then((count) => {
      return count > 0 ? true : false
    })
  }
}

export class SqlUserRepository extends SearchRepository<User, UserFilter> implements UserRepository {
  constructor(db: DB) {
    super(db.query, "users", userModel, db.driver, buildQuery)
  }
  load(id: string, userId?: string): Promise<User | null> {
    const params = []
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

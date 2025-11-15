import { Log, SearchResult } from "onecore"
import { DB, SearchRepository } from "query-core"
import { UserController } from "./controller"
import { buildQuery } from "./query"
import { User, UserFilter, userModel, UserRepository, UserService } from "./user"

export * from "./controller"

export class SqlUserRepository extends SearchRepository<User, UserFilter> implements UserRepository {
  constructor(db: DB) {
    super(db.query, "users", userModel, db.driver, buildQuery)
  }
  load(id: string): Promise<User | null> {
    let query = `select * from users where username = ${this.param(1)}`
    return this.query<User>(query, [id], this.map).then((users) => {
      if (users && users.length > 0) {
        return users[0]
      } else {
        query = `select * from users where id = ${this.param(1)}`
        return this.query<User>(query, [id], this.map).then((users) => (users && users.length > 0 ? users[0] : null))
      }
    })
  }
}

export class UserUseCase implements UserService {
  constructor(private repository: UserRepository) {}
  search(filter: UserFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<User>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string): Promise<User | null> {
    return this.repository.load(id)
  }
}

export function useUserController(db: DB, log: Log): UserController {
  const repo = new SqlUserRepository(db)
  const service = new UserUseCase(repo)
  return new UserController(service, log)
}

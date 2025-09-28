import { GenericUseCase, Log, SearchResult } from "onecore"
import { DB, SearchBuilder } from "query-core"
import { UserController } from "./controller"
import { SqlUserRepository } from "./repository"
import { User, UserFilter, userModel, UserRepository, UserService } from "./user"

export * from "./controller"
export * from "./user"

export class UserUseCase extends GenericUseCase<User, string> implements UserService {
  constructor(private repo: UserRepository) {
    super(repo)
  }
  search(filter: UserFilter, limit: number, page?: number | string, fields?: string[]): Promise<SearchResult<User>> {
    return this.repo.search(filter, limit, page, fields)
  }
  assign(id: string, roles: string[]): Promise<number> {
    return this.repo.assign(id, roles)
  }
}

export function useUserController(db: DB, log: Log): UserController {
  const builder = new SearchBuilder<User, UserFilter>(db.query, "users", userModel, db.driver)
  const repo = new SqlUserRepository(builder.search, db)
  const service = new UserUseCase(repo)
  return new UserController(service, log)
}

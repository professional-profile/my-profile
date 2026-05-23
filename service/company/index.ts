import { FollowService, SqlFollowRepository } from "follow-service"
import { DB, FollowRepository, SearchResult } from "onecore"
import { User } from "../shared/user"
import { Company, CompanyFilter, CompanyRepository, CompanyService } from "./company"
import { CompanyController } from "./controller"
import { SqlCompanyRepository } from "./repository"
import { SqlUserRepository, UserFilter, UserRepository } from "./user"
export * from "./controller"

export class CompanyUseCase extends FollowService<string> implements CompanyService {
  constructor(private repository: CompanyRepository, protected followRepository: FollowRepository<string>, protected userRepository: UserRepository) {
    super(followRepository)
  }
  search(filter: CompanyFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Company>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(slug: string, userId?: string): Promise<Company | null> {
    return this.repository.load(slug, userId)
  }
  getIdBySlug(slug: string): Promise<string> {
    return this.repository.getIdBySlug(slug)
  }
  getFollowers(filter: UserFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<User>> {
    return this.userRepository.search(filter, limit, page, fields).then(res => {
      console.log(JSON.stringify(res.list))
      return res
    })
  }
}

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
  const userRepository = new SqlUserRepository(db)
  const service = new CompanyUseCase(repository, followRepository, userRepository)
  return new CompanyController(service)
}

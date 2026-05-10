import { SearchResult } from "onecore"
import { DB } from "sql-core"
import { Company, CompanyFilter, CompanyRepository, CompanyService } from "./company"
import { CompanyController } from "./controller"
import { SqlCompanyRepository } from "./repository"
export * from "./controller"

export class CompanyUseCase implements CompanyService {
  constructor(private repository: CompanyRepository) {}
  search(filter: CompanyFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Company>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(slug: string): Promise<Company | null> {
    return this.repository.load(slug)
  }
}

export function useCompanyController(db: DB): CompanyController {
  const repository = new SqlCompanyRepository(db)
  const service = new CompanyUseCase(repository)
  return new CompanyController(service)
}

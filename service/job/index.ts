import { SearchResult } from "onecore"
import { DB } from "query-core"
import { JobController } from "./controller"
import { Job, JobFilter, JobRepository, JobService } from "./job"
import { SqlJobRepository } from "./repository"
export * from "./controller"

export class JobUseCase implements JobService {
  constructor(private repository: JobRepository) {}
  search(filter: JobFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Job>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string): Promise<Job | null> {
    return this.repository.load(id)
  }
}

export function useJobController(db: DB): JobController {
  const repository = new SqlJobRepository(db)
  const service = new JobUseCase(repository)
  return new JobController(service)
}

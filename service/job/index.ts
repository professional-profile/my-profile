import { DB } from "onecore"
import { SqlSavedRepository } from "saved-service"
import { JobController } from "./controller"
import { SqlJobRepository } from "./repository"
import { JobUseCase } from "./service"
export * from "./controller"

export function useJobController(db: DB): JobController {
  const repository = new SqlJobRepository(db)
  const savedRepository = new SqlSavedRepository(db, "saved_jobs", "user_id", "id", "saved_at")
  const service = new JobUseCase(repository, savedRepository, 200)
  return new JobController(service)
}

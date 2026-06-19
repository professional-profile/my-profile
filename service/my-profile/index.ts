import { DB, SaveStrings } from "onecore"
import { MyProfileController } from "./controller"
import { SqlUserRepository } from "./repository"
import { MyProfileUseCase } from "./service"
export * from "./controller"

export function useMyProfileController(db: DB, saveSkills?: SaveStrings, saveInterests?: SaveStrings): MyProfileController {
  const repository = new SqlUserRepository(db)
  const service = new MyProfileUseCase(repository)
  return new MyProfileController(service, saveSkills, saveInterests)
}

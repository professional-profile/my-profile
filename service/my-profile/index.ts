import { SaveStrings } from "onecore"
import { CRUDRepository, DB } from "sql-core"
import { MyProfileController } from "./controller"
import { MyProfileService, User, userModel, UserRepository, UserSettings } from "./user"
export * from "./controller"

const settings: UserSettings = {
  language: "en-us",
  dateFormat: "dd/mm/yyyy",
  timeFormat: "hh:mm:ss",
  notification: true,
  dateTimeFormat: "dd-mm-yyyy:hh:mm",
  emailFeedUpdates: true,
  notifyPostMentions: true,
  emailPostMentions: false,
  emailCommentsOfYourPosts: true,
  notifyCommentsOfYourPosts: true,
  showMyProfileInSpacesAroundMe: true,
  emailEventInvitations: true,
  emailWhenNewEventsAround: false,
  showAroundMeResultsInMemberFeed: true,
  followingListPublicOnMyProfile: true,
  notifyWhenNewEventsAround: true,
  searchEnginesLinksToMyProfile: false,
  notifyFeedUpdates: false,
  notifyEventInvitations: false,
}
export class SqlUserRepository extends CRUDRepository<User, string> implements UserRepository {
  constructor(db: DB) {
    super(db, "users", userModel)
  }
}

export class MyProfileUseCase implements MyProfileService {
  constructor(private repository: UserRepository) {}
  async getMyProfile(id: string): Promise<User | null> {
    const user = await this.repository.load(id)
    if (user) {
      delete user.settings
      return user
    }
    return null
  }
  saveMyProfile(user: User): Promise<number> {
    return this.repository.patch(user)
  }
  getMySettings(id: string): Promise<UserSettings | null> {
    return this.repository.load(id).then((user) => (user && user.settings ? user.settings : settings))
  }
  saveMySettings(id: string, settings: UserSettings): Promise<number> {
    return this.repository.patch({ id, settings })
  }
}

export function useMyProfileController(db: DB, saveSkills?: SaveStrings, saveInterests?: SaveStrings): MyProfileController {
  const repository = new SqlUserRepository(db)
  const service = new MyProfileUseCase(repository)
  return new MyProfileController(service, saveSkills, saveInterests)
}

import { DB, Repository } from "query-core"
import { MyProfileService, User, userModel, UserRepository } from "./user"

export class SqlUserRepositoy extends Repository<User, string> implements UserRepository {
  constructor(db: DB) {
    super(db, "users", userModel)
  }
}

export class MyProfileManager implements MyProfileService {
  constructor(private repository: UserRepository) {}
  getMyProfile(id: string): Promise<User | null> {
    return this.repository.load(id).then((user) => {
      let rs = null
      if (user) {
        delete user.settings
        rs = user
      }
      return rs
    })
  }
  saveMyProfile(user: User): Promise<number> {
    return this.repository.patch(user)
  }
}

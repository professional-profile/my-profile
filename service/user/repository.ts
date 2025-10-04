import { Attribute, Attributes, Search, StringMap } from "onecore"
import { buildMap, buildToInsert, buildToInsertBatch, buildToUpdate, DB, metadata, SearchResult, Statement } from "query-core"
import { User, UserFilter, userModel, UserRepository } from "./user"

const userRoleModel: Attributes = {
  userId: {
    column: "user_id",
    key: true,
  },
  roleId: {
    column: "role_id",
    key: true,
  },
}
interface UserRole {
  userId?: string
  roleId: string
}

export class SqlUserRepository implements UserRepository {
  map: StringMap
  roleMap: StringMap
  primaryKeys: Attribute[]
  attributes: Attributes
  constructor(private find: Search<User, UserFilter>, private db: DB) {
    this.attributes = userModel
    const meta = metadata(userModel)
    this.primaryKeys = meta.keys
    this.map = buildMap(userModel)
    this.roleMap = buildMap(userRoleModel)
    this.search = this.search.bind(this)
    this.create = this.create.bind(this)
    this.update = this.update.bind(this)
    this.patch = this.patch.bind(this)
    this.delete = this.delete.bind(this)
  }

  search(filter: UserFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<User>> {
    return this.find(filter, limit, page, fields)
  }
  load(id: string): Promise<User | null> {
    const query = `select * from users where id = ${this.db.param(1)}`
    return this.db.query<User>(query, [id], this.map).then((users) => (users && users.length > 0 ? users[0] : null))
  }
  create(user: User): Promise<number> {
    const stmt = buildToInsert(user, "users", userModel, this.db.param)
    if (!stmt) {
      return Promise.resolve(-1)
    }
    return this.db.exec(stmt.query, stmt.params)
  }
  update(user: User): Promise<number> {
    const stmt = buildToUpdate(user, "users", userModel, this.db.param)
    if (!stmt) {
      return Promise.resolve(-1)
    }
    return this.db.exec(stmt.query, stmt.params)
  }
  patch(user: User): Promise<number> {
    return this.update(user)
  }
  delete(id: string): Promise<number> {
    const stmts: Statement[] = []
    stmts.push({ query: `delete from users where id = ${this.db.param(1)}`, params: [id] })
    return this.db.execBatch(stmts)
  }
}

function insertUserRoles(stmts: Statement[], userId: string, roles: string[] | undefined, param: (i: number) => string): Statement[] {
  if (roles && roles.length > 0) {
    const userRoles = roles.map<UserRole>((i) => {
      const userRole: UserRole = { userId, roleId: i }
      return userRole
    })
    const stmt = buildToInsertBatch(userRoles, "user_roles", userRoleModel, param)
    if (stmt) {
      stmts.push(stmt)
    }
  }
  return stmts
}

import { DB } from "onecore"
import { param } from "pg-extension"
import { buildSort, SearchRepository, Statement } from "sql-core"
import { Company, CompanyFilter, companyModel, CompanyRepository } from "./company"

export class SqlCompanyRepository extends SearchRepository<Company, CompanyFilter> implements CompanyRepository {
  constructor(db: DB) {
    super(db, "companies", companyModel, buildQuery)
  }
  async load(slug: string, userId?: string): Promise<Company | null> {
    let params = []
    let query: string

    if (userId) {
      query = `select c.*, ci.follower_count, ci.following_count, uf.following_at, ur.followed_at
        from companies c
        left join company_info ci on c.id = ci.id
        left join company_following uf on cf.id = ${this.db.param(1)} and cf.following = c.id
        left join company_followers cr on cr.id = ${this.db.param(2)} and cr.follower = c.id
        where c.slug = ${this.db.param(3)}`
      params.push(userId, userId)
    } else {
      query = `select c.*, ci.follower_count, ci.following_count
        from companies c
        left join company_info ci on u.id = ci.id
        where u.slug = ${this.db.param(1)}`
    }
    params.push(slug)

    let companies = await this.db.query<Company>(query, params, this.map)
    if (companies && companies.length > 0) {
      return companies[0]
    }

    params = []
    query = `select * from companies where id = ${this.db.param(1)}`
    if (userId) {
      query = `select c.*, ci.follower_count, ci.following_count, cf.following_at, cr.followed_at
        from companies c
        left join company_info ci on c.id = ci.id
        left join company_following cf on cf.id = ${this.db.param(1)} and cf.following = c.id
        left join company_followers cr on cr.id = ${this.db.param(2)} and cr.follower = c.id
        where c.id = ${this.db.param(3)}`
      params.push(userId, userId)
    } else {
      query = `select c.*, ci.follower_count, ci.following_count
        from companies c
        left join company_info ci on c.id = ci.id
        where c.id = ${this.db.param(1)}`
    }
    params.push(slug)

    companies = await this.db.query<Company>(query, [slug], this.map)
    return companies && companies.length > 0 ? companies[0] : null
  }
}

export function buildQuery(filter: CompanyFilter): Statement {
  let query = `select * from companies`
  const where: string[] = []
  const params = []
  let i = 1

  if (filter.q) {
    const q = filter.q.replace(/%/g, "\\%").replace(/_/g, "\\_")
    where.push(`company_name ilike ${param(i++)}`)
    params.push(`%${q}%`)
  }

  if (where.length > 0) {
    query = query + ` where ` + where.join(` and `)
  }
  const orderBy = buildSort(filter.sort, companyModel)
  if (orderBy) {
    query = query + ` order by ${orderBy}`
  }
  return { query, params }
}

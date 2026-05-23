import { DB, Filter, SearchResult, Statement, TimeRange } from "onecore"
import { param } from "pg-extension"
import { buildSort, SearchRepository } from "sql-core"
import { Company, companyModel } from "../shared/company"

export interface CompanyFilter extends Filter {
  userSlug?: string
  id?: string
  slug?: string
  title?: string
  description?: string
  publishedAt: TimeRange
  tags?: string[]
  status?: string
  authorId?: string
  userId?: string
  isSaved?: boolean
}
export interface CompanyRepository {
  search(filter: CompanyFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Company>>
}

export class SqlCompanyRepository extends SearchRepository<Company, CompanyFilter> implements CompanyRepository {
  constructor(db: DB) {
    super(db, "companies", companyModel, buildCompanyQuery)
  }
}
export function buildCompanyQuery(filter: CompanyFilter): Statement {
  let query = `select * from companies`
  const where: string[] = []
  const params = []
  let i = 1

  if (filter.userId) {
    query = `
      select c.id, c.slug, c.company_name, c.website, c.industry, c.size, c.logo, c.cover_url,
        ci.follower_count, cr.followed_at
      from company_following f
        inner join companies c on c.id = f.following
        left join company_info ci on c.id = ci.id
        left join company_followers cr on cr.id = c.id and cr.follower = ${param(i++)} `
    params.push(filter.userId)
  } else {
    query = `select c.id, c.slug, c.company_name, c.website, c.industry, c.size, c.logo, c.cover_url, ci.follower_count
      from company_following f
        inner join companies c on c.id = f.following
        left join company_info ci on c.id = ci.id`
  }

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

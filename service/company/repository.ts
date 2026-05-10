import { DB } from "onecore"
import { param } from "pg-extension"
import { buildSort, SearchRepository, Statement } from "sql-core"
import { Company, CompanyFilter, companyModel, CompanyRepository } from "./company"

export class SqlCompanyRepository extends SearchRepository<Company, CompanyFilter> implements CompanyRepository {
  constructor(db: DB) {
    super(db, "companies", companyModel, buildQuery)
  }
  async load(slug: string): Promise<Company | null> {
    const query = `select * from companies where slug = ${this.db.param(1)}`
    const companys = await this.db.query<Company>(query, [slug], this.map)
    return companys && companys.length > 0 ? companys[0] : null
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

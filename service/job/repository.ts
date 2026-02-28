import { DB } from "onecore"
import { param } from "pg-extension"
import { buildSort, SearchRepository, Statement } from "query-core"
import { Job, JobFilter, jobModel, JobRepository } from "./job"

export class SqlJobRepository extends SearchRepository<Job, JobFilter> implements JobRepository {
  constructor(db: DB) {
    super(db, "jobs", jobModel, buildQuery)
  }
  async load(id: string): Promise<Job | null> {
    const query = `select * from jobs where slug = ${this.db.param(1)}`
    const jobs = await this.db.query<Job>(query, [id])
    return jobs && jobs.length > 0 ? jobs[0] : null
  }
}

export function buildQuery(filter: JobFilter): Statement {
  let query = `select * from jobs`
  const where = []
  const params = []
  let i = 1

  if (filter.skills && filter.skills.length > 0) {
    params.push(filter.skills)
    where.push(`skills && ${param(i++)}`)
  }

  if (filter.publishedAt) {
    if (filter.publishedAt.min) {
      where.push(`published_at >= ${param(i++)}`)
      params.push(filter.publishedAt.min)
    }
    if (filter.publishedAt.max) {
      where.push(`published_at <= ${param(i++)}`)
      params.push(filter.publishedAt.max)
    }
  }

  if (filter.id && filter.id.length > 0) {
    where.push(`id = ${param(i++)}`)
    params.push(filter.id)
  }

  if (filter.q && filter.q.length > 0) {
    const q = "%" + filter.q.replace(/%/g, "\\%").replace(/_/g, "\\_") + "%"
    where.push(`title ilike ${param(i++)}`)
    params.push(q)
  }

  if (where.length > 0) {
    query = query + ` where ` + where.join(` and `)
  }
  const orderBy = buildSort(filter.sort, jobModel)
  if (orderBy) {
    query = query + ` order by ${orderBy}`
  }
  return { query, params }
}

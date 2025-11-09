import { param } from "pg-extension"
import { buildSort, Statement } from "query-core"
import { JobFilter, jobModel } from "./job"

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
  if (orderBy.length > 0) {
    query = query + ` order by ${orderBy}`
  }
  return { query, params }
}

import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  cloneFilter,
  escape,
  escapeArray,
  format,
  fromRequest,
  getSearch,
  hasSearch,
  queryLimit,
  queryPage,
  resources,
} from "express-ext"
import { SearchResult } from "onecore"
import { DB, SearchBuilder } from "query-core"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { Job, JobFilter, jobModel, JobRepository, JobService } from "./job"
import { buildQuery } from "./query"
export * from "./job"

export class SqlJobRepository extends SearchBuilder<Job, JobFilter> implements JobRepository {
  constructor(db: DB) {
    super(db.query, "jobs", jobModel, db.driver, buildQuery)
  }
  load(id: string): Promise<Job | null> {
    const query = `select * from jobs where id = ${this.param(1)}`
    return this.query<Job>(query, [id], this.map).then((jobs) => (jobs && jobs.length > 0 ? jobs[0] : null))
  }
}

export class JobUseCase implements JobService {
  constructor(private repository: JobRepository) {}
  search(filter: JobFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Job>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string): Promise<Job | null> {
    return this.repository.load(id)
  }
}

const fields = ["id", "title", "publishedAt", "description"]
export class JobController {
  constructor(private jobService: JobService) {
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
  }
  search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    let filter: JobFilter = {
      limit: resources.defaultLimit,
      // title: "Java",
    }
    if (hasSearch(req)) {
      filter = fromRequest<JobFilter>(req)
      format(filter, ["publishedAt"])
    }
    if (!filter.sort) {
      console.log("sort " + filter.sort)
      filter.sort = "-publishedAt"
      console.log("sort " + filter.sort)
    }
    const page = queryPage(req, filter)
    const limit = queryLimit(req)
    this.jobService
      .search(cloneFilter(filter, limit, page), limit, page)
      .then((result) => {
        const list = escapeArray(result.list)
        for (const item of list) {
          item.publishedAt = formatDateTime(item.publishedAt, dateFormat)
        }
        const search = getSearch(req.url)
        render(req, res, "careers", {
          resource,
          limits: resources.limits,
          filter,
          list,
          pages: buildPages(limit, result.total),
          pageSearch: buildPageSearch(search),
          sort: buildSortSearch(search, fields, filter.sort),
          message: buildMessage(resource, list, limit, page, result.total),
        })
      })
      .catch((err) => renderError500(req, res, resource, err))
  }

  view(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const id = req.params.id
    this.jobService
      .load(id)
      .then((job) => {
        if (!job) {
          renderError404(req, res, resource)
        } else {
          job.publishedAt = formatDateTime(job.publishedAt, dateFormat)
          render(req, res, "job", { resource, job: escape(job) })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
}

export function useJobController(db: DB): JobController {
  const repository = new SqlJobRepository(db)
  const service = new JobUseCase(repository)
  return new JobController(service)
}

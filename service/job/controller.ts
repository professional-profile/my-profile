import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  cloneFilter,
  escapeArray,
  format,
  fromRequest,
  getSearch,
  hasSearch,
  queryLimit,
  queryPage,
  resources,
} from "express-ext"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { JobFilter, JobService } from "./job"

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
      filter.sort = "-publishedAt"
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
        render(req, res, "jobs", {
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
          render(req, res, "job", { resource, job })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
}

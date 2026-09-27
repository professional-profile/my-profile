import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  escapeArray,
  format,
  fromRequest,
  getSearch,
  hasSearch,
  removeSort,
  resources,
  SavedController
} from "express-web-kit"
import { Item } from "onecore"
import { formatDateTime } from "ui-formatter"
import { getDateFormat, getLang, getLangSearch, getResource } from "../resources"
import { JobFilter, Published } from "../shared/job"
import { render, renderError404, renderError500 } from "../template"
import { JobService } from "./job"

export class JobController extends SavedController {
  constructor(private service: JobService) {
    super(service, "id", "userId")
    this.search = this.search.bind(this)
    this.getSavedJobs = this.getSavedJobs.bind(this)
    this.view = this.view.bind(this)
  }
  async search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const langSearch = getLangSearch(lang)
    let filter: JobFilter = { limit: resources.defaultLimit }
    if (hasSearch(req)) {
      filter = fromRequest<JobFilter>(req)
      format(filter, ["publishedAt"])
    }
    if (!filter.sort) {
      filter.sort = "-publishedAt"
    }
    filter.status = Published
    filter.userId = res.locals.userId
    const { page, limit, sort } = filter
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of list) {
        item.publishedAt = formatDateTime(item.publishedAt, dateFormat)
      }
      const search = getSearch(req.url)
      const sortSearch = removeSort(search)
      const prefix = sortSearch ? `?${sortSearch}&` : "?"
      const sort1: Item = { id: "timeDescSort", value: `${prefix}${resources.sort}=-publishedAt`, text: resource.sort_time_desc }
      const sort2: Item = { id: "timeAscSort", value: `${prefix}${resources.sort}=publishedAt`, text: resource.sort_time_asc }
      const sortText = sort == "publishedAt" ? resource.sort_desc_time_asc : resource.sort_desc_time_desc
      render(req, res, "jobs", {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        langSearch,
        sorts: [sort1, sort2],
        sortText,
        message: buildMessage(resource, list, limit, page, result.total),
      })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async getSavedJobs(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const langSearch = getLangSearch(lang)
    let filter: JobFilter = {
      limit: resources.defaultLimit,
      publishedAt: {},
    }
    if (hasSearch(req)) {
      filter = fromRequest<JobFilter>(req)
      format(filter, ["publishedAt"])
    }
    if (!filter.sort) {
      filter.sort = "-savedAt"
    }
    filter.status = Published
    filter.userId = res.locals.userId
    filter.isSaved = true
    const { page, limit, sort } = filter
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list)
      for (const item of result.list) {
        item.publishedAt = formatDateTime(item.publishedAt, dateFormat)
      }
      const search = getSearch(req.url)
      const sortSearch = removeSort(search)
      const prefix = sortSearch ? `?${sortSearch}&` : "?"
      const sort1: Item = { id: "timeDescSort", value: `${prefix}${resources.sort}=-publishedAt`, text: resource.sort_time_desc }
      const sort2: Item = { id: "timeAscSort", value: `${prefix}${resources.sort}=publishedAt`, text: resource.sort_time_asc }
      const sortText = filter.sort == "publishedAt" ? resource.sort_desc_time_asc : resource.sort_desc_time_desc
      render(req, res, "jobs", {
        resource,
        limits: resources.limits,
        filter,
        list,
        pages: buildPages(limit, result.total),
        pageSearch: buildPageSearch(search),
        langSearch,
        sorts: [sort1, sort2],
        sortText,
        message: buildMessage(resource, list, limit, page, result.total),
      })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
  async view(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const dateFormat = getDateFormat(lang)
    const slug = req.params.slug as string
    const userId: string = res.locals.userId
    try {
      const job = await this.service.load(slug, userId)
      if (!job) {
        return renderError404(req, res, resource)
      }
      job.publishedAt = formatDateTime(job.publishedAt, dateFormat)
      render(req, res, "job", { resource, job })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
}

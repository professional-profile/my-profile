import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  escapeArray,
  fromRequest,
  getSearch,
  hasSearch,
  removeSort,
  resources
} from "express-core-web"
import { Item } from "onecore"
import { getLang, getLangSearch, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { CompanyFilter, CompanyService } from "./company"

export class CompanyController {
  constructor(private service: CompanyService) {
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
  }
  async search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    const langSearch = getLangSearch(lang)
    let filter: CompanyFilter = { limit: resources.defaultLimit }
    if (hasSearch(req)) {
      filter = fromRequest<CompanyFilter>(req)
    }
    const { page, limit, sort } = filter
    try {
      const result = await this.service.search(filter, limit, page)
      const list = escapeArray(result.list)
      const search = getSearch(req.url)
      const sortSearch = removeSort(search)
      const prefix = sortSearch ? `?${sortSearch}&` : "?"
      const sort1: Item = {id: "timeDescSort", value: `${prefix}${resources.sort}=-publishedAt`, text: resource.sort_time_desc}
      const sort2: Item = {id: "timeAscSort", value: `${prefix}${resources.sort}=publishedAt`, text: resource.sort_time_asc}
      const sortText = sort == "publishedAt" ? resource.sort_desc_time_asc : resource.sort_desc_time_desc
      render(req, res, "companies", {
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
    const slug = req.params.slug
    try {
      const company = await this.service.load(slug)
      if (!company) {
        return renderError404(req, res, resource)
      }
      console.log("company " + JSON.stringify(company))
      render(req, res, "company", { resource, company })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
}

import { Request, Response } from "express"
import {
  buildMessage,
  buildPages,
  buildPageSearch,
  buildSortSearch,
  cloneFilter,
  escape,
  escapeArray,
  fromRequest,
  getOffset,
  getSearch,
  hasSearch,
  queryLimit,
  queryPage,
  resources,
} from "express-ext"
import { Log } from "onecore"
import { getLang, getResource } from "../resources"
import { render, renderError404, renderError500 } from "../template"
import { UserFilter, UserService } from "./user"

const fields = ["userId", "username", "email", "displayName", "status"]

export class UserController {
  constructor(private service: UserService, private log: Log) {
    this.search = this.search.bind(this)
    this.view = this.view.bind(this)
  }
  search(req: Request, res: Response) {
    const lang = getLang(req)
    const resource = getResource(lang)
    let filter: UserFilter = {
      q: "",
      limit: resources.defaultLimit,
    }
    if (hasSearch(req)) {
      filter = fromRequest<UserFilter>(req, ["status"])
    }
    const page = queryPage(req, filter)
    const limit = queryLimit(req)
    const offset = getOffset(limit, page)
    this.service
      .search(cloneFilter(filter, limit, page), limit, page)
      .then((result) => {
        const list = escapeArray(result.list, offset, "sequence")
        const search = getSearch(req.url)
        render(req, res, "users", {
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
    const id = req.params.id
    this.service
      .load(id)
      .then((user) => {
        if (!user) {
          renderError404(req, res, resource)
        } else {
          render(req, res, "user", {
            resource,
            user: escape(user),
          })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
}

import { MenuItemLoader } from "content-menu"
import { Request, Response } from "express"
import { getView } from "express-ext"
import { getResource } from "../resources"
import { renderError404, renderError500 } from "../template"
import { ContentService } from "./content"

export class ContentController {
  constructor(private service: ContentService, private langs: string[], private menuLoader: MenuItemLoader) {
    this.view = this.view.bind(this)
  }
  view(req: Request, res: Response) {
    let id = req.params.id
    let lang = req.params.lang
    if (!id && !lang) {
      id = "home"
      lang = "en"
    }
    if (!lang) {
      lang = "en"
    }
    if (this.langs.includes(id)) {
      lang = id
      id = "home"
    }
    const resource = getResource(lang)
    this.service
      .load(id, lang)
      .then((content) => {
        if (!content) {
          renderError404(req, res, resource)
        } else {
          res.render(getView(req, "content"), { lang, resource, content })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
}

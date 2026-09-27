import { Request, Response } from "express"
import { getView } from "express-web-kit"
import { getResource } from "../resources"
import { renderError404, renderError500 } from "../template"
import { ContentService } from "./content"

export class ContentController {
  constructor(private service: ContentService, private langs: string[]) {
    this.view = this.view.bind(this)
  }
  async view(req: Request, res: Response) {
    let id = req.params.id as string
    let lang = req.params.lang as string
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
    try {
      const content = await this.service.load(id, lang)
      if (!content) {
        return renderError404(req, res, resource)
      }
      res.render(getView(req, "content"), { lang, resource, content })
    } catch (err) {
      renderError500(req, res, resource, err)
    }
  }
}

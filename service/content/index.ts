import { MenuItemLoader } from "content-menu"
import { Request, Response } from "express"
import { getView } from "express-ext"
import { DB } from "query-core"
import { getResource } from "../resources"
import { renderError404, renderError500 } from "../template"
import { Content, ContentRepository, ContentService } from "./content"
export * from "./content"

export class SqlContentRepository implements ContentRepository {
  constructor(protected db: DB) {}
  load(id: string, lang: string): Promise<Content | null> {
    return this.db.query<Content>("select id, lang, body from contents where id = $1 and lang = $2", [id, lang]).then((rows) => {
      if (rows.length === 0) {
        return null
      }
      return rows[0]
    })
  }
}
export class ContentUseCase implements ContentService {
  constructor(protected repository: ContentRepository) {}
  load(id: string, lang: string): Promise<Content | null> {
    return this.repository.load(id, lang).then((content) => {
      if (!content) {
        return this.repository.load(id, "en")
      }
      return content
    })
  }
}

export class ContentController {
  constructor(private service: ContentService, private langs: string[], private menuLoader: MenuItemLoader) {
    this.view = this.view.bind(this)
  }
  view(req: Request, res: Response) {
    let id = req.params["id"]
    let lang = req.params["lang"]
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
          this.menuLoader.load().then((items) => {
            res.render(getView(req, "content"), { lang, resource, content })
          })
        }
      })
      .catch((err) => renderError500(req, res, resource, err))
  }
}

export function useContentController(db: DB, langs: string[], menuLoader: MenuItemLoader): ContentController {
  const repository = new SqlContentRepository(db)
  const service = new ContentUseCase(repository)
  return new ContentController(service, langs, menuLoader)
}

import { MenuItemLoader } from "content-menu"
import { DB } from "query-core"
import { Content, ContentRepository, ContentService } from "./content"
import { ContentController } from "./controller"

export * from "./controller"

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

export function useContentController(db: DB, langs: string[], menuLoader: MenuItemLoader): ContentController {
  const repository = new SqlContentRepository(db)
  const service = new ContentUseCase(repository)
  return new ContentController(service, langs, menuLoader)
}

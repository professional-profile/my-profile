import { DB } from "query-core"
import { Content, ContentRepository, ContentService } from "./content"
import { ContentController } from "./controller"
export * from "./controller"

export class SqlContentRepository implements ContentRepository {
  constructor(protected query: <T>(sql: string, args?: any[]) => Promise<T[]>, protected param: (i: number) => string) {}
  async load(id: string, lang: string): Promise<Content | null> {
    const sql = `select id, lang, body from contents where id = ${this.param(1)} and lang = ${this.param(2)}`
    const contents = await this.query<Content>(sql, [id, lang])
    return contents.length === 0 ? null : contents[0]
  }
}

export class ContentUseCase implements ContentService {
  constructor(protected repository: ContentRepository) {}
  async load(id: string, lang: string): Promise<Content | null> {
    const content = await this.repository.load(id, lang)
    if (!content) {
      return this.repository.load(id, "en")
    }
    return content
  }
}

export function useContentController(db: DB, langs: string[]): ContentController {
  const repository = new SqlContentRepository(db.query, db.param)
  const service = new ContentUseCase(repository)
  return new ContentController(service, langs)
}

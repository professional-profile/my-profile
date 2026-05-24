import { DB } from "sql-core"
import { Content, ContentRepository, ContentService } from "./content"
import { ContentController } from "./controller"
import { SqlContentRepository } from "./repository"
export * from "./controller"

export class ContentUseCase implements ContentService {
  constructor(protected repository: ContentRepository) { }
  async load(id: string, lang: string): Promise<Content | null> {
    const content = await this.repository.load(id, lang)
    if (!content) {
      return this.repository.load(id, "en")
    }
    return content
  }
}

export function useContentController(db: DB, langs: string[]): ContentController {
  const repository = new SqlContentRepository(db)
  const service = new ContentUseCase(repository)
  return new ContentController(service, langs)
}

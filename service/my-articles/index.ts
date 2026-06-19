import { DB } from "onecore"
import { MyArticlesController } from "./controller"
import { SqlArticleRepository } from "./repository"
import { ArticleUseCase } from "./service"
export * from "./controller"

export function useMyArticlesController(db: DB): MyArticlesController {
  const repository = new SqlArticleRepository(db)
  const service = new ArticleUseCase(repository)
  return new MyArticlesController(service)
}

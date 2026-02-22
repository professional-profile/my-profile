import { SavedRepository, SearchResult } from "onecore"
import { buildToSave, SqlSavedRepository } from "pg-extension"
import { DB } from "query-core"
import { SqlRateRepository } from "rate-query"
import { SqlInfoRepository } from "review-reaction-query"
import { Info, infoModel, InfoRepository, Rate, rateModel, RateRepository, ShortRate } from "../shared/rate"
import { Article, ArticleFilter, ArticleRepository, ArticleService } from "./article"
import { ArticleController } from "./controller"
import { SqlArticleRepository } from "./repository"
export * from "./controller"

export class ArticleUseCase implements ArticleService {
  constructor(protected repository: ArticleRepository, protected savedRepository: SavedRepository<string, string>, protected max: number, protected rateRepository: RateRepository, protected infoRepository: InfoRepository) {
  }
  search(filter: ArticleFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Article>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string, userId?: string): Promise<Article | null> {
    return this.repository.load(id, userId)
  }
  async save(userId: string, id: string): Promise<number> {
    const count = await this.savedRepository.count(userId)
    if (count >= this.max) {
      return -1
    } else {
      return this.savedRepository.save(userId, id)
    }
  }
  remove(userId: string, id: string): Promise<number> {
    return this.savedRepository.remove(userId, id)
  }
  async rate(rate: Rate): Promise<number> {
    rate.time = new Date();
    const info = await this.infoRepository.exist(rate.id);
    if (!info) {
      const res = await this.rateRepository.create(rate, true);
      return res;
    }
    const exist = await this.rateRepository.load(rate.id, rate.author);
    if (!exist) {
      const res = await this.rateRepository.create(rate);
      return res;
    }
    const history: ShortRate = { review: exist.review, rate: exist.rate, time: exist.time };
    if (exist.histories && exist.histories.length > 0) {
      const histories = exist.histories;
      histories.push(history);
      rate.histories = histories;
    } else {
      rate.histories = [history];
    }
    const count = await this.rateRepository.update(rate, exist.rate);
    return count;
  }
}

export function useArticleController(db: DB): ArticleController {
  const repository = new SqlArticleRepository(db)
  const savedRepository = new SqlSavedRepository(db, "saved_articles", "user_id", "id", "saved_at")
  const rateRepository = new SqlRateRepository<Rate>(db, 'article_rates', rateModel, buildToSave, 5, 'article_info', 'rate', 'count', 'score', 'author', 'id');
  const infoRepository = new SqlInfoRepository<Info>(db, 'article_info', infoModel, buildToSave);
  const service = new ArticleUseCase(repository, savedRepository, 200, rateRepository, infoRepository)
  return new ArticleController(service)
}

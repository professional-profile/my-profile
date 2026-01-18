import { Log, SavedRepository, SearchResult } from "onecore"
import { buildToSave, SqlSavedRepository } from "pg-extension"
import { DB, SearchRepository } from "query-core"
import { BaseRepository, Info, infoModel, InfoRepository, Rate, rateModel, ShortRate } from "rate-core"
import { SqlRateRepository } from "rate-query"
import { SqlInfoRepository } from "review-reaction-query"
import { Article, ArticleFilter, articleModel, ArticleRepository, ArticleService } from "./article"
import { ArticleController } from "./controller"
import { buildQuery } from "./query"

export * from "./controller"

export class SqlArticleRepository extends SearchRepository<Article, ArticleFilter> implements ArticleRepository {
  constructor(db: DB) {
    super(db.query, "articles", articleModel, db.driver, buildQuery)
  }
  load(id: string, userId?: string): Promise<Article | null> {
    const params = []
    let query: string
    if (userId && userId.length > 0) {
      query = `select a.*, sa.saved_at 
        from articles a 
        left join saved_articles sa 
          on sa.id = a.id and sa.user_id = ${this.param(1)} where a.slug = ${this.param(2)}`
      params.push(userId)
    } else {
      query = `select a.* from articles a where a.slug = ${this.param(1)}`
    }
    params.push(id)
    return this.query<Article>(query, params, this.map).then((articles) => (articles && articles.length > 0 ? articles[0] : null))
  }
}

export class ArticleUseCase implements ArticleService {
  constructor(protected repository: ArticleRepository, protected savedRepository: SavedRepository<string, string>, protected max: number, public rateRepository: BaseRepository<Rate>, public infoRepository: InfoRepository) {
  }
  search(filter: ArticleFilter, limit: number, page?: number, fields?: string[]): Promise<SearchResult<Article>> {
    return this.repository.search(filter, limit, page, fields)
  }
  load(id: string, userId?: string): Promise<Article | null> {
    return this.repository.load(id, userId)
  }
  save(userId: string, id: string): Promise<number> {
    return this.savedRepository.count(userId).then((count) => {
      if (count >= this.max) {
        return -1
      } else {
        return this.savedRepository.save(userId, id)
      }
    })
  }
  remove(userId: string, id: string): Promise<number> {
    return this.savedRepository.remove(userId, id)
  }
  async rate(rate: Rate): Promise<number> {
    rate.time = new Date();
    const info = await this.infoRepository.exist(rate.id);
    if (!info) {
      const r0 = await this.rateRepository.create(rate, true);
      return r0;
    }
    const exist = await this.rateRepository.load(rate.id, rate.author);
    if (!exist) {
      const r1 = await this.rateRepository.create(rate);
      return r1;
    }
    const sr: ShortRate = { review: exist.review, rate: exist.rate, time: exist.time };
    if (exist.histories && exist.histories.length > 0) {
      const history = exist.histories;
      history.push(sr);
      rate.histories = history;
    } else {
      rate.histories = [sr];
    }
    const res = await this.rateRepository.update(rate, exist.rate);
    return res;
  }
}

export function useArticleController(db: DB, log: Log): ArticleController {
  const repository = new SqlArticleRepository(db)
  const savedRepository = new SqlSavedRepository(db, "saved_articles", "user_id", "id", "saved_at")
  const rateRepository = new SqlRateRepository<Rate>(db, 'article_rates', rateModel, buildToSave, 5, 'article_info', 'rate', 'count', 'score', 'author', 'id');
  const infoRepository = new SqlInfoRepository<Info>(db, 'article_info', infoModel, buildToSave);
  const service = new ArticleUseCase(repository, savedRepository, 200, rateRepository, infoRepository)
  return new ArticleController(service, log)
}

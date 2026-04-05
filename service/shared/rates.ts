import { Attributes, DB, Filter, SearchResult, Statement } from "onecore";
import { param } from "pg-extension";
import { buildSort, SearchRepository } from "query-core";

export const rateModel: Attributes = {
  id: {
    key: true,
    required: true,
    operator: '='
  },
  author: {
    key: true,
    required: true,
    operator: '='
  },
  rate: {
    type: 'integer',
  },
  time: {
    type: 'datetime',
  },
  review: {
    q: true,
  },
  usefulCount: {
    column: "useful_count",
    type: 'integer',
    min: 0
  },
  replyCount: {
    column: "reply_count",
    type: 'integer',
    min: 0
  },
  anonymous: {
    type: 'boolean',
  },
  displayName: {
    column: "display_name",
  }
};

export interface RateFilter extends Filter {
  id: string
  rate?: number
  sort?: string
}
export function buildQuery(filter: RateFilter): Statement {
  let query = `select ar.*, u.display_name from article_rates ar inner join users u on ar.author = u.id`
  const where: string[] = []
  const params = []
  let i = 1

  if (filter.id) {
    params.push(filter.id)
    where.push(`ar.id = ${param(i++)}`)
  }
  if (filter.rate) {
    params.push(filter.rate)
    where.push(`ar.rate = ${param(i++)}`)
  }

  if (where.length > 0) {
    query = query + ` where ` + where.join(` and `)
  }
  const orderBy = buildSort(filter.sort, rateModel)
  if (orderBy) {
    query = query + ` order by ${orderBy}`
  }
  return { query, params }
}

export interface Rate {
  author: string;
  authorURL?: string;
  name: string;
  displayName: string;
  anonymous: boolean;
  rate: number;
  id: string;
  time: Date;
  review: string;
  usefulCount: number;
  replyCount: number;
  histories?: History[];
}
export interface RatesRepository {
  search(filter: RateFilter, limit: number, page?: number | string, fields?: string[]): Promise<SearchResult<Rate>>
}

export class SearchRateRepository extends SearchRepository<Rate, RateFilter> implements RatesRepository {
  constructor(db: DB) {
    super(db, "article_rates", rateModel, buildQuery)
  }
}

import { Attributes, Filter } from "onecore";

export interface BaseRate {
  author: string;
  authorURL?: string;
  name: string;
  displayName: string;
  anonymous: boolean;
  rate: number;
}
export interface Rate extends BaseRate {
  id: string;
  time: Date;
  review: string;
  usefulCount: number;
  replyCount: number;
  histories?: ShortRate[];
}

export interface ShortRate {
  rate: number;
  time: Date;
  review: string;
}
export interface RateFilter extends Filter {
  id?: string;
  author?: string;
  rate: number;
  time?: Date;
  review?: string;
  usefulCount?: number;
  replyCount?: number;
}
export interface RateInfo {
  id: string;
  rate: number;
  count: number;
  score: number;
}
export interface ShortRates {
  rates: number[];
  time: Date;
  review: string;
}

export interface Info {
  id: string;
  rate: number;
  rate1: number;
  rate2: number;
  rate3: number;
  rate4: number;
  rate5: number;
  count: number;
  score: number;
}

export interface RateRepository {
  create(rate: Rate, newInfo?: boolean): Promise<number>;
  update(rate: Rate, oldRate: number): Promise<number>;
  load(id: string, author: string): Promise<Rate | null>;
}
export interface InfoRepository {
  exist(id: string, ctx?: any): Promise<boolean>;
}

export const rateHistoryModel: Attributes = {
  rate: {
    type: 'integer'
  },
  time: {
    type: 'datetime',
  },
  review: {
  },
};
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
    min: 1,
    max: 5,
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
  histories: {
    type: 'array',
    typeof: rateHistoryModel
  },
  anonymous: {
    type: 'boolean',
  }
};

export const infoModel: Attributes = {
  id: {
    key: true,
  },
  rate: {
    type: 'number'
  },
  rate1: {
    type: 'number',
  },
  rate2: {
    type: 'number',
  },
  rate3: {
    type: 'number',
  },
  rate4: {
    type: 'number',
  },
  rate5: {
    type: 'number',
  },
  count: {
    type: 'number',
  },
  score: {
    type: 'number',
  }
};
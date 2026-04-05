import { Attributes, buildMetadata, buildToInsert, buildToUpdate, DB, Statement, StringMap } from 'query-core';

export interface BaseRate {
  rateId: string
}
export interface RateRepository<R extends BaseRate> {
  create(rate: R, newInfo?: boolean): Promise<number>;
  update(rate: R, oldRate: number): Promise<number>;
  load(id: string, author: string): Promise<R | null>;
}

export class SqlRateRepository<R extends BaseRate> implements RateRepository<R> {
  constructor(protected db: DB, protected generateId: () => string, protected table: string, protected attributes: Attributes, protected max: number, protected infoTable: string, protected rateIdField?: string, rateField?: string, count?: string, score?: string, authorCol?: string, id?: string, idField?: string, idCol?: string, rateCol?: string) {
    const m = buildMetadata(attributes);
    this.map = m.map;
    this.id = (id && id.length > 0 ? id : 'id');
    this.rate = (rateCol && rateCol.length > 0 ? rateCol : 'rate');
    this.count = (count && count.length > 0 ? count : 'count');
    this.score = (score && score.length > 0 ? score : 'score');
    this.idField = (idField && idField.length > 0 ? idField : 'id');
    this.rateField = (rateField && rateField.length > 0 ? rateField : 'rate');
    this.authorCol = (authorCol && authorCol.length > 0 ? authorCol : 'author');
    if (idCol && idCol.length > 0) {
      this.idCol = idCol;
    } else {
      const c = attributes[this.idField];
      if (c) {
        this.idCol = (c.column && c.column.length > 0 ? c.column : this.idField);
      } else {
        this.idCol = this.idField;
      }
    }
    if (rateCol && rateCol.length > 0) {
      this.rate = rateCol;
    } else {
      const c = attributes[this.rateField];
      if (c) {
        this.rate = (c.column && c.column.length > 0 ? c.column : this.rateField);
      } else {
        this.rate = this.rateField;
      }
    }
    this.load = this.load.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.insertInfo = this.insertInfo.bind(this);
    this.updateNewInfo = this.updateNewInfo.bind(this);
    this.updateOldInfo = this.updateOldInfo.bind(this);
  }
  map?: StringMap;
  count: string;
  score: string;
  id: string;
  rate: string;
  idField: string;
  rateField: string;
  idCol: string;
  authorCol: string;
  load(id: string, author: string, ctx?: any): Promise<R | null> {
    return this.db.query<R>(`select * from ${this.table} where ${this.idCol} = ${this.db.param(1)} and ${this.authorCol} = ${this.db.param(2)}`, [id, author], this.map, undefined, ctx).then(rates => {
      return rates && rates.length > 0 ? rates[0] : null;
    });
  }
  create(rate: R, newInfo?: boolean): Promise<number> {
    rate.rateId = this.generateId()
    const stmt = buildToInsert(rate, this.table, this.attributes, this.db.param);
    if (stmt) {
      const obj: any = rate;
      const rateNum: number = obj[this.rateField];
      const id: string = obj[this.idField];
      if (newInfo) {
        const query = this.insertInfo(rateNum);
        const s2: Statement = { query, params: [id] };
        return this.db.executeBatch([s2, stmt], true);
      } else {
        const query = this.updateNewInfo(rateNum);
        const s2: Statement = { query, params: [id] };
        return this.db.executeBatch([s2, stmt], true);
      }
    } else {
      return Promise.resolve(-1);
    }
  }
  protected insertInfo(r: number): string {
    const rateCols: string[] = [];
    const ps: string[] = [];
    for (let i = 1; i <= this.max; i++) {
      rateCols.push(`${this.rate}${i}`);
      if (i === r) {
        ps.push('' + 1);
      } else {
        ps.push('0');
      }
    }
    const query = `
      insert into ${this.infoTable} (${this.id}, ${this.rate}, ${this.count}, ${this.score}, ${rateCols.join(',')})
      values (${this.db.param(1)}, ${r}, 1, ${r}, ${ps.join(',')})`;
    return query;
  }
  update(rate: R, oldRate: number): Promise<number> {
    const stmt = buildToUpdate(rate, this.table, this.attributes, this.db.param);
    if (stmt) {
      const obj: any = rate;
      const rateNum: number = obj[this.rateField];
      const id: string = obj[this.idField];
      const query = this.updateOldInfo(rateNum, oldRate);
      const s2: Statement = { query, params: [id] };
      return this.db.executeBatch([s2, stmt], true);
    } else {
      return Promise.resolve(-1);
    }
  }
  protected updateNewInfo(r: number): string {
    const query = `
      update ${this.infoTable} set ${this.rate} = (${this.score} + ${r})/(${this.count} + 1), ${this.count} = ${this.count} + 1, ${this.score} = ${this.score} + ${r}, ${this.rate}${r} = ${this.rate}${r} + 1
      where ${this.id} = ${this.db.param(1)}`;
    return query;
  }
  protected updateOldInfo(newRate: number, oldRate: number): string {
    if (newRate === oldRate) {
      return '';
    }
    const delta = newRate - oldRate;
    const query = `
      update ${this.infoTable} set ${this.rate} = (${this.score} + ${delta})/${this.count}, ${this.score} = ${this.score} + ${delta}, ${this.rate}${newRate} = ${this.rate}${newRate} + 1, ${this.rate}${oldRate} = ${this.rate}${oldRate} - 1
      where ${this.id} = ${this.db.param(1)}`;
    return query;
  }
}

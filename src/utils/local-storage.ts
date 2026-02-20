// localStorage-backed database that mimics a Supabase-like query API
const PREFIX = 'summit_crm_';

function getTable(table: string): Record<string, unknown>[] {
  try {
    const raw = localStorage.getItem(PREFIX + table);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function setTable(table: string, data: Record<string, unknown>[]) {
  localStorage.setItem(PREFIX + table, JSON.stringify(data));
}

type FilterOp = { column: string; op: 'eq' | 'neq' | 'gte' | 'lte'; value: unknown };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface QueryResult<T = any> {
  data: T[] | null;
  error: { message: string } | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SingleResult<T = any> {
  data: T | null;
  error: { message: string } | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class QueryBuilder<T = any> {
  private table: string;
  private filters: FilterOp[] = [];
  private _orderCol?: string;
  private _orderAsc = true;
  private _selectJoins: string[] = [];

  constructor(table: string, selectFields: string = '*') {
    this.table = table;
    const joinMatch = selectFields.matchAll(/(\w+)\(\*\)/g);
    for (const m of joinMatch) {
      this._selectJoins.push(m[1]);
    }
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, op: 'gte', value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, op: 'lte', value });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this._orderCol = column;
    this._orderAsc = opts?.ascending ?? true;
    return this;
  }

  single(): SingleResult<T> {
    const { data } = this.execute();
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  }

  private applyFilters(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return rows.filter(row => {
      return this.filters.every(f => {
        const val = row[f.column];
        switch (f.op) {
          case 'eq': return val === f.value;
          case 'neq': return val !== f.value;
          case 'gte': return String(val ?? '') >= String(f.value);
          case 'lte': return String(val ?? '') <= String(f.value);
        }
      });
    });
  }

  execute(): QueryResult<T> {
    let rows = getTable(this.table);
    rows = this.applyFilters(rows);

    if (this._selectJoins.length > 0) {
      rows = rows.map(row => {
        const joined = { ...row };
        for (const joinTable of this._selectJoins) {
          const childRows = getTable(joinTable);
          const singular = this.table.replace(/s$/, '');
          const fk = `${singular}_id`;
          joined[joinTable] = childRows.filter(
            c => c[fk] === row['id'] || c['lead_id'] === row['id']
          );
        }
        return joined;
      });
    }

    if (this._orderCol) {
      const col = this._orderCol;
      const asc = this._orderAsc;
      rows.sort((a, b) => {
        const av = String(a[col] ?? '');
        const bv = String(b[col] ?? '');
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    return { data: rows as T[], error: null };
  }

  then(resolve: (result: QueryResult<T>) => void) {
    resolve(this.execute());
  }
}

class MutationResult {
  data: null = null;
  error: { message: string } | null = null;

  then(resolve: (result: { data: null; error: { message: string } | null }) => void) {
    resolve({ data: this.data, error: this.error });
  }
}

class InsertBuilder extends MutationResult {
  private table: string;
  private records: Record<string, unknown>[];

  constructor(table: string, data: Record<string, unknown> | Record<string, unknown>[]) {
    super();
    this.table = table;
    this.records = Array.isArray(data) ? data : [data];
    this.run();
  }

  private run() {
    const existing = getTable(this.table);
    const now = new Date().toISOString();
    const newRecords = this.records.map(r => ({
      id: r.id || crypto.randomUUID(),
      created_at: r.created_at || now,
      ...r,
    }));
    setTable(this.table, [...existing, ...newRecords]);
  }
}

class UpdateBuilder {
  private table: string;
  private updates: Record<string, unknown>;
  private filters: FilterOp[] = [];

  constructor(table: string, data: Record<string, unknown>) {
    this.table = table;
    this.updates = data;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  private run(): { data: null; error: { message: string } | null } {
    const rows = getTable(this.table);
    const updated = rows.map(row => {
      const match = this.filters.every(f => row[f.column] === f.value);
      return match ? { ...row, ...this.updates } : row;
    });
    setTable(this.table, updated);
    return { data: null, error: null };
  }

  then(resolve: (result: { data: null; error: { message: string } | null }) => void) {
    resolve(this.run());
  }
}

class DeleteBuilder {
  private table: string;
  private filters: FilterOp[] = [];

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  private run(): { data: null; error: { message: string } | null } {
    const rows = getTable(this.table);
    const remaining = rows.filter(row => {
      return !this.filters.every(f => row[f.column] === f.value);
    });
    setTable(this.table, remaining);
    return { data: null, error: null };
  }

  then(resolve: (result: { data: null; error: { message: string } | null }) => void) {
    resolve(this.run());
  }
}

class TableRef {
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select<T = any>(fields: string = '*'): QueryBuilder<T> {
    return new QueryBuilder<T>(this.table, fields);
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): InsertBuilder {
    return new InsertBuilder(this.table, data);
  }

  update(data: Record<string, unknown>): UpdateBuilder {
    return new UpdateBuilder(this.table, data);
  }

  delete(): DeleteBuilder {
    return new DeleteBuilder(this.table);
  }

  upsert(data: Record<string, unknown> | Record<string, unknown>[]): InsertBuilder {
    const records = Array.isArray(data) ? data : [data];
    const existing = getTable(this.table);
    const ids = new Set(records.map(r => r.id).filter(Boolean));
    const remaining = existing.filter(r => !ids.has(r.id));
    setTable(this.table, remaining);
    return new InsertBuilder(this.table, records);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noopChain = { on(..._args: any[]) { return this; }, subscribe() { return this; } };

export const localDB = {
  from(table: string): TableRef {
    return new TableRef(table);
  },
  channel(_name: string) {
    return noopChain;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeChannel(_channel: any) {},
};

/**
 * Mock Supabase client that operates on in-memory JSON data.
 * Implements the chainable query builder pattern so existing
 * helpers and page code work without changes.
 */
import { mockTables } from './data';

// ---- tiny id helper ----
let _seq = 0;
function mockId(): string {
  _seq += 1;
  return `mock-${Date.now()}-${_seq}`;
}

// ---- Query Builder ----

type Filter = { column: string; op: 'eq' | 'in' | 'neq' | 'gte' | 'lte' | 'or'; value: any };

class MockQueryBuilder {
  private table: string;
  private data: Record<string, unknown>[];
  private filters: Filter[] = [];
  private _order: { column: string; ascending: boolean } | null = null;
  private _limit: number | null = null;
  private _rangeFrom: number | null = null;
  private _rangeTo: number | null = null;
  private _selectColumns: string | null = null;
  private _countMode: boolean = false;
  private _headMode: boolean = false;
  private _singleMode: boolean = false;
  private _maybeSingleMode: boolean = false;
  private _insertData: any = null;
  private _updateData: any = null;
  private _deleteMode: boolean = false;
  private _selectAfterMutate: boolean = false;

  constructor(table: string) {
    this.table = table;
    this.data = mockTables[table] ?? [];
  }

  // ---- Chainable methods ----

  select(columns?: string, opts?: { count?: string; head?: boolean }) {
    this._selectColumns = columns ?? '*';
    if (opts?.count === 'exact') this._countMode = true;
    if (opts?.head) this._headMode = true;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, op: 'in', value: values });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, op: 'gte', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, op: 'lte', value });
    return this;
  }

  or(filterString: string) {
    this.filters.push({ column: '', op: 'or', value: filterString });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this._order = { column, ascending: opts?.ascending ?? true };
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  range(from: number, to: number) {
    this._rangeFrom = from;
    this._rangeTo = to;
    return this;
  }

  single<T = any>(): Promise<{ data: T | null; error: any; count?: number }> {
    this._singleMode = true;
    return this._execute() as any;
  }

  maybeSingle<T = any>(): Promise<{ data: T | null; error: any; count?: number }> {
    this._maybeSingleMode = true;
    return this._execute() as any;
  }

  returns<T = any>(): Promise<{ data: T | null; error: any; count?: number }> {
    return this._execute() as any;
  }

  insert(data: any) {
    this._insertData = data;
    return this;
  }

  update(data: any) {
    this._updateData = data;
    return this;
  }

  delete() {
    this._deleteMode = true;
    return this;
  }

  // ---- Execution ----

  private _applyFilters(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    let result = rows;
    for (const f of this.filters) {
      if (f.op === 'eq') {
        result = result.filter((r) => r[f.column] === f.value);
      } else if (f.op === 'neq') {
        result = result.filter((r) => r[f.column] !== f.value);
      } else if (f.op === 'in') {
        result = result.filter((r) => (f.value as any[]).includes(r[f.column]));
      } else if (f.op === 'gte') {
        result = result.filter((r) => (r[f.column] as any) >= f.value);
      } else if (f.op === 'lte') {
        result = result.filter((r) => (r[f.column] as any) <= f.value);
      } else if (f.op === 'or') {
        // Parse simple or filter like "title.ilike.%keyword%,description.ilike.%keyword%"
        const parts = (f.value as string).split(',');
        result = result.filter((r) =>
          parts.some((part) => {
            const segments = part.trim().split('.');
            if (segments.length >= 3 && segments[1] === 'ilike') {
              const col = segments[0];
              const pattern = segments.slice(2).join('.').replace(/%/g, '');
              const val = String(r[col] ?? '').toLowerCase();
              return val.includes(pattern.toLowerCase());
            }
            return false;
          }),
        );
      }
    }
    return result;
  }

  private _pickColumns(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    if (!this._selectColumns || this._selectColumns === '*') return rows;
    const cols = this._selectColumns.split(',').map((c) => c.trim());
    return rows.map((r) => {
      const picked: Record<string, unknown> = {};
      for (const c of cols) {
        if (c in r) picked[c] = r[c];
      }
      return picked;
    });
  }

  private async _execute(): Promise<{ data: any; error: any; count?: number }> {
    // --- INSERT ---
    if (this._insertData !== null) {
      const newRow = { id: mockId(), created_at: new Date().toISOString(), ...this._insertData };
      this.data.push(newRow);
      if (this._singleMode || this._selectAfterMutate) {
        return { data: newRow, error: null };
      }
      return { data: [newRow], error: null };
    }

    // --- DELETE ---
    if (this._deleteMode) {
      const before = this.data.length;
      const toRemove = this._applyFilters(this.data);
      const removeIds = new Set(toRemove.map((r) => r.id));
      const remaining = this.data.filter((r) => !removeIds.has(r.id));
      // mutate in place
      this.data.length = 0;
      remaining.forEach((r) => this.data.push(r));
      return { data: null, error: null, count: before - remaining.length };
    }

    // --- UPDATE ---
    if (this._updateData !== null) {
      const targets = this._applyFilters(this.data);
      for (const row of targets) {
        Object.assign(row, this._updateData, { updated_at: new Date().toISOString() });
      }
      if (this._singleMode) {
        return { data: targets[0] ?? null, error: targets.length === 0 ? { message: 'Not found' } : null };
      }
      return { data: targets, error: null };
    }

    // --- SELECT ---
    let rows = this._applyFilters([...this.data]);

    // Count mode
    if (this._countMode) {
      const count = rows.length;
      if (this._headMode) {
        return { data: null, error: null, count };
      }
    }

    // Order
    if (this._order) {
      const col = this._order.column;
      const asc = this._order.ascending;
      rows.sort((a, b) => {
        const va = a[col] as any;
        const vb = b[col] as any;
        if (va < vb) return asc ? -1 : 1;
        if (va > vb) return asc ? 1 : -1;
        return 0;
      });
    }

    // Range
    if (this._rangeFrom !== null && this._rangeTo !== null) {
      rows = rows.slice(this._rangeFrom, this._rangeTo + 1);
    }

    // Limit
    if (this._limit !== null) {
      rows = rows.slice(0, this._limit);
    }

    // Pick columns
    rows = this._pickColumns(rows);

    // Single
    if (this._singleMode) {
      if (rows.length === 0) return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      return { data: rows[0], error: null, count: this._countMode ? this._applyFilters([...this.data]).length : undefined };
    }

    if (this._maybeSingleMode) {
      return { data: rows[0] ?? null, error: null };
    }

    return { data: rows, error: null, count: this._countMode ? this._applyFilters([...this.data]).length : undefined };
  }

  // Make the builder thenable so `await client.from(...).select(...)` works
  then(
    resolve: (value: { data: any; error: any; count?: number }) => any,
    reject?: (reason: any) => any,
  ) {
    return this._execute().then(resolve, reject);
  }
}

// ---- Mock Supabase Client ----

export interface MockSupabaseClient {
  from(table: string): MockQueryBuilder;
}

export function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from(table: string) {
      return new MockQueryBuilder(table);
    },
  };
}

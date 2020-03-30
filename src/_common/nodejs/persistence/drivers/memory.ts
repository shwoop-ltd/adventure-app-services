import Driver from './driver';
import Key from '../keys';
import * as fs from 'fs';

export default class MemoryDriver extends Driver {
  public constructor() {
    super();

    if (process.env.IN_MEMORY_SEED_PATH) {
      console.log(`Loading database from file ${process.env.IN_MEMORY_SEED_PATH}`);
      this.store = (JSON.parse(fs.readFileSync(process.env.IN_MEMORY_SEED_PATH, 'utf-8')) as { id: string }[]).reduce(
        (prev, cur) => ({ ...prev, [cur.id]: cur }),
        {} as { [key: string]: { id: string } }
      );
    }
  }

  public get_item<T>(key: Key, id?: string | undefined): Promise<T | undefined>;
  public get_item<T>(key: Key, id: string, always_exists: true): Promise<T>;
  public async get_item<T>(key: Key, id?: string, always_exists?: boolean): Promise<T | undefined> {
    const db_key = key + (id ? '-' + id : '');
    if (always_exists && !(db_key in this.store)) {
      throw ReferenceError(`DB Item ${db_key} doesn't exist`);
    }

    return this.store[db_key] as T | undefined;
  }
  public async put_item(key: Key, item: { id: string }): Promise<void> {
    const db_key = key + item.id ? '-' + item.id : '';
    this.store[db_key] = item;
  }

  private store: { [key: string]: unknown } = {};
}

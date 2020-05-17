import { Driver, Key, StoreRecord } from '../../core/persistence';
import * as fs from 'fs';

export default class MemoryDriver extends Driver {
  public constructor() {
    super();

    if (process.env.IN_MEMORY_SEED_PATH) {
      if (!fs.existsSync(this.temp_storage_path)) {
        let seed = (JSON.parse(fs.readFileSync(process.env.IN_MEMORY_SEED_PATH, 'utf-8')) as { id: string }[]).reduce(
          (prev, cur) => ({ ...prev, [cur.id]: cur }),
          {} as { [key: string]: { id: string } }
        );
        fs.writeFileSync(this.temp_storage_path, JSON.stringify(seed, null, 1), 'utf-8');
        console.log(
          `Created temporary database file ${this.temp_storage_path} from seed ${process.env.IN_MEMORY_SEED_PATH}`
        );
      }

      console.log(`Loading database from file ${this.temp_storage_path}`);
      this.store = JSON.parse(fs.readFileSync(this.temp_storage_path, 'utf-8'));
    }
  }

  public get_item<T>(key: Key, id: string, always_exists: true): Promise<T | undefined>;
  public async get_item<T>(key: Key, id: string, always_exists?: boolean): Promise<T | undefined> {
    const db_key = id?.startsWith(key) ? id : key + (id ? '-' + id : '');
    if (always_exists && !(db_key in this.store)) {
      throw ReferenceError(`DB Item ${db_key} doesn't exist`);
    }

    return (this.store[db_key] as unknown) as T | undefined;
  }
  public async put_item(key: Key, item: { id: string }): Promise<void> {
    const db_key = item.id.startsWith(key) ? item.id : key + (item.id ? '-' + item.id : '');
    this.store[db_key] = item;
    fs.writeFileSync(this.temp_storage_path, JSON.stringify(this.store, null, 1), 'utf-8');
  }

  public async scan_table<T extends StoreRecord>(
    key: Key,
    use_filter: boolean,
    attributes?: string[] | undefined
  ): Promise<T[]> {
    const isT = (r: StoreRecord & { __key: string }): r is T & { __key: string } => r.__key.startsWith(key);
    return Object.entries(this.store)
      .map(([id, r]) => ({ ...r, __key: id }))
      .filter(isT)
      .map((record) => (attributes ? this.filterKeys(record, attributes) : record));
  }

  private filterKeys = <T extends { [key: string]: unknown }>(record: T, attrs: string[]): T =>
    attrs // The assertion here is sort of cheating, but I can't figure out how to do this without it
      ? attrs.reduce((prev, cur) => ({ ...prev, [cur]: record[cur] }), {} as T)
      : record;

  private store: { [id: string]: StoreRecord } = {};
  private temp_storage_path = './resources/temporary/TempStorage.temp';
}

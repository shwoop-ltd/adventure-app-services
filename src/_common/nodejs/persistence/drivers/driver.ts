import Key from '../keys';

export type StoreRecord = { id: string };

export default abstract class Driver {
  public abstract async get_item<T>(key: Key, id?: string): Promise<T | undefined>;
  public abstract async get_item<T>(key: Key, id: string, always_exists: true): Promise<T>;
  /**
   * Get an item in the table
   * @param key The model to get
   * @param id The id of the model. If no id is present, assumes it's a singleton item
   * @param always_exists Whether or not to assume the object exists. Defaults to false
   */
  public abstract async get_item<T>(key: Key, id?: string, always_exists?: boolean): Promise<T | undefined>;

  public abstract async put_item(key: Key, item: { id: string }): Promise<void>;

  /**
   * Get an array of items in the table
   * @param key The model to get
   * @param use_filter Specify if the model id should contain the key, useful when a table is shared by more than one model
   * @param attributes The attributes of the model to return. If not present, returns all attributes
   */
  public abstract async scan_table<T extends StoreRecord>(
    key: Key,
    use_filter: boolean,
    attributes?: string[]
  ): Promise<T[]>;
}

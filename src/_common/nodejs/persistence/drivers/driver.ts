import Key from '../keys';

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
}

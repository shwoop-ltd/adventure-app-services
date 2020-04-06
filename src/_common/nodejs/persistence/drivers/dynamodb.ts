import { DynamoDB } from 'aws-sdk';
import Key from '../keys';
import Driver from './driver';

export default class DynamoDBDriver extends Driver {
  public constructor() {
    super();

    this.doc_client = new DynamoDB.DocumentClient({
      region: process.env.REGION,
      endpoint: process.env.ENDPOINT_OVERRIDE || undefined,
    });
  }

  public async get_item<T>(key: Key, id?: string): Promise<T | undefined>;
  public async get_item<T>(key: Key, id: string, always_exists: true): Promise<T>;
  /**
   * Get an item in the table
   * @param key The model to get
   * @param id The id of the model. If no id is present, assumes it's a singleton item
   * @param always_exists Whether or not to assume the object exists
   */
  public async get_item<T>(key: Key, id?: string, always_exists = false): Promise<T | undefined> {
    const table_name = this.get_table_for_model(key);

    const result = await this.doc_client.get({ TableName: table_name, Key: { id } }).promise();
    if (always_exists && !result.Item) {
      throw new Error(`Item with key ${key} should always exist, but was not found in ${table_name}`);
    }

    return result.Item as T | undefined;
  }

  /**
   * Place an item in the table. May or may not already exist.
   * Completely replaces the object if it does
   *
   * @param key Model to get
   * @param item The item to place in the db. Must have an id
   */
  public async put_item(key: Key, item: { id: string }): Promise<void> {
    const table_name = this.get_table_for_model(key);
    await this.doc_client.put({ TableName: table_name, Item: item }).promise();
  }

  /**
   * Gets the correct table for the given model
   *
   * @param key name of the model
   */
  private get_table_for_model(key: Key): string {
    if (key === 'prize') {
      return DynamoDBDriver.get_env_variable('PRIZES_TABLE_NAME');
    } else if (key === 'user') {
      return DynamoDBDriver.get_env_variable('USERS_TABLE_NAME');
    } else if (key === 'telemetry') {
      return DynamoDBDriver.get_env_variable('TELEMETRY_TABLE_NAME');
    } else {
      return DynamoDBDriver.get_env_variable('TABLE_NAME');
    }
  }

  /**
   * Helper that throws when env var doesnt exist
   * @param name
   */
  private static get_env_variable(name: string): string {
    const env_var = process.env[name];
    if (!env_var) {
      throw new ReferenceError(`Environment variable ${name} does not exist`);
    }
    return env_var;
  }

  private doc_client: DynamoDB.DocumentClient;
}

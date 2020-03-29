import { DynamoDB } from 'aws-sdk';

const doc_client = new DynamoDB.DocumentClient({
  region: process.env.REGION,
  endpoint: process.env.ENDPOINT_OVERRIDE || undefined,
});

export async function get_item<T>(table_name: string | undefined, key: string): Promise<T | undefined>;
export async function get_item<T>(table_name: string | undefined, key: string, always_exists: true): Promise<T>;
export async function get_item<T>(
  table_name: string | undefined,
  key: string,
  always_exists = false
): Promise<T | undefined> {
  if (!table_name) throw new Error('Environment variable TABLE_NAME does not exist');

  const result = await doc_client.get({ TableName: table_name, Key: { id: key } }).promise();
  if (always_exists && !result.Item)
    throw new Error(`Item with key ${key} should always exist, but was not found in ${table_name}`);

  return result.Item as T | undefined;
}

export function put_item(table_name: string | undefined, item: { id: string }) {
  if (!table_name) throw new Error('Environment variable TABLE_NAME does not exist');

  return doc_client.put({ TableName: table_name, Item: item }).promise();
}

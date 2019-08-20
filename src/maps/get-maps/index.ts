import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyResult } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(): Promise<APIGatewayProxyResult> {
  const result = await doc_client.get({ TableName: table_name, Key: { id: "maps" } }).promise();

  if(result.Item) {
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item.maps),
    };
  }
  else {
    return {
      statusCode: 500,
      body: "Maps not found!",
    };
  }
}

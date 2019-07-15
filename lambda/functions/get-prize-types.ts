import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const result = await doc_client.get({ TableName: table_name, Key: { id: "prize-types" } }).promise();

  if(result.Item)
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item.prizes),
    };
  else
    return {
      statusCode: 502,
      body: "No prize types!",
    };
}
import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };

  const result = await doc_client.get({ TableName: prizes_table_name, Key: { id: event.pathParameters.code } }).promise();
  if(result.Item)
    result.Item.user = undefined;
  if(result.Item)
    return { statusCode: 200, body: JSON.stringify(result.Item) };
  else
    return { statusCode: 404, body: `Code ${event.pathParameters.code} was not found` };
}

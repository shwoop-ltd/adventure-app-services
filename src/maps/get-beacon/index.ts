import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };

  const { map, beacon } = event.pathParameters;
  const key = `beacon-${map}-${beacon}`;

  const result = await doc_client.get({ TableName: table_name, Key: { id: key } }).promise();

  if(result.Item)
    return { statusCode: 200, body: JSON.stringify(result.Item) };
  else
    return { statusCode: 404, body: `Beacon ${beacon} doesn't exist for map ${map}` };
}

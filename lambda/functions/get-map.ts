import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const doc_client = new DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };

  const map_name = event.pathParameters.map;
  const key = 'map-' + map_name;

  const result = await doc_client.get({ TableName: 'AdventureApp', Key: { id: key } }).promise();

  if(result.Item)
    return { statusCode: 200, body: JSON.stringify(result.Item) };
  else
    return { statusCode: 404, body: `Map ${map_name} was not found`, };
}

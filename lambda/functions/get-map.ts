import { DynamoDB, FileSystemCredentials } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };

  //Get Map
  const map_name = event.pathParameters.map;
  const key = 'map-' + map_name;
  const map_info_result = await doc_client.get({ TableName: table_name, Key: { id: key } }).promise();
  const map_info = map_info_result.Item;

  //Map Check
  if (!map_info) {
    return { statusCode: 404, body: 'Map not found' }
  }

  //Filter Map Info to currently open and time to next.
  const date = new Date();
  const markers = map_info.markers.filter((element: { release: number; }) => element.release < date.getTime()/1000);
  const next_release = Math.min(...map_info.markers.map((element: { release: number; }) => element.release));
  const return_data = {
    markers: markers,
    next_release: next_release
  };

  return { statusCode: 200, body: JSON.stringify(return_data) };
}

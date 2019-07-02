import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  // TODO: Get info about user

  if(!event.pathParameters)
    return { statusCode: 400, body: "Recieved no path parameters?" };

  const map_name = event.pathParameters.map;
  const beacon_id = event.queryStringParameters && event.queryStringParameters.beacon;
  const marker_id = event.queryStringParameters && event.queryStringParameters.marker;

  let key = 'puzzle-' + map_name + '-';
  if(beacon_id)
    key += 'beacon-' + beacon_id;
  else if(marker_id)
    key += 'marker-' + marker_id;
  else
    return { statusCode: 400, body: "Cannot get challenge without beacon or marker" };

  const result = await doc_client.get({ TableName: table_name, Key: { id: key } }).promise();

  if(result.Item) {
    // Ensure we dont pass any solution information in the request (which is stored in the db)
    const output = {
      id: result.Item.id,
      text: result.Item.text,
      image_url: result.Item.image_url,
    };

    return { statusCode: 200, body: JSON.stringify(output) };
  }
  else
    return { statusCode: 404, body: `Puzzle for ${key} was not found` };
}

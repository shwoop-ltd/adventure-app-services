import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const doc_client = new DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

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

  const result = await doc_client.get({ TableName: 'AdventureApp', Key: { id: key } }).promise();

  if(result.Item)
    return { statusCode: 200, body: JSON.stringify(result.Item) };
  else
    return { statusCode: 404, body: `Puzzle for ${key} was not found` };
}

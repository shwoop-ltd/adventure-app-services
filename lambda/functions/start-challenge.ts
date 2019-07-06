import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  // TODO: Get info about user

  if (!event.pathParameters)
    return { statusCode: 400, body: "Recieved no path parameters?" };
  if (!event.queryStringParameters || (!event.queryStringParameters.beacon_id && !event.queryStringParameters.marker_id)) {
    return { statusCode: 400, body: "Need a marker or beacon ID." };
  }

  const map_name = event.pathParameters.map;
  const beacon_id = event.queryStringParameters && event.queryStringParameters.beacon;
  const marker_id = event.queryStringParameters && event.queryStringParameters.marker;

  let key = 'puzzle-' + map_name + '-';
  if (beacon_id)
    key += 'beacon-' + beacon_id;
  else if (marker_id)
    key += 'marker-' + marker_id;

  const puzzle_result = await doc_client.get({ TableName: table_name, Key: { id: key } }).promise();
  const puzzle = puzzle_result.Item;

  if (!puzzle) {
    return { statusCode: 404, body: "No puzzle with that ID." }
  };

  // Ensure we dont pass any solution information in the request (which is stored in the db)
  puzzle.solution = undefined;
  puzzle.solution_name = undefined;

  return { statusCode: 200, body: JSON.stringify(puzzle)};
}

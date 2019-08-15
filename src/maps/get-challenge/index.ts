import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { DBChallenge } from 'helper/types';

const table_name = process.env.TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  // TODO: Get info about user

  if (!event.pathParameters || !['challenge', 'marker'].includes(event.pathParameters.type)) {
    return { statusCode: 400, body: "Need a 'map', plus a type of 'marker' or 'beacon', and a correct ID for that type." };
  }

  const map_name = event.pathParameters.map;
  const type = event.pathParameters.type;
  const id = event.pathParameters.type_id;

  const from_key = type + '-' + id;
  const key = 'challenge-' + map_name + '-' + from_key;

  const challenge_result = await doc_client.get({ TableName: table_name, Key: { id: key } }).promise();
  const challenge = challenge_result.Item as DBChallenge | undefined;

  if (!challenge) {
    return { statusCode: 404, body: "No puzzle with that ID." };
  }

  // Only return the puzzles which are still winnable
  let sum = 0;
  const first_winnable = challenge.prizes.findIndex((prize) => {
    sum += prize.available;
    return sum > challenge.claimed;
  });

  // Ensure we only pass certain information
  return {
    statusCode: 200,
    body: JSON.stringify({
      id: challenge.id,
      prerequisites: challenge.prerequisites,
      claimed: challenge.claimed,
      is_prerequisite: challenge.is_prerequisite,
      prizes: challenge.prizes.slice(first_winnable),
    }),
  };
}

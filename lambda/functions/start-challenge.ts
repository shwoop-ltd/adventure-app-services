import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { DBChallenge, DBUser, DBMapInfo } from 'helper/types';

const table_name = process.env.TABLE_NAME!;
const users_table_name = process.env.USERS_TABLE_NAME!;

const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters)
    return { statusCode: 400, body: "Need the user and the challenge id" };

  const user_id = event.pathParameters.userid;
  const challenge_id = event.pathParameters.challengeid;

  const challenge_result = await doc_client.get({ TableName: table_name, Key: { id: challenge_id } }).promise();
  const challenge = challenge_result.Item as DBChallenge | undefined;

  if (!challenge)
    return { statusCode: 404, body: "No challenge with that ID." };

  // Check that this challenge is available during this time
  if(challenge_id.includes('marker-')) {
    const splits = challenge_id.split('-');
    const map = splits[1];
    const marker_id = splits[3];

    const map_result = await doc_client.get({ TableName: table_name, Key: { id: `map-${map}` } }).promise();
    if(!map_result.Item)
      return { statusCode: 404, body: `Map ${map} not found` };

    const map_info = map_result.Item as DBMapInfo;
    const marker = map_info.markers.find(item => item.id === Number.parseInt(marker_id, 10))!;

    // Logic time:
    // We test whether the time is greater than the active start date,
    // which is either active_date (if it exists), or else release_date (if that exists)
    // We then check that we are not past the end date (if that exists).
    const time = Date.now() / 1000;
    if((marker.active_date || marker.release_date || 0) > time || (marker.end_date || time) < time)
      return { statusCode: 400, body: "This challenge is not available right now" };
  }

  if(challenge.prerequisites) {
    // Check whether user has prerequisites
    const user_result = await doc_client.get({ TableName: users_table_name, Key: { id: user_id } }).promise();
    const user = user_result.Item as DBUser | undefined;

    if(!user)
      return { statusCode: 404, body: "User not found" };

    if(user.prerequisite_challenges_completed < challenge.prerequisites)
      return { statusCode: 402, body: "Prerequisite challenges not completed" };
  }

  return { statusCode: 200, body: JSON.stringify({
    text: challenge.text,
    image_url: challenge.image_url,
  })};
}

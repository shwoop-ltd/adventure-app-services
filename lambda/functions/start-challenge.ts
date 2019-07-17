import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { DBChallenge, DBUser } from 'helper/types';

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

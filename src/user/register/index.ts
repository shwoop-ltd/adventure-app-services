import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { DBUser } from 'helper/types';

const users_table_name = process.env.USERS_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.userid)
    return { statusCode: 400, body: "No userid" };


  const user_id = event.pathParameters.userid;

  const telemetry_table_name = process.env.TELEMETRY_TABLE_NAME!;
  const telemetry_date = new Date();
  const telemetry_data = {
    id: `${user_id}-registeruser-${telemetry_date.toISOString()}`,
    pathParameters: event.pathParameters,
    body: event.body,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers,
  };
  doc_client.put({ TableName: telemetry_table_name, Item: telemetry_data });
  // Does this user exist already?
  const user_result = await doc_client.get({ TableName: users_table_name, Key: { id: user_id } }).promise();
  let user = user_result.Item;
  if(user)
    return { statusCode: 409, body: "Conflict. Account already exists." };

  user = {
    id: user_id,
    points: 0,
    surveys: [],
    prizes: [],
    treasure: [],
    challenges: [],
    prerequisite_challenges_completed: 0,
  } as DBUser;

  await doc_client.put({ TableName: users_table_name, Item: user }, () => {});
  return { statusCode: 201, body: "Account created." };
}

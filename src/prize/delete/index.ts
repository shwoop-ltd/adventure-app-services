import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { DBPrize, DBPrizeType } from 'helper/types';

const admin_key = process.env.ADMIN_KEY!;
const shwoop_table_name = process.env.TABLE_NAME!;
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

// Pre-load the prize-types, for efficiency.
// Note: this assumes there will be no requests before this promise has completed.
let prize_types: DBPrizeType[];
doc_client.get({ TableName: shwoop_table_name, Key: { id: "prize-types" } }).promise()
  .then(request => prize_types = request.Item ? request.Item.prizes : undefined);

async function add_telemetry(user_id: string, function_name: string, event: APIGatewayProxyEvent) {
  const telemetry_table_name = process.env.TELEMETRY_TABLE_NAME!;
  const telemetry_date = new Date();

  const telemetry_data = {
    id: user_id + "-" + function_name + "-" + telemetry_date.toISOString(),
    pathParameters: event.pathParameters,
    body: event.body,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers,
  };

  await doc_client.put({ TableName: telemetry_table_name, Item: telemetry_data }).promise();
}

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters)
    return { statusCode: 500, body: "No path parameters. This should never happen!", headers: { "Content-Type": "text/plain" } };
  if(!event.headers.Authorization)
    return { statusCode: 401, body: "Need authentication to delete a prize", headers: { "Content-Type": "text/plain" } };

  const auth = event.headers.Authorization;
  const prize_code = event.pathParameters.code;

  // Whether this is an admin's request
  const is_admin = auth === admin_key;

  await add_telemetry(auth, "delete-prize", event);

  // Get the prize
  const prize_response = await doc_client.get({ TableName: prizes_table_name, Key: { id: prize_code } }).promise();
  if(!prize_response.Item)
    return { statusCode: 404, body: "Prize code not found", headers: { "Content-Type": "text/plain" } };
  const prize = prize_response.Item as DBPrize;

  // A user may not access another user's prizes
  if(!is_admin && prize.user_id !== auth)
    return { statusCode: 403, body: "Incorrect user id", headers: { "Content-Type": "text/plain" } };

  // An user may not delete a prize that is not self-redeemable
  if(!prize_types)
    return { statusCode: 500, body: "Prize types irretrievable", headers: { "Content-Type": "text/plain" } };

  const prize_type = prize_types.find(type => type.name === prize.type);
  if(!prize_type)
    return { statusCode: 500, body: `Prize type ${prize.type} does not exist`, headers: { "Content-Type": "text/plain" } };

  if(!is_admin && !prize_type.self_redeemable)
    return { statusCode: 400, body: "The user may not redeem this prize themselves", headers: { "Content-Type": "text/plain" } };

  // Update the prize as claimed
  prize.redeemed = true;
  await doc_client.put({ TableName: prizes_table_name, Item: prize }).promise();

  return { statusCode: 204, body: "Successful Operation", headers: { "Content-Type": "text/plain" } };
}

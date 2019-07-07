import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const users_table_name = process.env.USERS_TABLE_NAME!;
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };

  //Does this user exist?
  const user_id = event.headers.Authorization.substring(7);
  const user_result = await doc_client.get({ TableName: users_table_name, Key: { "id": user_id } }).promise();
  const user = user_result.Item;
  if (!user) {
    return { statusCode: 401, body: "User does not exist." }
  }

  if (!user.prizes.includes(event.pathParameters.code)) {
    return {statusCode: 403, body: "You do not own this prize."}
  }

  doc_client.delete({ TableName: prizes_table_name, Key: { id: event.pathParameters.code } }, function (err, data) {
    if (err) return { statusCode: 502, body: "Failed to delete. Internal server error." };
  });
  return { statusCode: 204, body: "Success" }
}

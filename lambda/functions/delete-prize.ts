import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const admin_key = process.env.ADMIN_KEY!;
const users_table_name = process.env.USERS_TABLE_NAME!;
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };

  const code = event.pathParameters.code;

  //Does this user exist?
  var user;
  const user_id = event.headers.Authorization.substring(7);
  if (user_id != admin_key) {
    const user_result = await doc_client.get({ TableName: users_table_name, Key: { "id": user_id } }).promise();
    user = user_result.Item;
    if (!user) {
      return { statusCode: 401, body: "User does not exist." };
    }
  } else {
    const prize_result = await doc_client.get({ TableName: prizes_table_name, Key: { "id": code } }).promise();
    const prize = prize_result.Item;
    if (!prize) {
      return { statusCode: 401, body: "Prize does not exist" };
    }
    const user_result = await doc_client.get({ TableName: users_table_name, Key: { "id": prize.user } }).promise();
    user = user_result.Item;
    if (!user) {
      return { statusCode: 401, body: "User does not exist." };
    }
  }

  if (!user.prizes.includes(code)) {
    return { statusCode: 403, body: "This prize does not belong to this user." }
  }
  user.prizes = user.prizes.filter((element: { prize: string; }) => element.prize != code)
  
  var prizes_params = {
      TableName: users_table_name,
      Key: { "id": user_id },
      UpdateExpression: 'SET prizes = :x',
      ExpressionAttributeValues: {
          ':x': user.prizes
      }
  };

  doc_client.update(prizes_params, function(err, data) {if (err) return{statusCode: 418, body: err}});

  doc_client.delete({ TableName: prizes_table_name, Key: { id: code } }, function (err, data) {
    if (err) return { statusCode: 502, body: "Failed to delete. Internal server error." };
  });

  return { statusCode: 204, body: "Success" }
}

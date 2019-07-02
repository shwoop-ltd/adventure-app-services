import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE });

function generateRandomString(length: number) {
  let returnString = ""
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < length; i++) {
    returnString += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return returnString;
}

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  // TODO: Get info about user, store user info

  if (!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };
  if (!event.queryStringParameters || !event.queryStringParameters.challenge)
    return { statusCode: 400, body: "Challenge ID was not present" };
  if (!event.body) {
    return { statusCode: 400, body: "Solution beacon not present" }
  }

  const solution = JSON.parse(event.body).beacon_id;
  const key = event.queryStringParameters.challenge;

  const result = await doc_client.get({ TableName: prizes_table_name, Key: { id: key } }).promise();

  if (!result.Item) {
    return { statusCode: 404, body: `There is no challenge with an id of ${key}` };
  }

  if (result.Item.solution === solution) {// Correct, they get a prize. TODO: Actually get prizes from the puzzle
    var d = new Date();
    let prize = {
      id: generateRandomString(8),
      type: "Red Bull",
      received: d.toISOString(),
      received_from: "Challenge",
      claimed: false
    };
    doc_client.put({ TableName: prizes_table_name, Item: prize }, function (err, data) { });
    //The callback is neccesary for this function to work.

    return { statusCode: 200, body: JSON.stringify(prize) };
  }
  else // Not correct, so no prize
    return { statusCode: 204, body: `Beacon ${solution} is not the correct answer for this challenge!` };
}

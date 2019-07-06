import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const users_table_name = process.env.USERS_TABLE_NAME!;
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

function generateRandomString(length: number) {
  let returnString = ""
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < length; i++) {
    returnString += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return returnString;
}

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  //Request contents check
  if (!event.body) {
    return { statusCode: 400, body: "Body not present" }
  }
  const body = JSON.parse(event.body);
  if (!body.challenge_id || !body.beacon_id || !body.map) {
    return { statusCode: 400, body: "Incorrect body." }
  }

  //Core variable assignment
  const solution = body.beacon_id;
  const challenge_id = body.challenge_id;
  const map = body.map;

  //User Check
  const user_id = event.headers.Authorization.substring(7);
  const user_result = await doc_client.get({ TableName: users_table_name, Key: { "id": user_id } }).promise();
  const user = user_result.Item;
  if (!user) {
    return { statusCode: 401, body: "User does not exist." }
  }

  //Prize Check
  const puzzle_key = "puzzle-" + map + "-beacon-" + challenge_id;
  const puzzle_result = await doc_client.get({ TableName: table_name, Key: { "id": puzzle_key } }).promise();
  if (!puzzle_result.Item) {
    return { statusCode: 502, body: "Something went wrong!" }
  }
  const puzzle = puzzle_result.Item;

  //Solution Check
  if (!puzzle.solution === solution) {
    return { statusCode: 400, body: "Wrong solution." }
  };

  //Everything is good, lets get this man (or woman) a prize.

  //Establish prize object
  const d = new Date();
  const prize = {
    id: generateRandomString(8),
    type: "red-bull",
    received: d.toISOString(),
    received_from: "Challenge",
    claimed: false,
    points: undefined
  };

  //Identify the prize that should be awarded.
  let total = 0;
  for (let i = 0; i < puzzle.prizes.length; i++) {
    total += puzzle.prizes[i].available;
    if (puzzle.claimed < total) {
      prize.type = puzzle.prizes[i].prize;
      break;
    }
  };

  //Set up updating user's prizes
  user.prizes.push(prize.id);
  var prizes_params = {
    TableName: users_table_name,
    Key: { "id": user_id },
    UpdateExpression: 'SET prizes = :x',
    ExpressionAttributeValues: {
      ':x': user.prizes
    }
  };

  //Update awarded prizes
  doc_client.update(prizes_params, function (err, data) { if (err) return { statusCode: 418, body: err } });

  //Store prize in prize table
  doc_client.put({ TableName: prizes_table_name, Item: prize }, function (err, data) { });

  //Return the prize
  return { statusCode: 200, body: JSON.stringify(prize) };
}

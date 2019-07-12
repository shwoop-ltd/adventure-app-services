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

  if (!event.pathParameters || !event.pathParameters.userid) {
    return { statusCode: 400, body: "No userid" }
  }

  const user_id = event.pathParameters.userid;

  //Done first to ensure our telemetry is about a given user.
  const user_result = await doc_client.get({ TableName: users_table_name, Key: { "id": user_id } }).promise();
  const user = user_result.Item;
  if (!user) {
    return { statusCode: 404, body: "User does not exist." }
  }

  const telemetry_table_name = process.env.TELEMETRY_TABLE_NAME!;
  const telemetry_date = new Date()
  const telemetry_data = {
    id: user_id + "-finishchallenge-" + telemetry_date.toISOString(),
    pathParameters: event.pathParameters,
    body: event.body,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers
  }
  doc_client.put({ TableName: telemetry_table_name, Item: telemetry_data });

  //Core variable assignment
  const solution = body.beacon_id;
  const challenge_id = body.challenge_id;
  const map = body.map;

  //Puzzle Check
  console.log(body);
  const puzzle_result = await doc_client.get({ TableName: table_name, Key: { "id": challenge_id } }).promise();
  if (!puzzle_result.Item) {
    return { statusCode: 404, body: "Puzzle not found" }
  }
  const puzzle = puzzle_result.Item;

  //Solution Check
  if (puzzle.solution !== solution) {
    return { statusCode: 204, body: "Wrong solution." }
  };

  //Get Marker
  const marker_key = "beacon-" + map + "-" + challenge_id.substring(challenge_id.length - 9);
  const marker_result = await doc_client.get({ TableName: table_name, Key: { "id": marker_key } }).promise();
  if (!marker_result.Item) {
    return { statusCode: 404, body: "No marker found for that challenge ID" }
  }
  const marker_id = marker_result.Item.marker;

  //Time Check
  const map_info_key = 'map-' + map;
  const map_info_result = await doc_client.get({ TableName: table_name, Key: { "id": map_info_key } }).promise();
  const map_info = map_info_result.Item;

  if (!map_info) {
    return { statusCode: 404, body: 'Map not found' }
  }

  const d = new Date();
  const marker = map_info.markers.find((element: { id: string; }) => element.id === marker_id);
  if (marker.release + marker.duration < d.getTime() / 1000) {
    return { statusCode: 403, body: "Challenge closed." }
  }

  if (user.challenges.includes(challenge_id)) {
    return { statusCode: 403, body: "Challenge already completed." }
  }

  //Everything is good, lets get this man (or woman) a prize.

  //Establish prize object
  const prize = {
    id: generateRandomString(8),
    type: "red-bull",
    received: d.toISOString(),
    received_from: "challenge",
    claimed: false,
    user_id: user_id
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

  //Set up updating user's challenges
  user.challenges.push(challenge_id);
  var challenges_params = {
    TableName: users_table_name,
    Key: { "id": user_id },
    UpdateExpression: 'SET challenges = :x',
    ExpressionAttributeValues: {
      ':x': user.challenges
    }
  };

  doc_client.update(challenges_params, err => { });

  //Update awarded prizes
  doc_client.update(prizes_params, err => { });

  //Store prize in prize table
  doc_client.put({ TableName: prizes_table_name, Item: prize }, function (err, data) { });

  //Return the prize
  return { statusCode: 200, body: JSON.stringify(prize) };
}

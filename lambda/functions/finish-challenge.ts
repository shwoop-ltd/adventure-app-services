import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DBUser, DBChallenge, DBPrize } from 'helper/types';

const table_name = process.env.TABLE_NAME!;
const users_table_name = process.env.USERS_TABLE_NAME!;
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

function generateRandomString(length: number) {
  let returnString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i += 1) {
    returnString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return returnString;
}

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
  if (!event.body) {
    return { statusCode: 400, body: "Body not present" };
  }
  const body = JSON.parse(event.body);
  if (!body.challenge_id || !body.beacon_id || !body.map) {
    return { statusCode: 400, body: "Incorrect body." };
  }

  if (!event.pathParameters || !event.pathParameters.userid) {
    return { statusCode: 400, body: "No userid" };
  }

  const user_id = event.pathParameters.userid;

  // Done first to ensure our telemetry is about a given user.
  const user_result = await doc_client.get({ TableName: users_table_name, Key: { id: user_id } }).promise();
  const user = user_result.Item as DBUser | undefined;
  if (!user)
    return { statusCode: 404, body: "User does not exist." };

  await add_telemetry(user_id, "finishchallenge", event);

  // Core variable assignment
  const solution = body.beacon_id as string;
  const challenge_id = body.challenge_id as string;
  const map = body.map as string;

  // Puzzle Check
  const challenge_result = await doc_client.get({ TableName: table_name, Key: { id: challenge_id } }).promise();
  if (!challenge_result.Item)
    return { statusCode: 404, body: "Puzzle not found" };
  const challenge = challenge_result.Item as DBChallenge;

  // Check the user hasn't already completed it
  if (user.challenges.includes(challenge_id))
    return { statusCode: 403, body: "Challenge already completed." };

  // Solution Check
  if (challenge.solution !== solution)
    return { statusCode: 204, body: "Wrong solution." };

  // NOTE: This does't work if the challenge is a marker-type challenge. TODO: Redo later.
  // //Get Marker
  // const marker_key = "beacon-" + map + "-" + challenge_id.substring(challenge_id.length - 9);
  // const marker_result = await doc_client.get({ TableName: table_name, Key: { "id": marker_key } }).promise();
  // if (!marker_result.Item) {
  //   return { statusCode: 404, body: "No marker found for that challenge ID" }
  // }
  // const marker_id = marker_result.Item.marker;

  // //Time Check
  // const map_info_key = 'map-' + map;
  // const map_info_result = await doc_client.get({ TableName: table_name, Key: { "id": map_info_key } }).promise();
  // const map_info = map_info_result.Item;

  // if (!map_info) {
  //   return { statusCode: 404, body: 'Map not found' }
  // }

  // const d = new Date();
  // const marker = map_info.markers.find((element: { id: string; }) => element.id === marker_id);
  // if (marker.release + marker.duration < d.getTime() / 1000) {
  //   return { statusCode: 403, body: "Challenge closed." }
  // }

  // Everything is good, lets get this man (or woman) a prize.

  // Establish prize object
  const prize = {
    id: generateRandomString(8),
    type: "none",
    received: (new Date()).toISOString(),
    received_from: "challenge",
    claimed: false,
    user_id,
  } as DBPrize;

  // Identify the prize that should be awarded.
  if (challenge.prizes) {
    let total = 0;
    for (const potential_prize of challenge.prizes) {
      total += potential_prize.available;

      if (challenge.claimed < total) {
        prize.type = potential_prize.prize;
        break;
      }
    }
  }

  // Store prize in prize table
  await doc_client.put({ TableName: prizes_table_name, Item: prize }).promise();

  // Update user with prize info, challenge info, and prerequisites
  user.prizes.push(prize.id);
  user.challenges.push(challenge_id);
  if (challenge.is_prerequisite)
    user.prerequisite_challenges_completed += 1;

  await doc_client.put({ TableName: users_table_name, Item: user }).promise();

  // Return the prize
  return { statusCode: 200, body: JSON.stringify(prize) };
}

import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

interface User {
  prizes: string[];
  treasure: string[];
}

const table_name = process.env.TABLE_NAME!;
const users_table_name = process.env.USERS_TABLE_NAME!;
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
// const accuracy = 0.00005 //TODO: Move this to environment variables
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

function generateRandomString(length: number) { // TODO: Put this in its own class.
  let returnString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < length; i += 1)
    returnString += characters.charAt(Math.floor(Math.random() * characters.length));

  return returnString;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // TODO: Appropriate null checks for malformed data in the DB (E.g. treasures without prizes)
  if(!event.queryStringParameters || !event.queryStringParameters.beacon)
    return { statusCode: 400, body: "Query Parameter missing. Expected beacon." };
  if(!event.pathParameters || !event.pathParameters.userid)
    return { statusCode: 400, body: "Missing path parameters." };


  const user_id = event.pathParameters.userid;

  const telemetry_table_name = process.env.TELEMETRY_TABLE_NAME!;
  const telemetry_date = new Date();
  const telemetry_data = {
    id: `${user_id}-gettreasure-${telemetry_date.toISOString()}`,
    pathParameters: event.pathParameters,
    body: event.body,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers,
  };
  doc_client.put({ TableName: telemetry_table_name, Item: telemetry_data });

  // Does this user exist?
  const user_result = await doc_client.get({ TableName: users_table_name, Key: { id: user_id } }).promise();
  const user = user_result.Item as User | undefined;
  if(!user)
    return { statusCode: 401, body: "User does not exist." };


  // Is it a new treasure?
  const treasure_id = event.queryStringParameters.beacon;
  if(user.treasure.includes(treasure_id))
    return { statusCode: 403, body: "Treasure already claimed" };


  // Is there a treasure with this beacon?
  const key = `treasure-beacon-${event.queryStringParameters.beacon}`;
  const treasure_result = await doc_client.get({ TableName: table_name, Key: { id: key } }, () => { }).promise();
  if(!treasure_result.Item)
    return { statusCode: 404, body: `There is no treasure with beacon id ${treasure_id}` };


  // Prize stuff - TODO: Move to its own class
  const d = new Date();
  const prize = {
    id: generateRandomString(8),
    type: "red-bull",
    received: d.toISOString(),
    received_from: "treasure",
    claimed: false,
    points: undefined,
    user_id,
  };

  const { prizes } = treasure_result.Item;
  const { claimed } = treasure_result.Item;
  let total = 0;
  for(let i = 0; i < prizes.length; i += 1) {
    const element = prizes[i];
    total += element.available;
    if(claimed < total) {
      prize.type = element.prize;
      prize.points = element.points;
      break;
    }
  }

  // Params - Increment "claimed" counter
  const counter_params = {
    TableName: table_name,
    Key: { id: key },
    UpdateExpression: "set claimed = claimed + :val",
    ExpressionAttributeValues: {
      ":val": 1,
    },
  };

  // Moved to the end so that if there are any fatal errors in the middle, nothing will be half changed

  // Store Prize
  doc_client.put({ TableName: prizes_table_name, Item: prize }, () => { });

  // Params - Add treasure and prize to user
  user.treasure.push(treasure_id);
  user.prizes.push(prize.id);
  await doc_client.put({ TableName: users_table_name, Item: user }, () => {}).promise();

  // Update number of treasures claimed
  doc_client.update(counter_params);
  return { statusCode: 201, body: JSON.stringify(prize) };
}

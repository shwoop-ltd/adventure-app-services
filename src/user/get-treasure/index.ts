import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import {
  response, Users, AdventureApp, create_prize, generate_telemetry,
} from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // TODO: Appropriate null checks for malformed data in the DB (E.g. treasures without prizes)
  if(!event.queryStringParameters || !event.queryStringParameters.beacon)
    return response(400, "Query Parameter missing. Expected beacon.");
  if(!event.pathParameters || !event.pathParameters.userid)
    return response(400, "Missing path parameters.");

  const user_id = event.pathParameters.userid;
  const { beacon } = event.queryStringParameters;

  generate_telemetry(event, "get-treasure", user_id);

  // Does this user exist?
  const user = await Users.get(user_id);
  if(!user)
    return response(401, "User does not exist.");

  // Is it a new treasure?
  // TODO: Should be related to map
  if(user.treasure.includes(beacon))
    return response(403, "Treasure already claimed");

  // Is there a treasure with this beacon?
  const treasure = await AdventureApp.get_treasure(beacon);
  if(!treasure)
    return response(404, `There is no treasure with beacon id ${beacon}`);

  let prize_type;
  let points;

  // Determine prize type
  const { prizes, claimed } = treasure;
  let total = 0;
  for(let i = 0; i < prizes.length; i += 1) {
    const element = prizes[i];
    total += element.available;
    if(claimed < total) {
      prize_type = element.prize;
      points = element.points;
      break;
    }
  }

  if(!prize_type)
    return response(204, `There is no more treasure to claim`);

  // Moved to the end so that if there are any fatal errors in the middle, nothing will be half changed

  // Create prize for user, or give user points
  let prize;
  if(prize_type !== 'points') {
    prize = await create_prize(user_id, prize_type, "treasure");
    user.prizes.push(prize.id);
  }
  else
    user.points += points || 1;

  // Params - Add treasure and prize to user
  user.treasure.push(beacon);
  await Users.put(user);

  // Store treasure update
  treasure.claimed += 1;
  await AdventureApp.put_treasure(treasure);

  return response(201, prize || { type: prize_type, points });
}

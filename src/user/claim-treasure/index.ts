import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import {
  response, Users, AdventureApp, create_prize, generate_telemetry,
} from '/opt/nodejs';
import { get_next_prize } from '/opt/nodejs/helpers';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.userid)
    return response(400, "Missing path parameters.");

  const { userid, map, beacon } = event.pathParameters;

  generate_telemetry(event, "get-treasure", userid);

  // Does this user exist?
  const user = await Users.get(userid);
  if(!user)
    return response(401, "User does not exist.");

  // Is there a treasure with this beacon?
  const treasure = await AdventureApp.get_treasure(map, beacon);
  if(!treasure)
    return response(404, `There is no treasure with beacon id ${beacon}`);

  // Is it a new treasure?
  if(user.treasure.includes(treasure.id))
    return response(403, "Treasure already claimed");

  const prize_info = get_next_prize(treasure);

  if(!prize_info)
    return response(204, `There is no more treasure to claim`);

  // Moved to the end so that if there are any fatal errors in the middle, nothing will be half changed

  // Create prize for user, or give user points
  let prize;
  if(prize_info.points)
    user.points += prize_info.points;
  else {
    prize = await create_prize(userid, prize_info.prize, "treasure");
    user.prizes.push(prize.id);
  }

  // Params - Add treasure and prize to user
  user.treasure.push(treasure.id);
  await Users.put(user);

  // Store treasure update
  treasure.claimed += 1;
  await AdventureApp.put_treasure(treasure);

  return response(201, prize_info);
}

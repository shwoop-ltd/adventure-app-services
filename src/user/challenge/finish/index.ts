import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  response, Users, generate_telemetry, AdventureApp, create_prize, create_points_prize_response, create_prize_response,
} from '/opt/nodejs';
import { get_next_prize } from '/opt/nodejs/helpers';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.body)
    return response(400, "Body not present");

  const body = JSON.parse(event.body);
  if(!body.challenge_id || !body.beacon_id || !body.map)
    return response(400, "Incorrect body.");

  if(!event.pathParameters || !event.pathParameters.user_id)
    return response(400, "No user_id");

  // Done first to ensure our telemetry is about a given user.
  const { user_id } = event.pathParameters;

  if(!event.requestContext.authorizer || user_id !== event.requestContext.authorizer.claims.sub)
    return response(401, "Cannot access this user");

  const user = await Users.get(user_id);
  if(!user)
    return response(404, "User does not exist.");

  await generate_telemetry(event, "finish-challenge", user.id);

  // Core variable assignment
  const { beacon_id, map, challenge_id } = body;

  const challenge = await AdventureApp.get_challenge(map, challenge_id);
  if(!challenge)
    return response(404, "Puzzle not found");

  // Check the user hasn't already completed it
  if(user.challenges.includes(challenge_id))
    return response(403, "Challenge already completed.");

  // Solution Check
  if(challenge.solution !== beacon_id)
    return response(204, "Wrong solution.");

  // Identify the prize that should be awarded.
  const prize_info = get_next_prize(challenge);

  // Create prize for user, or give user points
  let response_object;
  if(prize_info && prize_info.points) {
    user.points += prize_info.points;
    response_object = create_points_prize_response(prize_info.points, 'challenge');
  }
  else if(prize_info) {
    const prize = await create_prize(user_id, prize_info.prize, "challenge");
    user.prizes.push(prize.id);
    response_object = create_prize_response(prize);
  }

  challenge.claimed += 1;

  user.challenges.push(challenge_id);

  // Puzzle Check
  const map_info = await AdventureApp.get_map(map);
  if(!map_info)
    return response(500, "Map not found");
  const challenge_info = map_info.challenges.find((map_challenge) => map_challenge.id === challenge_id);
  if(!challenge_info)
    return response(400, "Challenge not found");

  if(challenge_info.is_prerequisite)
    user.prerequisite_challenges_completed += 1;

  await Users.put(user);

  await AdventureApp.put_challenge(challenge);

  // Return the prize
  if(response_object)
    return response(200, response_object);
  else
    return response(200, false);
}

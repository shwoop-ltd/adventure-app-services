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
  const user = await Users.get(user_id);
  if(!user)
    return response(404, "User does not exist.");

  await generate_telemetry(event, "finish-challenge", user.id);

  // Core variable assignment
  const { beacon_id, map, challenge_id } = body;

  // Puzzle Check
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

  // If there were no prizes, or we have run out of prizes, user gets nothing.
  if(!prize_info)
    return response(200, false);

  // Create prize for user, or give user points
  let response_object;
  if(prize_info.points) {
    user.points += prize_info.points;
    response_object = create_points_prize_response(prize_info.points, 'treasure');
  }
  else {
    const prize = await create_prize(user_id, prize_info.prize, "treasure");
    user.prizes.push(prize.id);
    response_object = create_prize_response(prize);
  }

  user.challenges.push(challenge_id);

  if(challenge.is_prerequisite)
    user.prerequisite_challenges_completed += 1;

  Users.put(user);

  // Return the prize
  return response(200, response_object);
}

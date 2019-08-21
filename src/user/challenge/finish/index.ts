import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  response, Users, generate_telemetry, AdventureApp, create_prize,
} from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.body)
    return response(400, "Body not present");

  const body = JSON.parse(event.body);
  if(!body.challenge_id || !body.beacon_id || !body.map)
    return response(400, "Incorrect body.");

  if(!event.pathParameters || !event.pathParameters.userid)
    return response(400, "No userid");

  // Done first to ensure our telemetry is about a given user.
  const user = await Users.get(event.pathParameters.userid);
  if(!user)
    return response(404, "User does not exist.");

  await generate_telemetry(event, "finish-challenge", user.id);

  // Core variable assignment
  const { beacon_id, challenge_id } = body;

  // Puzzle Check
  const challenge = await AdventureApp.get_challenge_by_id(challenge_id);
  if(!challenge)
    return response(404, "Puzzle not found");

  // Check the user hasn't already completed it
  if(user.challenges.includes(challenge_id))
    return response(403, "Challenge already completed.");

  // Solution Check
  if(challenge.solution !== beacon_id)
    return response(204, "Wrong solution.");

  let prize_type;

  // Identify the prize that should be awarded.
  let total = 0;
  for(let i = 0; i < challenge.prizes.length; i += 1) {
    const potential_prize = challenge.prizes[i];

    total += potential_prize.available;

    if(challenge.claimed < total) {
      prize_type = potential_prize.prize;
      break;
    }
  }

  // If there were no prizes, or we have run out of prizes, user gets nothing.
  if(!prize_type)
    return response(200, false);

  // Store prize in prize table
  const prize = await create_prize(user.id, prize_type, "challenge");

  // Update user with prize info, challenge info, and prerequisites
  user.prizes.push(prize.id);
  user.challenges.push(challenge_id);

  if(challenge.is_prerequisite)
    user.prerequisite_challenges_completed += 1;

  Users.put(user);

  // Return the prize
  return response(200, prize);
}

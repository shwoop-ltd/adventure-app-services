import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { AdventureApp, response } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // TODO: Get info about user

  if(!event.pathParameters)
    return response(400, "Need a 'map', plus a type of 'marker' or 'beacon', and a correct ID for that type.");

  const { map, type, type_id } = event.pathParameters;

  if(type !== 'beacon' && type !== 'marker')
    return response(400, "Type must be marker or beacon");

  const challenge = await AdventureApp.get_challenge(map, type, type_id);

  if(!challenge)
    return response(404, "No puzzle with that ID.");

  // Only return the puzzles which are still winnable
  let sum = 0;
  const first_winnable = challenge.prizes.findIndex((prize) => {
    sum += prize.available;
    return sum > challenge.claimed;
  });

  // Ensure we only pass certain information
  return response(
    200,
    {
      id: challenge.id,
      prerequisites: challenge.prerequisites,
      claimed: challenge.claimed,
      is_prerequisite: challenge.is_prerequisite,
      prizes: challenge.prizes.slice(first_winnable),
    },
  );
}

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { AdventureApp, response } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // TODO: Get info about user

  if(!event.pathParameters)
    return response(400, "Need a 'map', and a correct ID for that type.");

  const { map, id } = event.pathParameters;

  let challenge_id;
  try {
    challenge_id = Number.parseInt(id, 10);
  }
  catch(e) {
    return response(400, 'Challenge id must be a number');
  }

  const challenge = await AdventureApp.get_challenge(map, challenge_id);

  if(!challenge)
    return response(404, 'No puzzle with that ID.');

  // Ensure we only pass certain information
  return response(
    200,
    {
      claimed: challenge.claimed,
      prizes: challenge.prizes,
    },
  );
}

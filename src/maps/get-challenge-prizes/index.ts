import { APIGatewayProxyEvent } from 'aws-lambda';

import controller, { ApiResponse } from '/opt/nodejs/controller';
import Persistence from '/opt/nodejs/persistence';

export async function get_challenge_prizes(event: APIGatewayProxyEvent, model: Persistence): Promise<ApiResponse> {
  // TODO: Get info about user

  if (!event.pathParameters) {
    return { code: 400, body: "Need a 'map', and a correct ID for that type." };
  }

  const { map, id } = event.pathParameters;

  let challenge_id;
  try {
    challenge_id = Number.parseInt(id, 10);
  } catch (e) {
    return { code: 400, body: 'Challenge id must be a number' };
  }

  const challenge = await model.challenge.get(map, challenge_id.toString());

  if (!challenge) {
    return { code: 404, body: 'No puzzle with that ID.' };
  }

  // Ensure we only pass certain information
  return {
    code: 200,
    body: {
      claimed: challenge.claimed,
      prizes: challenge.prizes,
    },
  };
}

export const handler = controller(get_challenge_prizes);

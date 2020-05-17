import controller, { ApiResponse, ApiRequest } from '../-helpers/request-handler';
import { Persistence } from '../../core/persistence';

export async function get_challenge_prizes(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  // TODO: Get info about user

  const { map, id } = event.path;

  if (!map || !id) {
    return { code: 400, body: "Need a 'map', and a correct ID for that type." };
  }

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

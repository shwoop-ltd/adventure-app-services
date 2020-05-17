import controller, { ApiResponse, ApiRequest } from '../../../controller';
import Persistence from '../../../persistence';

export async function start_challenge(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  const { user_id, map, challenge_id: challenge_id_str } = event.path;

  if (!user_id || !map || !challenge_id_str) {
    return { code: 400, body: 'Need the user and the challenge id' };
  }

  if (!event.authorizer || user_id !== event.authorizer.claims.sub) {
    return { code: 401, body: 'Cannot access this user' };
  }

  let challenge_id: number;
  try {
    challenge_id = Number.parseInt(challenge_id_str, 10);
  } catch (e) {
    return { code: 400, body: 'challenge_id must be a number' };
  }

  await model.telemetry.create('start-challenge', user_id);

  const challenge = await model.challenge.get(map, challenge_id.toString());
  if (!challenge) {
    return { code: 404, body: 'No challenge with that ID.' };
  }

  const map_info = await model.map.get(map);
  if (!map_info) {
    return { code: 404, body: `Map ${map} not found` };
  }

  const marker = map_info.challenges.find(({ id }) => id === challenge_id);
  if (!marker) {
    return { code: 404, body: `Marker ${challenge_id} does not exist` };
  }

  // Prerequisite challenge checking
  if (marker.prerequisites) {
    // Check whether user has prerequisites
    const user = await model.user.get(user_id);
    if (!user) {
      return { code: 404, body: 'User not found' };
    }

    if (user.prerequisite_challenges_completed < marker.prerequisites) {
      return { code: 402, body: 'Prerequisite challenges not completed' };
    }
  }

  // Logic time:
  // We test whether the time is greater than the active start date,
  // which is either active_date (if it exists), or else release_date (if that exists)
  // We then check that we are not past the end date (if that exists).
  const time = Date.now() / 1000;
  if ((marker.active_date || marker.release_date || 0) > time || (marker.end_date || time) < time) {
    return { code: 400, body: 'This challenge is not available right now' };
  }

  return {
    code: 200,
    body: {
      text: challenge.text,
      image_url: challenge.image_url,
      radius: challenge.radius,
      final_location: challenge.solution,
    },
  };
}

export const handler = controller(start_challenge);

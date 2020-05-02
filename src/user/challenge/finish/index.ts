import { get_next_prize, create_points_prize_response, get_distance } from '/opt/nodejs/helpers';
import controller, { ApiResponse, ApiRequest } from '/opt/nodejs/controller';
import Persistence from '/opt/nodejs/persistence';

export async function finish_challenge(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  if (!event.body) {
    return { code: 400, body: 'Body not present' };
  }

  const body = JSON.parse(event.body);
  if (!body.challenge_id || !body.location || !body.map) {
    return { code: 400, body: 'Incorrect body.' };
  }

  if (!event.path || !event.path.user_id) {
    return { code: 400, body: 'No user_id' };
  }

  if (!body.location.latitude || !body.location.longitude) {
    return { code: 400, body: 'Invalid location format' };
  }

  // Done first to ensure our telemetry is about a given user.
  const { user_id } = event.path;

  if (!event.authorizer || user_id !== event.authorizer.claims.sub) {
    return { code: 401, body: 'Cannot access this user' };
  }

  const user = await model.user.get(user_id);
  if (!user) {
    return { code: 404, body: 'User does not exist.' };
  }

  await model.telemetry.create('finish-challenge', user.id);

  // Core variable assignment
  const { location, map, challenge_id } = body;

  const challenge = await model.challenge.get(map, challenge_id);
  if (!challenge) return { code: 404, body: 'Puzzle not found' };

  // Check the user hasn't already completed it
  if (user.challenges.includes(challenge_id)) return { code: 403, body: 'Challenge already completed.' };

  // Solution Check, 50 meter radius
  if (get_distance(challenge.solution, location) > 50) return { code: 204, body: 'Wrong solution.' };

  // Identify the prize that should be awarded.
  const prize_info = get_next_prize(challenge);

  // Puzzle Check
  const map_info = await model.map.get(map);
  if (!map_info) return { code: 500, body: 'Map not found' };
  const challenge_info = map_info.challenges.find((map_challenge) => map_challenge.id === challenge_id);
  if (!challenge_info) return { code: 400, body: 'Challenge not found' };

  // Create prize for user, or give user points
  let response_object;
  if (prize_info && prize_info.points) {
    user.points += prize_info.points;
    response_object = create_points_prize_response(prize_info.points, challenge_info.location, 'challenge');
  } else if (prize_info) {
    const prize = await model.prize.create(user_id, prize_info.prize, 'challenge', undefined, challenge_info.location);
    user.prizes.push(prize.id);
    response_object = prize;
  }

  user.points += challenge.points;

  challenge.claimed += 1;

  user.challenges.push(challenge_id);

  if (challenge_info.is_prerequisite) user.prerequisite_challenges_completed += 1;

  await model.user.put(user);

  await model.challenge.put(challenge);

  // Return the prize
  if (response_object) {
    return { code: 200, body: response_object };
  } else {
    return { code: 200, body: false };
  }
}

export const handler = controller(finish_challenge);

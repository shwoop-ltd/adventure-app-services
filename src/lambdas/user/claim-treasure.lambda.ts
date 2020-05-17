import { get_next_prize, create_points_prize_response } from '../../utils/helpers';
import Persistence from '../../persistence';
import controller, { ApiResponse, ApiRequest } from '../../controller';

export async function claim_treasure(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  const { user_id, map, beacon } = event.path;

  if (!user_id || !map || !beacon) {
    return { code: 400, body: 'Missing path parameters.' };
  }

  await model.telemetry.create('get-treasure', user_id);

  // Does this user exist?
  const user = await model.user.get(user_id);

  if (!event.authorizer || user_id !== event.authorizer.claims.sub) {
    return { code: 401, body: 'Cannot access this user' };
  }

  if (!user) {
    return { code: 401, body: 'User does not exist.' };
  }

  // Is there a treasure with this beacon?
  const treasure = await model.treasure.get(map, beacon);
  if (!treasure) {
    return { code: 404, body: `There is no treasure with beacon id ${beacon}` };
  }

  // Is it a new treasure?
  if (user.treasure.includes(treasure.id)) {
    return { code: 403, body: 'Treasure already claimed' };
  }

  const prize_info = get_next_prize(treasure);

  if (!prize_info) {
    return { code: 204, body: 'There is no more treasure to claim' };
  }

  // Moved to the end so that if there are any fatal errors in the middle, nothing will be half changed

  // Create prize for user, or give user points
  let response_object;
  if (prize_info.points) {
    user.points += prize_info.points;
    response_object = create_points_prize_response(
      prize_info.points,
      { longitude: treasure.longitude, latitude: treasure.latitude },
      'treasure'
    );
  } else {
    const prize = await model.prize.create(user_id, prize_info.prize, 'treasure', undefined, {
      longitude: treasure.longitude,
      latitude: treasure.latitude,
    });
    user.prizes.push(prize.id);
    response_object = prize;
  }

  // Params - Add treasure and prize to user
  user.treasure.push(treasure.id);
  await model.user.put(user);

  // Store treasure update
  treasure.claimed += 1;
  await model.treasure.put(treasure);

  return { code: 201, body: response_object };
}

export const handler = controller(claim_treasure);

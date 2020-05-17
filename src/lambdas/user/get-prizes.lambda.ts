import { Persistence } from '../../core/persistence';
import controller, { ApiResponse, ApiRequest } from '../-helpers/request-handler';

export async function get_prizes(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  if (!event.path.user_id) {
    return { code: 400, body: 'No user_id' };
  }

  const { user_id } = event.path;

  await model.telemetry.create('get-prizes', user_id);

  if (!event.authorizer || user_id !== event.authorizer.claims.sub) {
    return { code: 401, body: 'Cannot access this user' };
  }

  // Does this user exist?
  const user = await model.user.get(user_id);

  if (!user) {
    return { code: 404, body: 'User does not exist.' };
  }

  return { code: 200, body: { points: user.points, prizes: user.prizes } };
}

export const handler = controller(get_prizes);

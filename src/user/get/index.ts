import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse, ApiRequest } from '/opt/nodejs/controller';

export async function get_user(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  if (!event.path || !event.path.user_id) {
    return { code: 400, body: 'No user_id' };
  }

  const { user_id } = event.path;

  await model.telemetry.create('get-user', user_id);

  if (!event.authorizer || user_id !== event.authorizer.claims.sub) {
    return { code: 401, body: 'Cannot access this user' };
  }

  // Does this user exist?
  const user = await model.user.get(user_id);
  if (!user) {
    return { code: 404, body: 'User does not exist' };
  }

  return { code: 200, body: user };
}

export const handler = controller(get_user);

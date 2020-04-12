import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse, ApiRequest } from '/opt/nodejs/controller';

export async function get_users(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  await model.telemetry.create('get-users');

  if (event.query && event.query.attributes) {
    var users = await model.user.get_all(
      Array.isArray(event.query.attributes) ? event.query.attributes : [event.query.attributes]
    );
  } else {
    var users = await model.user.get_all();
  }

  return { code: 200, body: users };
}

export const handler = controller(get_users);

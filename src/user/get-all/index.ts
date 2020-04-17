import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse, ApiRequest } from '/opt/nodejs/controller';

export async function get_users(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  await model.telemetry.create('get-users');

  const attributesWhiteList = ['id', 'campaign', 'points', 'prizes', 'challenges', 'prerequisite_challenges_completed'];
  let users;

  if (event.query && event.query.attributes) {
    let attributes = Array.isArray(event.query.attributes) ? event.query.attributes : [event.query.attributes];

    // refuses access to 'beta', 'surveys', 'treasure'
    if (attributes.some((v) => attributesWhiteList.indexOf(v) == -1)) {
      return { code: 401, body: 'Cannot access requested attribute' };
    }
    users = await model.user.get_all(attributes);
  } else {
    users = await model.user.get_all(attributesWhiteList);
  }

  return { code: 200, body: users };
}

export const handler = controller(get_users);

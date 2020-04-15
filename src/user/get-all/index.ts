import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse, ApiRequest } from '/opt/nodejs/controller';

export async function get_users(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  await model.telemetry.create('get-users');

  if (event.query && event.query.attributes) {
    let attributes = Array.isArray(event.query.attributes) ? event.query.attributes : [event.query.attributes];
    let sensitiveAttributes = ['beta', 'surveys', 'treasure'];
    if (attributes.some((v) => sensitiveAttributes.indexOf(v) > -1)) {
      return { code: 401, body: 'Cannot access requested attribute' };
    }
    var users = await model.user.get_all(attributes);
  } else {
    var users = await model.user.get_all([
      'id',
      'campaign',
      'points',
      'prizes',
      'challenges',
      'prerequisite_challenges_completed',
    ]);
  }

  return { code: 200, body: users };
}

export const handler = controller(get_users);

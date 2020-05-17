import { Persistence } from '../../core/persistence';
import controller, { ApiResponse, ApiRequest } from '../-helpers/request-handler';

export async function get_users(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  await model.telemetry.create('get-users');

  const attributesWhiteList = ['id', 'campaign', 'points', 'prizes', 'challenges', 'prerequisite_challenges_completed'];
  let attributes = attributesWhiteList;

  if (event.query?.attributes) {
    const user_attrs = Array.isArray(event.query.attributes) ? event.query.attributes : [event.query.attributes];

    if (!user_attrs.every((attr) => attributesWhiteList.includes(attr))) {
      return { code: 401, body: 'Cannot access requested attribute' };
    }
    attributes = user_attrs;
  }

  const users = await model.user.get_all(attributes);

  return { code: 200, body: users };
}

export const handler = controller(get_users);

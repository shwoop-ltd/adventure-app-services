import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse, ApiRequest } from '/opt/nodejs/controller';
import Model from '/opt/nodejs/persistence/models/model';

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

  const response = await model.user.get_all(['id', 'points']);

  response.sort((a, b) => (a.points > b.points ? 1 : -1));

  const check_id = (user: any) => {
    return user_id === user.id;
  };

  const user_rank: number = response.findIndex(check_id) + 1;

  const user_with_rank = {
    ...user,
    rank: user_rank,
  };

  console.log(response);
  console.log(user_with_rank.rank);

  return { code: 200, body: user_with_rank };
}

export const handler = controller(get_user);

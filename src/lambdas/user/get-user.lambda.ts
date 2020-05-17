import { Persistence } from '../../core/persistence';
import controller, { ApiResponse, ApiRequest } from '../-helpers/request-handler';

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

  // To get the user's rank, we need to load all users' points, sort them, then find the index of the requested user.
  // This will get really slow as the number of users grows, but it's the only easy way we could find for the MVP.
  // Post-MVP, we should either look into techniques like [this one][1] to avoid the performance issue, or [switch away
  // from DynamoDB][2].
  //
  // [1]: https://www.dynamodbguide.com/leaderboard-write-sharding/
  // [2]: https://shwoop.atlassian.net/browse/DEV-134
  const lifetimeRank =
    (await model.user.get_all(['id', 'points']))
      .sort((a, b) => a.points - b.points)
      .findIndex((user) => user_id === user.id) + 1;

  return { code: 200, body: { ...user, lifetimeRank } };
}

export const handler = controller(get_user);

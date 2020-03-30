import { APIGatewayProxyEvent } from 'aws-lambda';

import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse } from '/opt/nodejs/controller';

export async function delete_prize(event: APIGatewayProxyEvent, model: Persistence): Promise<ApiResponse> {
  if (!event.pathParameters) {
    return { code: 500, body: 'No path parameters. This should never happen!' };
  }
  if (!event.headers.Authorization) {
    return { code: 401, body: 'Need authentication to delete a prize' };
  }

  const auth = event.headers.Authorization;
  const prize_code = event.pathParameters.code;

  // Whether this is an admin's request
  const is_admin = auth === process.env.ADMIN_KEY;

  await model.telemetry.create('delete-prize', auth);

  // Get the prize
  const prize = await model.prize.get(prize_code);
  if (!prize) {
    return { code: 404, body: 'Prize code not found' };
  }

  // A user may not access another user's prizes
  if (!is_admin && prize.user_id !== auth) {
    return { code: 403, body: 'Incorrect user id' };
  }

  // An user may not delete a prize that is not self-redeemable
  const prize_types = (await model.prize.get_all_types()).prizes;
  if (!prize_types) {
    return { code: 500, body: 'Prize types irretrievable' };
  }

  const prize_type = prize_types.find((type) => type.name === prize.type);
  if (!prize_type) {
    return { code: 500, body: `Prize type ${prize.type} does not exist` };
  }

  if (!is_admin && !prize_type.redeem_type) {
    return { code: 400, body: 'The user may not redeem this prize themselves' };
  }

  // Update the prize as claimed
  prize.redeemed = true;
  await model.prize.put(prize);

  return { code: 204, body: 'Successful Operation' };
}

export const handler = controller(delete_prize);

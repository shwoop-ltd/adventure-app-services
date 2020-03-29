import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { DBPrizeType } from 'schemas';
import { AdventureApp, generate_telemetry, Prizes, response } from '/opt/nodejs';

// Pre-load the prize-types, for efficiency.
// Note: this assumes there will be no requests before this promise has completed.
let prize_types: DBPrizeType[];
AdventureApp.get_prize_types().then((result) => {
  prize_types = result.prizes;
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters) return response(500, 'No path parameters. This should never happen!');
  if (!event.headers.Authorization) return response(401, 'Need authentication to delete a prize');

  const auth = event.headers.Authorization;
  const prize_code = event.pathParameters.code;

  // Whether this is an admin's request
  const is_admin = auth === process.env.ADMIN_KEY;

  await generate_telemetry(event, 'delete-prize', auth);

  // Get the prize
  const prize = await Prizes.get(prize_code);
  if (!prize) return response(404, 'Prize code not found');

  // A user may not access another user's prizes
  if (!is_admin && prize.user_id !== auth) return response(403, 'Incorrect user id');

  // An user may not delete a prize that is not self-redeemable
  if (!prize_types) return response(500, 'Prize types irretrievable');

  const prize_type = prize_types.find((type) => type.name === prize.type);
  if (!prize_type) return response(500, `Prize type ${prize.type} does not exist`);

  if (!is_admin && !prize_type.redeem_type) return response(400, 'The user may not redeem this prize themselves');

  // Update the prize as claimed
  prize.redeemed = true;
  await Prizes.put(prize);

  return response(204, 'Successful Operation');
}

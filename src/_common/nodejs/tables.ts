import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  DBMapCollection, DBMapInfo, DBBeacon, DBChallenge, DBSurveyCollection, DBPrizeTypeCollection, DBUser, DBPrize, DBTelemetry, DBTreasure,
} from 'schemas';

import { get_item, put_item } from './table-helpers';

const {
  TABLE_NAME,
  USERS_TABLE_NAME,
  PRIZES_TABLE_NAME,
  TELEMETRY_TABLE_NAME,
} = process.env;

export const AdventureApp = {
  get_maps: () => get_item<DBMapCollection>(TABLE_NAME, 'maps', true),
  get_map: (name: string) => get_item<DBMapInfo>(TABLE_NAME, `map-${name}`),
  get_beacon: (map: string, beacon: string) => get_item<DBBeacon>(TABLE_NAME, `beacon-${map}-${beacon}`),
  get_challenge: (
    (map: string, type: 'beacon' | 'marker', id: string) => get_item<DBChallenge>(TABLE_NAME, `challenge-${map}-${type}-${id}`)
  ),
  get_challenge_by_id: (id: string) => get_item<DBChallenge>(TABLE_NAME, id),
  put_challenge: (challenge: DBChallenge) => put_item(TABLE_NAME, challenge),
  get_prize_types: () => get_item<DBPrizeTypeCollection>(TABLE_NAME, 'prize-types', true),
  get_surveys: () => get_item<DBSurveyCollection>(TABLE_NAME, 'surveys', true),
  get_treasure: (beacon: string) => get_item<DBTreasure>(TABLE_NAME, `treasure-beacon-${beacon}`),
  put_treasure: (treasure: DBTreasure) => put_item(TABLE_NAME, treasure),
};

export const Users = {
  get: (user_id: string) => get_item<DBUser>(USERS_TABLE_NAME, user_id),
  put: (user: DBUser) => put_item(USERS_TABLE_NAME, user),
};

export const Prizes = {
  get: (prize_id: string) => get_item<DBPrize>(PRIZES_TABLE_NAME, prize_id),
  put: (prize: DBPrize) => put_item(PRIZES_TABLE_NAME, prize),
};

export const Telemetry = {
  put: (item: DBTelemetry) => put_item(TELEMETRY_TABLE_NAME, item),
};

export function generate_telemetry(event: APIGatewayProxyEvent, function_name: string, user_id?: string) {
  const date = Date.now() / 1000;

  const object: DBTelemetry = {
    id: `${date}-${function_name}`,
    date,
    user_id,
    function_name,
    headers: event.headers,
    body: event.body,
    parameters: {
      path: event.pathParameters,
      query: event.queryStringParameters,
    },
  };

  return Telemetry.put(object);
}

export async function create_prize(
  user_id: string,
  type: string,
  received_from: 'survey' | 'challenge' | 'treasure',
  points?: number,
  update_user = false,
) {
  function generate_id(length: number) {
    const valid_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let id = "";
    for(let i = 0; i < length; i += 1)
      id += valid_chars.charAt(Math.floor(Math.random() * valid_chars.length));

    return id;
  }

  const prize: DBPrize = {
    id: generate_id(12),
    user_id,
    type,
    received_from,
    received: (new Date()).toISOString(),
    redeemed: false,
  };

  await Prizes.put(prize);

  if(update_user) {
    const user = await Users.get(user_id);
    if(!user)
      throw new Error(`Expected user ${user} to exist`);

    user.prizes.push(prize.id);
    await Users.put(user);
  }
  return prize;
}

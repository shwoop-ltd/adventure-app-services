import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse, ApiRequest } from '/opt/nodejs/controller';

export async function get_prize_types(_event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  const result = await model.prize.get_all_types();

  if (result) {
    return { code: 200, body: result.prizes };
  } else {
    return { code: 502, body: 'No prize types!' };
  }
}

export const handler = controller(get_prize_types);

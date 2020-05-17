import { Persistence } from '../../core/persistence';
import controller, { ApiResponse, ApiRequest } from '../-helpers/request-handler';

export async function get_prize_types(_event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  const result = await model.prize.get_all_types();

  if (result) {
    return { code: 200, body: result.prizes };
  } else {
    return { code: 502, body: 'No prize types!' };
  }
}

export const handler = controller(get_prize_types);

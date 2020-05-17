import { Persistence } from '../../core/persistence';
import controller, { ApiResponse, ApiRequest } from '../-helpers/request-handler';

export async function get_prize(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  const { code: prize_code } = event.path;

  if (!prize_code) {
    return { code: 400, body: 'No path parameters' };
  }

  const result = await model.prize.get(prize_code);

  if (result) {
    return { code: 200, body: result };
  } else {
    return { code: 404, body: `Code ${event.path.code} was not found` };
  }
}

export const handler = controller(get_prize);

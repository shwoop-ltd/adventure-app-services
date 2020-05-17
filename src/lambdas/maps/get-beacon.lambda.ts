import controller, { ApiResponse, ApiRequest } from '../../controller';
import Persistence from '../../persistence';

export async function get_beacon(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  const { map, beacon } = event.path;
  if (!map || !beacon) {
    return { code: 400, body: 'No path parameters' };
  }

  const result = await model.beacon.get(map, beacon);

  if (result) {
    return { code: 200, body: result };
  } else {
    return { code: 404, body: `Beacon ${beacon} doesn't exist for map ${map}` };
  }
}

export const handler = controller(get_beacon);

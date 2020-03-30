import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse, ApiRequest } from '/opt/nodejs/controller';

export async function get_maps(_event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  const maps = await model.map.get_all();

  if (maps) {
    return { code: 200, body: maps.maps };
  } else {
    return { code: 500, body: 'Maps not found!' };
  }
}

export const handler = controller(get_maps);

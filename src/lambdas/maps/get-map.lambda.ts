import { Persistence } from '../../core/persistence';
import controller, { ApiResponse, ApiRequest } from '../-helpers/request-handler';

export async function get_map(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  // Get Map
  const { map } = event.path;
  if (!map) {
    return { code: 400, body: 'No path parameters' };
  }

  const map_info = await model.map.get(map);

  // Map Check
  if (!map_info) {
    return { code: 404, body: 'Map not found' };
  }

  // Filter Map Info to currently open and time to next.
  const time = Date.now() / 1000;

  // Allow elements that either do not have a release time (considered timeless) or whose life time covers the current date.
  // Elements with a release time and no duration are assumed to be available forever after release
  const challenges = map_info.challenges.filter(
    ({ release_date, end_date }) => (!release_date || release_date < time) && (!end_date || end_date > time)
  );

  const next_release = Math.min(
    ...map_info.challenges
      .filter(({ release_date }) => release_date && release_date > time) // Filters to future objects
      .map(({ release_date }) => release_date as number)
  ); // Converts objects into just release time

  const return_data = {
    ...map_info,
    challenges,
    next_release,
  };

  return { code: 200, body: return_data };
}

export const handler = controller(get_map);

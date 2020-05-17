import controller, { ApiResponse } from '../../-helpers/request-handler';

export async function stop_challenge(): Promise<ApiResponse> {
  // Nothing needs to be done here atm.
  return {
    code: 201,
    body: '',
  };
}

export const handler = controller(stop_challenge);

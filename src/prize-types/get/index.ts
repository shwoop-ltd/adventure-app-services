import { APIGatewayProxyEvent } from 'aws-lambda';
import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse } from '/opt/nodejs/controller';

export async function get_prize_types(event: APIGatewayProxyEvent, model: Persistence): Promise<ApiResponse> {
  const result = await model.prize.get_all_types();

  if (result) {
    return { code: 200, body: result.prizes };
  } else {
    return { code: 502, body: 'No prize types!' };
  }
}

export const handler = controller(get_prize_types);

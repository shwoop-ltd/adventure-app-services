import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { response, Prizes } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters) return response(400, 'No path parameters');

  const result = await Prizes.get(event.pathParameters.code);

  if (result) return response(200, result);
  else return response(404, `Code ${event.pathParameters.code} was not found`);
}

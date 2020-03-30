import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Persistence from './persistence';

export interface ApiResponse {
  code: number;
  body: string | object | boolean;
}

type ApiFunction = (event: APIGatewayProxyEvent, database: Persistence) => Promise<ApiResponse>;

/**
 * Makes it easier to create a response
 *
 * @param code The status code
 * @param body A simplified body, interpreted as a string or json as necessary.
 */
function craft_response(code: number, body: string | object | boolean): APIGatewayProxyResult {
  if (typeof body === 'string') {
    return {
      statusCode: code,
      body,
      headers: { 'Content-Type': 'text/plain' },
    };
  } else {
    return {
      statusCode: code,
      body: JSON.stringify(body),
    };
  }
}

export default (handler_function: ApiFunction) => async (event: APIGatewayProxyEvent) => {
  const model = new Persistence(event);
  const response = await handler_function(event, model);
  return craft_response(response.code, response.body);
};

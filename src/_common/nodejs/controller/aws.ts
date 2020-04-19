import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyWithCognitoAuthorizerEvent,
} from 'aws-lambda';
import Persistence from '../persistence';
import { ApiFunction, ApiRequest } from './types';
import DynamoDBDriver from '../persistence/drivers/dynamodb';

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

export default (handler_function: ApiFunction) => async (event: APIGatewayProxyWithCognitoAuthorizerEvent) => {
  const query = Object.entries(event.multiValueQueryStringParameters || []).reduce((prev, [key, value]) => {
    if (key.endsWith('[]')) {
      key = key.replace('[]', '');
    }

    return { ...prev, key: value.length === 1 ? value[0] : value };
  }, {} as { [key: string]: string | string[] | undefined });

  const event_input: ApiRequest = {
    path: event.pathParameters || {},
    query: query,
    headers: event.headers,
    body: event.body,
    authorizer: event.requestContext.authorizer,
  };

  const model = new Persistence(event_input, new DynamoDBDriver());
  const response = await handler_function(event_input, model);
  return craft_response(response.code, response.body);
};

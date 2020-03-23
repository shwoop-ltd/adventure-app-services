import { APIGatewayProxyResult } from 'aws-lambda';

export function handler(): APIGatewayProxyResult {
  // Nothing needs to be done here atm.
  return {
    statusCode: 201,
    body: '',
  };
}

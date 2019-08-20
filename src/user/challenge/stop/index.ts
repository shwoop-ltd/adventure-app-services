import { APIGatewayProxyResult } from 'aws-lambda';

export async function handler(): Promise<APIGatewayProxyResult> {
  // Nothing needs to be done here atm.
  return {
    statusCode: 201,
    body: "",
  };
}

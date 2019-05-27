import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export default async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Nothing needs to be done here atm.
  return {
    statusCode: 201,
    body: "",
  };
};

import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };

  doc_client.delete({ TableName: prizes_table_name, Key: { id: event.pathParameters.code } }, function (err, data) {
    if (err) return {statusCode: 502, body: "Failed to delete. Internal server error."};
  });
  return { statusCode: 204, body: "Success" }
}

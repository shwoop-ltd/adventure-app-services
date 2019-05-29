import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const doc_client = new DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const result = await doc_client.get({ TableName: 'AdventureApp', Key: { id: "maps" } }).promise();

  if(result.Item)
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item.maps),
    };
  else
    return {
      statusCode: 500,
      body: "Maps not found!",
    };
}

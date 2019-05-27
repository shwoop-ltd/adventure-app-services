import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const doc_client = new DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

export default async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if(!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };

  const map_name = event.pathParameters.map;
  const beacon_id = event.pathParameters.beacon;
  const key = 'beacon-' + map_name + '-' + beacon_id;

  const result = await doc_client.get({ TableName: 'AdventureApp', Key: { id: key } }).promise();

  if(result.Item)
    return { statusCode: 200, body: JSON.stringify(result.Item) };
  else
    return { statusCode: 404, body: "" };
};

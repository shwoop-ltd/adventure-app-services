import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const users_table_name = process.env.USERS_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    if (!event.queryStringParameters || !event.queryStringParameters.id)
        return { statusCode: 400, body: "User ID was not present" };

    const result = await doc_client.get({ TableName: users_table_name, Key: { "id": event.queryStringParameters.id } }).promise();

    if (result.Item)
        //Strip any data from the user object that a client shouldn't have here.
        return {
            statusCode: 200,
            body: JSON.stringify(result.Item),
        };
    else
        //Traditionally this would be bad practice but its Ok because there are other ways to check if a user exists.
        return {
            statusCode: 404,
            body: "User not found!",
        };
}

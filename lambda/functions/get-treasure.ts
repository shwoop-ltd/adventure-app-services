import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const accuracy = 0.00005 //TODO: Move this to environment variables
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

function generateRandomString(length: number) { //TODO: Put this in its own class.
    let returnString = ""
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    for (let i = 0; i < length; i++) {
        returnString += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return returnString;
}

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    //TODO: Appropriate null checks for malformed data in the DB (E.g. treasures without prizes)
    if (!event.queryStringParameters || !event.queryStringParameters.beacon || !event.queryStringParameters.longitude || !event.queryStringParameters.latitude)
        return { statusCode: 400, body: "Query Parameter missing. Expected beacon, longitude, latitude." };

    const treasure_id = event.queryStringParameters.beacon;
    const longitude = parseFloat(event.queryStringParameters.longitude);
    const latitude = parseFloat(event.queryStringParameters.latitude);
    const key = "treasure-beacon-" + treasure_id;

    //Incorrect input failure cases
    const result = await doc_client.get({ TableName: table_name, Key: { id: key } }).promise();
    if (!result.Item) {
        return { statusCode: 404, body: `There is no treasure with beacon id ${treasure_id}` };
    }
    // Checking whether user's given coordinates are within the vicinity of the beacon.
    // if (longitude > result.Item.longitude + accuracy || longitude < result.Item.longitude - accuracy ||
    //     latitude > result.Item.latitude + accuracy || latitude < result.Item.latitude - accuracy) {
    //     return { statusCode: 403, body: "Client not at beacon, GPS coordinates wrong." }
    // }

    //Establish prize object with default data. TODO: Abstract this to its own class or something
    const d = new Date();
    const prize = {
        "id": generateRandomString(8),
        type: "Red Bull",
        received: d.toISOString(),
        received_from: "Treasure",
        claimed: false,
        points: undefined
    };

    const prizes = result.Item.prizes;
    let total = 0;
    const claimed = result.Item.claimed;

    //Would have used foreach but no early break
    for (let i = 0; i < prizes.length; i++) {
        const element = prizes[i];
        total += element.available;
        if (claimed < total) {
            prize.type = element.prize;
            prize.points = element.points;
            break;
        }
    };
    doc_client.put({ TableName: prizes_table_name, Item: prize }, function(err,data) {}); //Store the prize for later claiming
    //For some reason, this function does not work without the callback. Even if the callback doesn't do anything.


    //Increment "claimed"
    const params = {
        TableName: table_name,
        Key: {
            id: key,
        },
        UpdateExpression: "set claimed = claimed + :val",
        ExpressionAttributeValues: {
            ":val": 1
        }
    };
    doc_client.update(params);
    return { statusCode: 200, body: JSON.stringify(prize) };
}



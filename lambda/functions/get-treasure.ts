import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const users_table_name = process.env.USERS_TABLE_NAME!;
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
//const accuracy = 0.00005 //TODO: Move this to environment variables
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
    if (!event.queryStringParameters || !event.queryStringParameters.beacon)
        return { statusCode: 400, body: "Query Parameter missing. Expected beacon." };

    //Does this user exist?
    const user_id = event.headers.Authorization.substring(7);
    const user_result_promise = await doc_client.get({ TableName: users_table_name, Key: { "id": user_id } }).promise();
    const user_result = user_result_promise.Item;
    if (!user_result) {
        return { statusCode: 401, body: "User does not exist." }
    }

    //Is it a new treasure?
    const treasure_id = event.queryStringParameters.beacon;
    if (user_result.treasure.includes(treasure_id)) {
        return { statusCode: 403, body: "Treasure already claimed" }
    }

    //Is there a treasure with this beacon?
    const key = "treasure-beacon-" + event.queryStringParameters.beacon;
    const treasure_result = await doc_client.get({ TableName: table_name, Key: { id: key } }, function (err, data) { }).promise();
    if (!treasure_result.Item) {
        return { statusCode: 404, body: `There is no treasure with beacon id ${treasure_id}` };
    }

    //Prize stuff - TODO: Move to its own class
    const d = new Date();
    const prize = {
        "id": generateRandomString(8),
        type: "Red Bull",
        received: d.toISOString(),
        received_from: "treasure",
        claimed: false,
        points: undefined
    };

    const prizes = treasure_result.Item.prizes;
    const claimed = treasure_result.Item.claimed;
    let total = 0;
    for (let i = 0; i < prizes.length; i++) {
        const element = prizes[i];
        total += element.available;
        if (claimed < total) {
            prize.type = element.prize;
            prize.points = element.points;
            break;
        }
    };    

    //Params - Add treasure beacon id to user
    user_result.treasure.push(treasure_id);
    var treasure_params = {
        TableName: users_table_name,
        Key: { "id": user_id },
        UpdateExpression: 'SET treasure = :x',
        ExpressionAttributeValues: {
            ':x': user_result.treasure
        }
    };

    //Params - Increment "claimed" counter
    const counter_params = {
        TableName: table_name,
        Key: { id: key },
        UpdateExpression: "set claimed = claimed + :val",
        ExpressionAttributeValues: {
            ":val": 1
        }
    };

    //Moved to the end so that if there are any fatal errors in the middle, nothing will be half changed

    //Store Prize
    doc_client.put({ TableName: prizes_table_name, Item: prize }, function (err, data) { });

    //Update claimed treasures
    doc_client.update(treasure_params, function(err, data) {if (err) return{statusCode: 418, body: err}});

    //Update number of treasures claimed
    doc_client.update(counter_params);
    return { statusCode: 200, body: JSON.stringify(prize) };
}



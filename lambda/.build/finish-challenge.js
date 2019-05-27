"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const doc_client = new aws_sdk_1.DynamoDB.DocumentClient({ region: 'ap-southeast-2' });
exports.default = async (event, context) => {
    // TODO: Get info about user, store user info
    const map_name = event.pathParameters.map;
    const beacon_id = event.queryStringParameters.beacon;
    const key = 'puzzle-' + map_name + '-' + beacon_id;
    const result = await doc_client.get({ TableName: 'AdventureApp', Key: { id: key } }).promise();
    if (!result.Item)
        return { statusCode: 404, body: "" };
    try {
        const body = JSON.parse(event.body);
        if (result.Item.solution === body.beacon_id)
            return { statusCode: 201, body: JSON.stringify({ prize: { type: 'points', points: 1 } }) }; // Correct, they get a prize. TODO: Actual prize stuff
        else
            return { statusCode: 204, body: "" }; // Not correct, so no prize
    }
    catch (e) {
        // Some problem with decoding information
        return { statusCode: 400, body: "" };
    }
};

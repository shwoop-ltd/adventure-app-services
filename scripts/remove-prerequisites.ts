/**
 * Writes the given json objects into our table
 */
import { promises as fs } from 'fs';
import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { ScanOutput, ScanInput } from 'aws-sdk/clients/dynamodb';

const doc_client = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

const params: ScanInput = {
  TableName: "AdventureAppUsers-Prod",
  ProjectionExpression: "id, #p",
  FilterExpression: "#p > :max",
  ExpressionAttributeNames: {
    "#p": "prerequisite_challenges_completed",
  },
  // @ts-ignore
  ExpressionAttributeValues: {
    ":max": 0,
  },
};


function onScan(err: AWSError, data: ScanOutput) {
  if(err)
    console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
  else {
    // print all the movies
    console.log("Scan succeeded.");
    if(!data.Items) {
      console.log("No items match filter.");
      return;
    }
    data.Items.forEach((user) => {
      console.log(user.id);
      const update_params = {
        TableName: "AdventureAppUsers-Prod",
        Key: { id: user.id },
        UpdateExpression: "set #p = :x",
        ExpressionAttributeNames: { "#p": "prerequisite_challenges_completed" },
        ExpressionAttributeValues: {
          ":x": 0,
        },
      };
      doc_client.update(update_params, (err2, data2) => {
        if(err2)
          console.log(err2);
        else
          console.log(data2);
      });
    });
    console.log("All users listed.");
    // continue scanning if we have more movies, because
    // scan can retrieve a maximum of 1MB of data
    if(typeof data.LastEvaluatedKey !== "undefined") {
      console.log("Scanning for more...");
      params.ExclusiveStartKey = data.LastEvaluatedKey;
      doc_client.scan(params, onScan);
    }
  }
}

// TODO: Currently no method to remove items in the database, only overwrite or add
async function run() {
  // Load db from input files

  // Setup creds
  doc_client.scan(params, onScan);
}

run().catch((e) => console.error(e));

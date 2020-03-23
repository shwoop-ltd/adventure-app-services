/**
 * Writes the given json objects into our table
 */
import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { ScanOutput, ScanInput } from 'aws-sdk/clients/dynamodb';

const table_name = 'AdventureAppPrizes-Prod';
const doc_client = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

const params: ScanInput = {
  TableName: table_name,
};

function onScan(err: AWSError, data: ScanOutput) {
  if(err)
    console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
  else {
    // print all the movies
    console.log('Scan succeeded.');
    if(!data.Items) {
      console.log('No items match filter.');
      return;
    }
    data.Items.forEach((prize) => {
      const new_prize = {
        ...prize,
        location: {
          latitude: Math.random() * (-36.852909 - -36.854626) + -36.854626,
          longitude: Math.random() * (174.769479 - 174.766711) + 174.766711,
        },
      };
      const update_params = {
        TableName: table_name,
        Item: new_prize,
      };
      doc_client.put(update_params, (err2, data2) => {
        if(err2)
          console.log(err2);
        else
          console.log(data2);
      });
    });
    console.log('All users listed.');
    // continue scanning if we have more movies, because
    // scan can retrieve a maximum of 1MB of data
    if(typeof data.LastEvaluatedKey !== 'undefined') {
      console.log('Scanning for more...');
      params.ExclusiveStartKey = data.LastEvaluatedKey;
      doc_client.scan(params, onScan);
    }
  }
}

// TODO: Currently no method to remove items in the database, only overwrite or add
async function run() {
  // Load db from input files

  // Setup creds
  await doc_client.scan(params, onScan).promise();
}

run().catch((e) => console.error(e));

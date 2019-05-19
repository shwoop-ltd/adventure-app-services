/**
 * Writes the given json objects into our table
 */

import * as AWS from 'aws-sdk';

import beacons from './beacons.json';
import maps from './maps.json';
import puzzles from './puzzles.json';

// Setup creds
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: 'shwoop' });
const doc_client = new AWS.DynamoDB.DocumentClient({region: 'ap-southeast-2'});

async function run() {
  // TODO: Clear db first

  for(const beacon of beacons)
    await doc_client.put({ TableName: 'AdventureApp', Item: beacon }).promise();
  for(const map of maps)
    await doc_client.put({ TableName: 'AdventureApp', Item: map }).promise();
  // for(const puzzle of puzzles)
  //   await doc_client.put({ TableName: 'AdventureApp', Item: puzzle }).promise();
}

run().then(() => console.log("Finished")).catch(e => console.error(e));

/**
 * Writes the given json objects into our table
 */
import { promises as fs } from 'fs';
import * as AWS from 'aws-sdk';

const minimist = require('minimist') as typeof import('minimist');

type Item = { id: string };

const args = minimist(process.argv.slice(2));
const input_files = args._;
const {
  filter,
  profile,
  db,
  stage,
} = args;

if(!['Production', 'Development'].includes(stage) && !db) {
  console.log("Input var --stage must be either 'Production' or 'Development'");
  process.exit(-1);
}

// TODO: Currently no method to remove items in the database, only overwrite or add
async function run() {
  // Load db from input files
  let items = (
    (await Promise.all(
      input_files.map((filename) => fs.readFile(filename, { encoding: 'utf-8' })),
    ))
      .reduce((prev, cur) => prev.concat(JSON.parse(cur)), [] as Item[])
  );
  console.log(`Found ${items.length} items`);

  // Filter items if requested
  if(filter) {
    items = items.filter(({ id }) => filter.exec(id));
    console.log(`Modifying ${items.length} items`);
  }

  // Setup creds
  if(profile)
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });

  const doc_client = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-2', endpoint: db });
  const stage_ext = stage ? `-${stage}` : '';

  // DynamoDB imposes a limit of writing at most 25 items at a time
  const results: Promise<void>[] = [];
  for(let i = 0; (i * 25) < items.length; i += 1) {
    const mini_batch = items.slice(i * 25, (i + 1) * 25);

    results.push(
      doc_client.batchWrite({
        RequestItems: {
          [`AdventureApp${stage_ext}`]: mini_batch.map((item) => ({ PutRequest: { Item: item } })),
        },
      })
        .promise()
        .then((result) => {
          console.log(result);
        }),
    );
  }

  await Promise.all(results);
}

run().catch((e) => console.error(e));

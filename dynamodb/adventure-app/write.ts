/**
 * Writes the given json objects into our table
 */

import * as AWS from 'aws-sdk';

import beacons from './beacons.json';
import marker_sets from './map-info.json';
import maps from './maps.json';
import puzzles from './puzzles.json';
import treasures from './treasures.json';

type Item = (typeof beacons | typeof marker_sets | typeof maps | typeof puzzles | typeof treasures)[0];

const filter_params = {
  map: undefined as string | undefined,
  beacons: false,
  map_info: false,
  maps: false,
  puzzles: false,
  treasures: false,
};

function verify_params() {
  const mapIndex = process.argv.indexOf("--map");
  if(mapIndex > 0) {
    if(process.argv.length <= mapIndex + 1) {
      console.log("When passing --map, must specify map name after");
      return false;
    }
    else
      filter_params.map = process.argv[mapIndex + 1];
  }

  if(process.argv.includes('--beacons'))
    filter_params.beacons = true;
  if(process.argv.includes('--map-info'))
    filter_params.map_info = true;
  if(process.argv.includes('--maps'))
    filter_params.maps = true;
  if(process.argv.includes('--puzzles'))
    filter_params.puzzles = true;
  if(process.argv.includes('--treasures'))
    filter_params.treasures = true;

  if(!filter_params.beacons && !filter_params.map_info && !filter_params.maps && !filter_params.puzzles && !filter_params.treasures) {
    filter_params.beacons = true;
    filter_params.map_info = true;
    filter_params.maps = true;
    filter_params.puzzles = true;
    filter_params.treasures = true;
  }

  return true;
}

function filter(item: Item) {
  if(filter_params.map && (item.id !== "maps" && item.id.split('-')[1] !== filter_params.map))
    return false;

  if(item.id.startsWith('beacon-') && !filter_params.beacons)
    return false;
  else if(item.id.startsWith('map-') && !filter_params.map_info)
    return false;
  else if(item.id.startsWith('puzzle-') && !filter_params.puzzles)
    return false;
  else if(item.id.startsWith('treasure-') && !filter_params.puzzles)
    return false;
  else if(item.id === "maps" && !filter_params.maps)
    return false;

  return true;
}

async function run() {
  if(!verify_params())
    return;

  // TODO: Currently no method to remove items in the database, only overwrite or add

  // Setup creds
  let endpoint;
  const pc_index = process.argv.indexOf('--db');
  if(pc_index >= 0)
    endpoint = process.argv[pc_index + 1];

  //AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: 'shwoop' });
  const doc_client = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-2', endpoint });

  const items = [
    ...marker_sets,
    ...maps,
    ...puzzles,
    ...treasures,
    ...beacons,
  ];

  const items_to_change = items.filter(filter);

  console.log("Modifying " + items_to_change.length + " items");

  // DynamoDB imposes a limit of writing at most 25 items at a time
  for(let i = 0; (i * 25) < items_to_change.length; i += 1) {
    const mini_batch = items_to_change.slice(i * 25, (i + 1) * 25);
    const result = await doc_client.batchWrite({
      RequestItems: {
        AdventureApp: mini_batch.map(item => ({ PutRequest: { Item: item } })),
      },
    }).promise();
    console.log(result);
  }
}

run().catch(e => console.error(e));

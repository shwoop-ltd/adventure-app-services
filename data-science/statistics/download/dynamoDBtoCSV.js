let program = require('commander');
let AWS = require('aws-sdk');
let { unmarshalItem } = require('dynamodb-marshaler');
let { unmarshal } = require('dynamodb-marshaler');
let Papa = require('papaparse');
let fs = require('fs');

let headers = [];
let unMarshalledArray = [];

program
  .version('0.0.1')
  .option('-t, --table [tablename]', 'Add the table you want to output to csv')
  .option('-d, --describe')
  .option('-r, --region [regionname]')
  .option('-e, --endpoint [url]', 'Endpoint URL, can be used to dump from local DynamoDB')
  .option('-p, --profile [profile]', 'Use profile from your credentials file')
  .option('-f, --file [file]', 'Name of the file to be created')
  .option('-ec --envcreds', 'Load AWS Credentials using AWS Credential Provider Chain')
  .option('-s, --size [size]', 'Number of lines to read before writing.', 5000)
  .parse(process.argv);

if (!program.table) {
  console.log('You must specify a table');
  program.outputHelp();
  process.exit(1);
}

if (program.region && AWS.config.credentials) AWS.config.update({ region: program.region });
else AWS.config.loadFromPath(__dirname + '/config.json');

if (program.endpoint) AWS.config.update({ endpoint: program.endpoint });

if (program.profile) {
  var newCreds = new AWS.SharedIniFileCredentials({ profile: program.profile });
  newCreds.profile = program.profile;
  AWS.config.update({ credentials: newCreds });
}

if (program.envcreds) {
  var newCreds = AWS.config.credentials;
  newCreds.profile = program.profile;
  AWS.config.update({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_DEFAULT_REGION,
  });
}

let dynamoDB = new AWS.DynamoDB();

let query = {
  TableName: program.table,
  Limit: 1000,
};

// if there is a target file, open a write stream
if (!program.describe && program.file) var stream = fs.createWriteStream(program.file, { flags: 'a' });

let rowCount = 0;
let writeCount = 0;
writeChunk = program.size;

let describeTable = function (query) {
  dynamoDB.describeTable(
    {
      TableName: program.table,
    },
    (err, data) => {
      if (!err) {
        console.dir(data.Table);
      } else console.dir(err);
    }
  );
};

var scanDynamoDB = function (query) {
  dynamoDB.scan(query, (err, data) => {
    if (!err) {
      unMarshalIntoArray(data.Items); // Print out the subset of results.
      if (data.LastEvaluatedKey) {
        // Result is incomplete; there is more to come.
        query.ExclusiveStartKey = data.LastEvaluatedKey;
        if (rowCount >= writeChunk) {
          // once the designated number of items has been read, write out to stream.
          unparseData(data.LastEvaluatedKey);
        }
        scanDynamoDB(query);
      } else {
        unparseData('File Written');
      }
    } else {
      console.dir(err);
    }
  });
};

var unparseData = function (lastEvaluatedKey) {
  let endData = Papa.unparse({
    fields: [...headers],
    data: unMarshalledArray,
  });
  if (writeCount > 0) {
    // remove column names after first write chunk.
    endData = endData.replace(/(.*\r\n)/, '');
  }
  if (program.file) writeData(endData);
  else console.log(endData);

  // Print last evaluated key so process can be continued after stop.
  console.log(lastEvaluatedKey);

  // reset write array. saves memory
  unMarshalledArray = [];
  writeCount += rowCount;
  rowCount = 0;
};

var writeData = function (data) {
  stream.write(data);
};

function unMarshalIntoArray(items) {
  if (items.length === 0) return;

  items.forEach((row) => {
    let newRow = {};

    // console.log( 'Row: ' + JSON.stringify( row ));
    Object.keys(row).forEach(function (key) {
      if (headers.indexOf(key.trim()) === -1) {
        // console.log( 'putting new key ' + key.trim() + ' into headers ' + headers.toString());
        headers.push(key.trim());
      }
      let newValue = unmarshal(row[key]);

      if (typeof newValue === 'object') {
        newRow[key] = JSON.stringify(newValue);
      } else {
        newRow[key] = newValue;
      }
    });

    // console.log( newRow );
    unMarshalledArray.push(newRow);
    rowCount++;
  });
}

if (program.describe) describeTable(query);
else scanDynamoDB(query);

/**
 * Writes the given json objects into our table
 */
import * as fs from 'fs';
import * as AWS from 'aws-sdk';
import { ScanOutput, ScanInput } from 'aws-sdk/clients/dynamodb';
import { User } from '/opt/nodejs/persistence/models/users';

// Russell! >:(
const answers: [{ id: string; solution: string }] = JSON.parse(
  fs.readFileSync(
    'C:/Users/russe/Documents/GitHub/adventure-app-services/scripts/Statistics/challenge_answers.json',
    'utf-8'
  )
);

const doc_client = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

interface Telemetry {
  id: string;
  body: string;
  date: number;
  function_name: string;
  headers: string;
  parameters: string;
  user_id: string;
}

interface ChallengeComplete {
  challenge_id: number;
  time: number;
}

interface Prize {
  location?: { latitude: number; longitude: number };
  received: string;
  received_from: string;
  redeemed: boolean;
  type: string;
  user_id: string;
}

let users: User[] = [];
let telemetry: Telemetry[] = [];
let prizes: Prize[] = [];

const user_telemetry: { [key: string]: number } = {};
const user_challenge_time: { [key: string]: [{ start: number; finish?: number }] } = {};
const prize_redeemed_time: { [key: number]: { [key: string]: number } } = {};
const survey_data: { [key: string]: { answer: string; count: number }[] } = {};

const telemetryParams: ScanInput = {
  TableName: 'AdventureAppTelemetry-Prod',
};
const userParams: ScanInput = {
  TableName: 'AdventureAppUsers-Prod',
};
const prizesParams: ScanInput = {
  TableName: 'AdventureAppPrizes-Prod',
};

function surveyData() {
  users.forEach((e) => {
    e.surveys.forEach((s) => {
      if (survey_data[s.question]) {
        const index = survey_data[s.question].findIndex((q) => q.answer === s.answer);
        if (index !== -1) survey_data[s.question][index].count += 1;
        else survey_data[s.question].push({ answer: s.answer, count: 1 });
      } else survey_data[s.question] = [{ answer: s.answer, count: 1 }];
    });
  });

  let output = '';
  Object.keys(survey_data).forEach((e) => {
    output += `${e}, \n`;
    survey_data[e].forEach((el) => {
      if (el.answer) output += `${el.answer}, ${el.count},\n`;
    });
  });
  const stream = fs.createWriteStream('survey-data.csv', { flags: 'w' });
  stream.write(output);

  console.log(survey_data);
}

function outputChallengeCompleteTimesByUser() {
  telemetry.sort((f, s) => {
    if (f.date < s.date) return -1;
    if (f.date > s.date) return 1;
    return 0;
  });

  const answersids = ['id', ...answers.map((e) => `${e.id}`)];

  const user_challenge_complete_time: { [key: string]: ChallengeComplete[] } = {};

  telemetry.forEach((e) => {
    if (e.function_name === 'finish-challenge') {
      const body = JSON.parse(e.body);
      if (body.map === 'uoa') {
        const answer = answers.filter((c) => c.id === body.challenge_id).map((c) => c.solution);
        if (answer.includes(body.beacon_id)) {
          if (user_challenge_complete_time[e.user_id])
            user_challenge_complete_time[e.user_id].push({ challenge_id: body.challenge_id, time: e.date });
          else user_challenge_complete_time[e.user_id] = [{ challenge_id: body.challenge_id, time: e.date }];
        }
      }
    }
  });

  let output = '';

  // Get minimum and maximum time
  const min = Math.min(
    ...Object.keys(user_challenge_complete_time).map((id) =>
      Math.min(...user_challenge_complete_time[id].map((challenge) => challenge.time))
    )
  );
  const max = Math.max(
    ...Object.keys(user_challenge_complete_time).map((id) =>
      Math.max(...user_challenge_complete_time[id].map((challenge) => challenge.time))
    )
  );

  // Add header row of time
  for (let i = min; i < max; i += 1) output += `${i},`;
  output += '\n';

  fs.promises.appendFile('challenge-complete-time.csv', output);
  output = '';

  // For
  Object.keys(user_challenge_complete_time).forEach((key) => {
    output += `${key},`;
    for (let i = min; i < max; i += 1) {
      if (user_challenge_complete_time[key].map((challenge) => challenge.time).includes(i))
        output += `${user_challenge_complete_time[key].find((challenge) => challenge.time === i)!.challenge_id},`;
      else output += ',';
    }
    output += '\n';
    fs.promises.appendFile('challenge-complete-time.csv', output);
    output = '';
  });
}

function outputChallengeTimes() {
  telemetry.sort((f, s) => {
    if (f.date < s.date) return -1;
    if (f.date > s.date) return 1;
    return 0;
  });

  telemetry.forEach((e) => {
    if (e.function_name === 'start-challenge') {
      if (user_challenge_time[e.user_id]) {
        if (!user_challenge_time[e.user_id][user_challenge_time[e.user_id].length - 1].finish)
          user_challenge_time[e.user_id][user_challenge_time[e.user_id].length - 1].start = e.date;
        else user_challenge_time[e.user_id].push({ start: e.date, finish: undefined });
      } else user_challenge_time[e.user_id] = [{ start: e.date, finish: undefined }];
    }
    if (e.function_name === 'finish-challenge') {
      const body = JSON.parse(e.body);
      if (body.map === 'uoa') {
        const answer = answers.find((c) => c.id === body.challenge_id);
        if (answer && answer.solution === body.beacon_id) {
          let index = -1;
          if (user_challenge_time[e.user_id]) index = user_challenge_time[e.user_id].length - 1;
          if (index !== -1) user_challenge_time[e.user_id][index].finish = e.date;
        }
      }
    }
  });

  console.log(user_challenge_time);

  let output = '';
  Object.keys(user_challenge_time).forEach((e) => {
    user_challenge_time[e].forEach((el) => {
      if (el.finish) output += `${el.finish - el.start},\n`;
    });
  });
  const stream = fs.createWriteStream('challenge-time.csv', { flags: 'w' });
  stream.write(output);
}

function outputCompletedChallenges() {
  let challenges = 1;
  while (challenges <= 30) {
    const the_go = users.filter((e, i) => e.challenges.length === i).length;
    console.log(`${the_go} Users completed at least ${challenges} challenge.`);
    challenges += 1;
  }
}

function outputPrizes() {
  console.log(prizes);
  prizes.forEach((e) => {
    console.log('Wait');
    const d = Math.floor(Date.parse(e.received) / 86400000);
    if (prize_redeemed_time[d]) {
      if (prize_redeemed_time[d][e.type]) prize_redeemed_time[d][e.type] += 1;
      else prize_redeemed_time[d][e.type] = 1;
    } else {
      const data: { [key: string]: number } = {};
      data[e.type] = 1;
      prize_redeemed_time[d] = data;
    }
  });
  console.log(prize_redeemed_time);
}

function outputRegisters() {
  telemetry.forEach((e) => {
    if (e.function_name === 'register-user') {
      if (user_telemetry[Math.floor(e.date)]) user_telemetry[Math.floor(e.date)] += 1;
      else user_telemetry[Math.floor(e.date)] = 1;
    }
  });

  let output = '';

  Object.keys(user_telemetry).forEach((key) => {
    output += `${key},${user_telemetry[key]},\n`;
  });

  const stream = fs.createWriteStream('output.csv', { flags: 'w' });
  stream.write(output);
}

function displayStatistics() {
  console.log(`${users.length} Users.`);
  console.log(`${telemetry.length} Telemetry Entries.`);
  outputPrizes();
}

function onScanUsers(err: AWS.AWSError, data: ScanOutput) {
  if (err) console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
  else {
    if (!data.Items) {
      console.log('No items match filter.');
      return;
    }

    // This is dirty, but fuck it.
    users = data.Items.map((e) => ({
      id: e.id as string,
      challenges: e.challenges as number[],
      points: e.points as number,
      treasure: e.treasure as string[],
      surveys: e.surveys as { question: string; answer: string }[],
      campaign: e.campaign as string,
      prerequisite_challenges_completed: e.prerequisite_challenges_completed as number,
      beta: e.beta as boolean,
      prizes: e.prizes as string[],
    }));
    displayStatistics();
  }
}

function onScan(err: AWS.AWSError, data: ScanOutput) {
  if (err) console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
  else {
    if (!data.Items) {
      console.log('No items match filter.');
      return;
    }

    telemetry = telemetry.concat(
      data.Items.map((e) => ({
        id: e.id as string,
        body: e.body as string,
        date: e.date as number,
        function_name: e.function_name as string,
        headers: e.headers as string,
        parameters: e.parameters as string,
        user_id: e.user_id as string,
      }))
    );

    if (typeof data.LastEvaluatedKey !== 'undefined') {
      console.log('Scanning for more...');
      telemetryParams.ExclusiveStartKey = data.LastEvaluatedKey;
      doc_client.scan(telemetryParams, onScan);
    } else displayStatistics();
  }
}

function onPrizesScan(err: AWS.AWSError, data: ScanOutput) {
  if (err) console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
  else {
    if (!data.Items) {
      console.log('No items match filter.');
      return;
    }

    prizes = prizes.concat(
      data.Items.map((e) => ({
        id: e.id as string,
        received: e.received as string,
        received_from: e.received_from as string,
        redeemed: e.redeemed as boolean,
        type: e.type as string,
        user_id: e.user_id as string,
      }))
    );

    if (typeof data.LastEvaluatedKey !== 'undefined') {
      console.log('Scanning for more...');
      prizesParams.ExclusiveStartKey = data.LastEvaluatedKey;
      doc_client.scan(telemetryParams, onScan);
    }
  }
}

function run() {
  // Setup creds
  doc_client.scan(prizesParams, onPrizesScan);
  doc_client.scan(userParams, onScanUsers);
  // doc_client.scan(telemetryParams, onScan);
}

run();

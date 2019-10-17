/**
 * Writes the given json objects into our table
 */
import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { ScanOutput, ScanInput } from 'aws-sdk/clients/dynamodb';
import {
  DBMapCollection, DBMapInfo, DBBeacon, DBChallenge, DBSurveyCollection, DBPrizeTypeCollection, DBUser, DBPrize, DBTelemetry, DBTreasure, Location,
} from '../../src/_schemas';

const fs = require("fs");

const answers: [{ id: string; solution: string }] = JSON.parse(fs.readFileSync("C:/Users/russe/Documents/GitHub/adventure-app-services/scripts/Statistics/challenge_answers.json"));

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

let users: DBUser[] = [];
let telemetry: Telemetry[] = [];

const user_telemetry: { [key: string]: number } = {};

const user_challenge_time: { [key: string]: [{ start: number; finish?: number }] } = {};


const survey_data: { [key: string]: { answer: string; count: number }[] } = {};

const telemetryParams: ScanInput = {
  TableName: "AdventureAppTelemetry-Prod",
};
const userParams: ScanInput = {
  TableName: "AdventureAppUsers-Prod",
};

function surveyData() {
  users.forEach((e) => {
    e.surveys.forEach((s) => {
      if(survey_data[s.question]) {
        const index = survey_data[s.question].findIndex((q) => q.answer === s.answer);
        if(index !== -1)
          survey_data[s.question][index].count += 1;
        else
          survey_data[s.question].push({ answer: s.answer, count: 1 });
      }
      else
        survey_data[s.question] = [{ answer: s.answer, count: 1 }];
    });
  });

  let output = "";
  Object.keys(survey_data).forEach((e) => {
    output += `${e}, \n`;
    survey_data[e].forEach((el) => {
      if(el.answer)
        output += `${el.answer}, ${el.count},\n`;
    });
  });
  const stream = fs.createWriteStream("survey-data.csv", { flags: 'w' });
  stream.write(output);

  console.log(survey_data);
}

function outputChallengeCompleteTimesByUser() {
  telemetry.sort((f, s) => {
    if(f.date < s.date)
      return -1;
    if(f.date > s.date)
      return 1;
    return 0;
  });

  const answersids = ["id"].concat(answers.map((e) => `${e.id}`));

  const user_challenge_complete_time: { [key: string]: ChallengeComplete[] } = {};

  telemetry.forEach((e) => {
    if(e.function_name === "finish-challenge") {
      const body = JSON.parse(e.body);
      if(body.map === "uoa") {
        const answer = answers.filter((c) => c.id === body.challenge_id).map((c) => c.solution);
        if(answer.includes(body.beacon_id)) {
          if(user_challenge_complete_time[e.user_id])
            user_challenge_complete_time[e.user_id].push({ challenge_id: body.challenge_id, time: e.date });
          else
            user_challenge_complete_time[e.user_id] = [{ challenge_id: body.challenge_id, time: e.date }];
        }
      }
    }
  });

  let output = "";
  answersids.forEach((e) => {
    output += `${e},`;
  });
  output += "\n";

  Object.keys(user_challenge_complete_time).forEach((e) => {
    user_challenge_complete_time[e].sort((f, s) => {
      if(f.challenge_id < s.challenge_id)
        return -1;
      if(f.challenge_id > s.challenge_id)
        return 1;
      return 0;
    });

    output += `${e},`;
    answersids.forEach((a) => {
      console.log(answersids);
      console.log(user_challenge_complete_time[e].map((c) => c.challenge_id.toString()));
      if(user_challenge_complete_time[e].map((c) => c.challenge_id.toString()).includes(a)) {
        output += `${user_challenge_complete_time[e].find((c) => {
          console.log(`${c.challenge_id.toString()} - ${a}`);
          return c.challenge_id.toString() === a;
        })!.time},`;
        user_challenge_complete_time[e].filter((r) => r.toString() !== a);
      }
      else
        output += ',';
    });
    output += "\n";
  });
  const stream = fs.createWriteStream("challenge-complete-time.csv", { flags: 'w' });
  stream.write(output);
}

function outputChallengeTimes() {
  telemetry.sort((f, s) => {
    if(f.date < s.date)
      return -1;
    if(f.date > s.date)
      return 1;
    return 0;
  });

  telemetry.forEach((e) => {
    if(e.function_name === "start-challenge") {
      if(user_challenge_time[e.user_id]) {
        if(!user_challenge_time[e.user_id][user_challenge_time[e.user_id].length - 1].finish)
          user_challenge_time[e.user_id][user_challenge_time[e.user_id].length - 1].start = e.date;
        else
          user_challenge_time[e.user_id].push({ start: e.date, finish: undefined });
      }
      else
        user_challenge_time[e.user_id] = [{ start: e.date, finish: undefined }];
    }
    if(e.function_name === "finish-challenge") {
      const body = JSON.parse(e.body);
      if(body.map === "uoa") {
        const answer = answers.find((c) => c.id === body.challenge_id);
        if(answer && answer.solution === body.beacon_id) {
          let index = -1;
          if(user_challenge_time[e.user_id])
            index = user_challenge_time[e.user_id].length - 1;
          if(index !== -1)
            user_challenge_time[e.user_id][index].finish = e.date;
        }
      }
    }
  });

  console.log(user_challenge_time);

  let output = "";
  Object.keys(user_challenge_time).forEach((e) => {
    user_challenge_time[e].forEach((el) => {
      if(el.finish)
        output += `${el.finish - el.start},\n`;
    });
  });
  const stream = fs.createWriteStream("challenge-time.csv", { flags: 'w' });
  stream.write(output);
}

function outputCompletedChallenges() {
  let num = 0;
  let challenges = 1;
  while(challenges <= 30) {
    const the_go = users.filter((e) => e.challenges.length === num).length;
    console.log(`${the_go} Users completed at least ${challenges} challenge.`);
    num++;
    challenges++;
  }
}

function outputRegisters() {
  telemetry.forEach((e) => {
    if(e.function_name === "register-user") {
      if(user_telemetry[Math.floor(e.date)])
        user_telemetry[Math.floor(e.date)] += 1;
      else
        user_telemetry[Math.floor(e.date)] = 1;
    }
  });

  let output = "";

  Object.keys(user_telemetry).forEach((key) => {
    output += `${key},${user_telemetry[key]},\n`;
  });

  const stream = fs.createWriteStream("output.csv", { flags: 'w' });
  stream.write(output);
}

function onScanUsers(err: AWSError, data: ScanOutput) {
  if(err)
    console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
  else {
    if(!data.Items) {
      console.log("No items match filter.");
      return;
    }

    // This is dirty, but fuck it.
    users = data.Items.map((e) => ({
      id: e.id as string, challenges: e.challenges as number[], points: e.points as number, treasure: e.treasure as string[], surveys: e.surveys as { question: string; answer: string }[], campaign: e.campaign as string, prerequisite_challenges_completed: e.prerequisite_challenges_completed as number, beta: e.beta as boolean, prizes: e.prizes as string[],
    }));
  }
}

function displayStatistics() {
  console.log(`${users.length} Users.`);
  console.log(`${telemetry.length} Telemetry Entries.`);

  outputChallengeCompleteTimesByUser();
}

function onScan(err: AWSError, data: ScanOutput) {
  if(err)
    console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
  else {
    if(!data.Items) {
      console.log("No items match filter.");
      return;
    }

    telemetry = telemetry.concat(data.Items.map((e) => ({
      id: e.id as string, body: e.body as string, date: e.date as number, function_name: e.function_name as string, headers: e.headers as string, parameters: e.parameters as string, user_id: e.user_id as string,
    })));

    if(typeof data.LastEvaluatedKey !== "undefined") {
      console.log("Scanning for more...");
      telemetryParams.ExclusiveStartKey = data.LastEvaluatedKey;
      doc_client.scan(telemetryParams, onScan);
    }
    else
      displayStatistics();
  }
}


function run() {
  // Setup creds
  doc_client.scan(userParams, onScanUsers);
  doc_client.scan(telemetryParams, onScan);
}


run();

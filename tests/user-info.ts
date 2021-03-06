import Amplify from '@aws-amplify/core';
import Auth from '@aws-amplify/auth';
import Global = NodeJS.Global;

export interface GlobalWithCognitoFix extends Global {
  fetch: unknown;
}
declare const global: GlobalWithCognitoFix;
global.fetch = require('node-fetch');

interface User {
  username: string;
  password: string;
}

export const users = [
  {
    id: '3f7b3226-8417-4e8b-9879-3a64fcb475bd',
    username: 'TestUser1@shwoop.co.nz',
    password: 'crematorium',
  },
  {
    id: '6747ce61-ca1e-49ab-91b1-ad73adc4ee84',
    username: 'TestUser2@shwoop.co.nz',
    password: 'crematorium',
  },
];

Amplify.configure({
  identityPoolId: 'ap-southeast-2:047ec1b5-ba51-418a-8bae-c611d6d0b6d6',

  // REQUIRED - Amazon Cognito Region
  region: 'ap-southeast-2',

  // OPTIONAL - Amazon Cognito User Pool ID
  userPoolId: 'ap-southeast-2_UyvhAfzW8',

  // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
  userPoolWebClientId: '2ndspb2tklk4tna7uecb6moooh',
});

export async function get_jwt_token(user: User) {
  const signin = await Auth.signIn(user.username, user.password);

  // TODO: Ensure there are no challenges.

  const authToken = (await Auth.currentSession()).getAccessToken();
  return authToken.getJwtToken();
}

import Amplify from '@aws-amplify/core';
import Auth from '@aws-amplify/auth';

interface User {
  username: string;
  password: string;
}

export const users = [
  {
    username: 'TestUser1@shwoop.co.nz',
    password: 'fremantle',
  },
  {
    username: 'TestUser2@shwoop.co.nz',
    password: 'crematorium',
  },
];

Amplify.configure({
  Auth: {
    // REQUIRED - Amazon Cognito Region
    region: 'ap-southeast-2',

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: 'ap-southeast-2_UyvhAfzW8',

    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: '2ndspb2tklk4tna7uecb6moooh',
  },
});

const config = Auth.configure({});

export async function get_jwt_token(user: User) {
  const signin = await Auth.signIn(user.username, user.password);

  // TODO: Ensure there are no challenges.

  const authToken = (await Auth.currentSession()).getAccessToken();
  return authToken.getJwtToken();
}

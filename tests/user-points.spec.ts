import { get_jwt_token, users } from './user-info';
import fetch from 'node-fetch';

const base = process.env.API_URL ?? 'http://127.0.0.1:3000';

describe('GET /users', () => {
  let user_1_token: string = '';
  let user_2_token: string = '';

  beforeAll(async () => {
    user_1_token = await get_jwt_token(users[0]);
    user_2_token = await get_jwt_token(users[1]);
  });

  it("can access user's points", async () => {
    const response = await fetch(`${base}/users?attributes[]=points`, {
      method: 'post',
      headers: {
        Authorization: user_1_token,
      },
    });

    expect(response.status).toEqual(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body[0]).toHaveProperty('points');
  });
});

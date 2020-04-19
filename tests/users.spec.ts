import { get_jwt_token, users } from './user-info';
import fetch from 'node-fetch';

const base = process.env.API_URL ?? 'http://127.0.0.1:3000';

describe('/users', () => {
  let user_1_token: string = '';
  let user_2_token: string = '';

  beforeAll(async () => {
    user_1_token = await get_jwt_token(users[0]);
    user_2_token = await get_jwt_token(users[1]);
  });

  it('Can register a user', async () => {
    const response = await fetch(`${base}/users/${users[0].id}`, {
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + user_1_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign: 'uoa',
        beta: false,
      }),
    });

    expect(response.status).toEqual(200);
    const body = await response.json();
    expect(typeof body).toEqual(typeof {});
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('campaign');
    expect(body).toHaveProperty('beta');
    expect(body.campaign).toEqual('uoa');
    expect(body.beta).toEqual(false);
  });

  it("Can access user's points", async () => {
    const response = await fetch(`${base}/users?attributes[]=points`);

    expect(response.status).toEqual(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body[0]).toHaveProperty('points');
  });
});

import { } from 'mocha';
import { expect } from 'chai';
import fetch from 'node-fetch';


const base = 'http://127.0.0.1:3000';
const userid = 'sampleUsername3';

describe('Users', () => {
  // We need to do users first so we can get stuff like prizes
  // Register User Success
  it('Should PUT to register /users/{userid}/', async () => {
    const response = await fetch(`${base}/users/${userid}`, { method: 'PUT' });
    expect(response.status).to.equal(201);
  });
  // Register existing user conflict
  it('Should fail to register /users/{userid}/', async () => {
    const response = await fetch(`${base}/users/${userid}`, { method: 'PUT' });
    expect(response.status).to.equal(409);
  });

  // Get User success
  it('Should GET /users/{userid}/', async () => {
    const response = await fetch(`${base}/users/${userid}`);
    const body = await response.json();
    expect(body).to.have.property('id');
    expect(body).to.have.property('points');
    expect(body).to.have.property('surveys');
    expect(body).to.have.property('prizes');
    expect(body).to.have.property('treasure');
  });
  // Get user invalid userid
  it('Should fail to GET /users/dfgsdfgasfasfgsafg/', async () => {
    const response = await fetch(`${base}/users/dfgsdfgasfasfgsafg/`);
    expect(response.status).to.equal(404);
  });

  // User's Prizes Success
  it('Should GET /users/{userid}/prizes', async () => {
    const response = await fetch(`${base}/users/${userid}/prizes`);
    const body = await response.json();
    expect(body).to.have.property('points');
    expect(body).to.have.property('prizes');
  });
  // User's Prizes Invalid UserID
  it('Should fail to GET /users/{userid}/prizes', async () => {
    const response = await fetch(`${base}/users/sdfjnsfdkjnsdfkjn/prizes`);
    expect(response.status).to.equal(404);
  });

  // Challenge data


  // Invalidate the user
  it('Should fail to post to /users/{userid}/challenge/finish', async () => {
    const challengeBody = {
      beacon_id: '0000_0001',
      challenge_id: 'puzzle-uoa-beacon-0000_0000',
      map: 'uoa',
    };
    const response = await fetch(`${base}/users/dsfgasfgsfgsfdgasdfgdfasfd/challenge/finish`, {
      method: 'post',
      body: JSON.stringify(challengeBody),
    });
    expect(response.status).to.equal(404);
  });

  // Complete a challenge
  it('Should POST to /users/{userid}/challenge/finish', async () => {
    const challengeBody = {
      beacon_id: '0000_0001',
      challenge_id: 'puzzle-uoa-beacon-0000_0000',
      map: 'uoa',
    };
    const response = await fetch(`${base}/users/${userid}/challenge/finish`, {
      method: 'POST',
      body: JSON.stringify(challengeBody),
    });
    const body = await response.json();
    expect(response.status).to.equal(200);
    expect(body).to.have.property('id');
    expect(body).to.have.property('type');
    expect(body).to.have.property('received');
    expect(body).to.have.property('received_from');
    expect(body).to.have.property('claimed');
    expect(body).to.have.property('user_id');
  });

  // Invalidate the solution
  // challengeBody.beacon_id = "FFFF_FFFF";
  it('Should fail to post to /users/{userid}/challenge/finish', async () => {
    const challengeBody = {
      beacon_id: 'FFFF_FFFF',
      challenge_id: 'puzzle-uoa-beacon-0000_0000',
      map: 'uoa',
    };
    const response = await fetch(`${base}/users/${userid}/challenge/finish`, {
      method: 'POST',
      body: JSON.stringify(challengeBody),
    });
    expect(response.status).to.equal(404);
  });

  // Invalidate the challenge
  // challengeBody.challenge_id = "aojsndoansdasodna"
  it('Should fail to post to /users/{userid}/challenge/finish', async () => {
    const challengeBody = {
      beacon_id: '0000_0001',
      challenge_id: 'adfgfsnjdhsdjknfjgnfjg',
      map: 'uoa',
    };
    const response = await fetch(`${base}/users/${userid}/challenge/finish`, {
      method: 'POST',
      body: JSON.stringify(challengeBody),
    });
    expect(response.status).to.equal(400);
  });
});

describe('Prizes', () => {
  it('Should fail to GET /redemption-codes/dnfjsdnfd', async () => {
    const response = await fetch(`${base}/redemption-codes/dnfjsdnfd`, { method: 'POST' });
    expect(response.status).to.equal(404);
  });
});

// Clear all data related to this user.

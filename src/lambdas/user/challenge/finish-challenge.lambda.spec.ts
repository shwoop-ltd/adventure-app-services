import { Persistence } from '../../../core/persistence';
import { finish_challenge } from './finish-challenge.lambda';
import { ApiRequest } from '../../-helpers/request-handler';

describe('finish_challenge functions correctly', () => {
  beforeAll(() => {});

  const user = {
    id: '1234',
    campaign: 'uoa',
    points: 100,
    prizes: [],
    challenges: [],
    prerequisite_challenges_completed: 0,
  };

  const user_success = {
    id: '1234',
    campaign: 'uoa',
    points: 250,
    prizes: ['prize_id'],
    challenges: [1],
    prerequisite_challenges_completed: 1,
  };

  const challenge = {
    claimed: 0,
    id: 'challenge-uoa-1',
    points: 150,
    prizes: [
      {
        available: 200,
        prize: 'redbull-can',
      },
    ],
    solution: {
      latitude: 12,
      longitude: 21,
    },
    text: '0000_0001',
    radius: 100,
  };

  const challenge_success = {
    claimed: 1,
    id: 'challenge-uoa-1',
    points: 150,
    prizes: [
      {
        available: 200,
        prize: 'redbull-can',
      },
    ],
    solution: {
      latitude: 12,
      longitude: 21,
    },
    text: '0000_0001',
    radius: 100,
  };

  const map = {
    id: 'map-uoa',
    challenges: [
      {
        id: 1,
        location: {
          latitude: -36.853088,
          longitude: 174.768,
        },
        is_prerequisite: true,
      },
    ],
  };

  const Model = jest.fn<Persistence, []>(
    () =>
      (({
        user: {
          put: jest.fn(),
          get: jest.fn(() => Promise.resolve(user)),
        },
        challenge: {
          get: jest.fn(() => Promise.resolve(challenge)),
          put: jest.fn(),
        },
        telemetry: {
          create: jest.fn(),
        },
        map: {
          get: jest.fn(() => Promise.resolve(map)),
        },
        prize: {
          create: jest.fn(() => Promise.resolve({ id: 'prize_id' })),
        },
      } as unknown) as Persistence)
  );

  it('Should not complete if user not within 50 meters', async () => {
    const event: ApiRequest = ({
      authorizer: { claims: { sub: 1234 } },
      path: { user_id: 1234 },
      // Note 0.0005 degrees is just over 55 meters
      body: JSON.stringify({ challenge_id: 1, map: 'uoa', location: { latitude: '12.0005', longitude: '21' } }),
    } as unknown) as ApiRequest;

    const persistence = new Model();
    const response = await finish_challenge(event, persistence);
    expect(persistence.user.put).toBeCalledTimes(0);
    expect(persistence.prize.create).toBeCalledTimes(0);
    expect(persistence.challenge.put).toBeCalledTimes(0);
    expect(response.code).toEqual(204);
  });

  it('Should complete if user is within 50 meters', async () => {
    const event: ApiRequest = ({
      authorizer: { claims: { sub: 1234 } },
      path: { user_id: 1234 },
      // Note 0.0004 degrees is just under 49 meters
      body: JSON.stringify({ challenge_id: 1, map: 'uoa', location: { latitude: '12.00044', longitude: '21' } }),
    } as unknown) as ApiRequest;

    const persistence = new Model();
    const response = await finish_challenge(event, persistence);
    expect(persistence.user.put).toBeCalledWith(user_success);
    expect(persistence.prize.create).toBeCalledWith(1234, 'redbull-can', 'challenge', undefined, {
      latitude: -36.853088,
      longitude: 174.768,
    });
    expect(persistence.challenge.put).toBeCalledWith(challenge_success);
    expect(response.code).toEqual(200);
  });

  it('Should not complete if user has already completed', async () => {
    let user = {
      id: '1234',
      campaign: 'uoa',
      points: 100,
      prizes: [],
      challenges: [1],
      prerequisite_challenges_completed: 0,
    };

    const event: ApiRequest = ({
      authorizer: { claims: { sub: 1234 } },
      path: { user_id: 1234 },
      // Note 0.0004 degrees is just under 49 meters
      body: JSON.stringify({ challenge_id: 1, map: 'uoa', location: { latitude: '12.00044', longitude: '21' } }),
    } as unknown) as ApiRequest;

    const persistence = new Model();
    const response = await finish_challenge(event, persistence);
    expect(persistence.user.put).toBeCalledTimes(0);
    expect(persistence.prize.create).toBeCalledTimes(0);
    expect(persistence.challenge.put).toBeCalledTimes(0);
    expect(response.code).toEqual(403);
    expect(response.body).toEqual('Challenge already completed.');
  });
});

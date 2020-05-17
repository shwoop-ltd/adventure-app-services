import { Persistence } from '../../core/persistence';
import { get_users } from './get-users.lambda';
import { ApiRequest } from '../-helpers/request-handler';

describe('get_all', () => {
  const users = [
    {
      id: '123',
      campaign: 'uoa',
      points: 100,
      prizes: [],
      challenges: [],
      prerequisite_challenges_completed: 0,
    },
    {
      id: '100',
      points: 123,
      campaign: 'uoa',
      prizes: [],
      challenges: [],
      prerequisite_challenges_completed: 0,
    },
  ];

  const attributesWhiteList = ['id', 'campaign', 'points', 'prizes', 'challenges', 'prerequisite_challenges_completed'];

  const Model = jest.fn<Persistence, []>(
    () =>
      (({
        user: {
          get_all: jest.fn(() => Promise.resolve(users)),
        },
        telemetry: {
          create: jest.fn(),
        },
      } as unknown) as Persistence)
  );

  it('Should not access attributes not in white list', async () => {
    const event: ApiRequest = ({ query: { attributes: ['id', 'beta'] } } as unknown) as ApiRequest;
    const persistence = new Model();
    const response = await get_users(event, persistence);

    expect(persistence.user.get_all).toBeCalledTimes(0);
    expect(response.code).toEqual(401);
    expect(response.body).toEqual('Cannot access requested attribute');
  });

  it('Can get id and points', async () => {
    const event: ApiRequest = ({ query: { attributes: ['id', 'points'] } } as unknown) as ApiRequest;
    const persistence = new Model();
    const response = await get_users(event, persistence);

    expect(persistence.user.get_all).toBeCalledWith(['id', 'points']);
    expect(response.code).toEqual(200);
    expect(response.body).toEqual(users);
  });

  it('Will return all attributes in white list if no attributes are passed', async () => {
    const event: ApiRequest = ({ query: {} } as unknown) as ApiRequest;
    const persistence = new Model();
    const response = await get_users(event, persistence);

    expect(persistence.user.get_all).toBeCalledWith(attributesWhiteList);
    expect(response.code).toEqual(200);
    expect(response.body).toEqual(users);
  });
});

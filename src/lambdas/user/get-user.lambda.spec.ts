import * as td from 'testdouble';

import { suiteName } from '../../utils/suite-name';

import { get_user } from './get-user.lambda';
import Persistence from '../../persistence';
import { User } from '../../persistence/models/users';

const userId = '1';

const event = {
  path: { user_id: userId },
  query: {},
  headers: {},
  body: null,
  authorizer: { claims: { sub: userId } },
};

describe(suiteName(__dirname, __filename), () => {
  const db = td.object<Persistence>();
  const user = td.object<User>();

  beforeEach(() => td.reset());

  describe('rank', () => {
    beforeEach(() => {
      user.id = userId;
      user.points = 400;
    });

    it('returns 1 if the user is the only user', async () => {
      td.when(db.user.get(userId)).thenResolve(user);
      td.when(db.user.get_all(['id', 'points'])).thenResolve([{ id: userId, points: 400 }]);

      const { body } = (await get_user(event, db)) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(body.lifetimeRank).toBe(1);
    });

    it('returns 2 if the user is the middle user of 3', async () => {
      td.when(db.user.get(userId)).thenResolve(user);
      td.when(db.user.get_all(['id', 'points'])).thenResolve([
        { id: userId, points: 400 },
        { id: '2', points: 200 },
        { id: '3', points: 600 },
      ]);

      const { body } = (await get_user(event, db)) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(body.lifetimeRank).toBe(2);
    });
  });
});

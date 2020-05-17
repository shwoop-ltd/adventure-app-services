import * as td from 'testdouble';

import { suiteName } from '../../../utils/suite-name';

import { start_challenge } from './start-challenge.lambda';
import { Persistence } from '../../../core/persistence';
import { Map } from '../../../core/models/maps';
import { User } from '../../../core/models/users';

const userId = '1';
const mapId = '2';
const challengeId = 3;

const event = {
  path: {
    user_id: userId,
    map: mapId,
    challenge_id: String(challengeId),
  },
  query: {},
  headers: {},
  body: null,
  authorizer: { claims: { sub: userId } },
};

describe(suiteName(__dirname, __filename), () => {
  const db = td.object<Persistence>();
  const map = td.object<Map>();
  const challenge = td.object<Map>();
  const marker1 = td.object<Map['challenges'][0]>();
  const marker2 = td.object<Map['challenges'][0]>();
  const user = td.object<User>();

  beforeEach(() => td.reset());

  it('always logs telemetry', async () => {
    await start_challenge(event, db);

    td.verify(db.telemetry.create('start-challenge', userId));
  });

  describe('failures', () => {
    beforeEach(() => {
      map.challenges = [marker1];
      marker2.id = challengeId;
      marker2.prerequisites = undefined;
      marker2.active_date = undefined;
      marker2.release_date = undefined;
      marker2.end_date = undefined;
      user.prerequisite_challenges_completed = 1;
    });

    it('fails if the challenge is not found', async () => {
      // td.when(db.map.get(mapId)).thenResolve(map);

      const { body } = await start_challenge(event, db);

      expect(body).toBe('No challenge with that ID.');
    });

    it('fails if the map is not found', async () => {
      td.when(db.challenge.get(mapId, String(challengeId))).thenResolve(challenge);

      const { body } = await start_challenge(event, db);

      expect(body).toBe('Map 2 not found');
    });

    it('fails if the marker is not found', async () => {
      td.when(db.map.get(mapId)).thenResolve(map);
      td.when(db.challenge.get(mapId, String(challengeId))).thenResolve(challenge);

      const { body } = await start_challenge(event, db);

      expect(body).toBe('Marker 3 does not exist');
    });

    it('fails if challenge has prereqs and the user is not found', async () => {
      td.when(db.map.get(mapId)).thenResolve(map);
      td.when(db.challenge.get(mapId, String(challengeId))).thenResolve(challenge);

      marker2.prerequisites = 2;
      map.challenges.push(marker2);

      const { body } = await start_challenge(event, db);

      expect(body).toBe('User not found');
    });

    it(`fails if challenge has prereqs and the user hasn't got them`, async () => {
      td.when(db.map.get(mapId)).thenResolve(map);
      td.when(db.challenge.get(mapId, String(challengeId))).thenResolve(challenge);
      td.when(db.user.get(userId)).thenResolve(user);

      marker2.prerequisites = 2;
      map.challenges.push(marker2);

      const { body } = await start_challenge(event, db);

      expect(body).toBe('Prerequisite challenges not completed');
    });

    it(`fails if challenge has an active date in the future`, async () => {
      td.when(db.map.get(mapId)).thenResolve(map);
      td.when(db.challenge.get(mapId, String(challengeId))).thenResolve(challenge);

      map.challenges.push(marker2);
      marker2.active_date = Date.now() / 1000 + 100;
      marker2.end_date = Date.now() / 1000 + 200;

      const { body } = await start_challenge(event, db);

      expect(body).toBe('This challenge is not available right now');
    });

    it(`fails if challenge has a release date in the future`, async () => {
      td.when(db.map.get(mapId)).thenResolve(map);
      td.when(db.challenge.get(mapId, String(challengeId))).thenResolve(challenge);

      map.challenges.push(marker2);
      marker2.release_date = Date.now() / 1000 + 100;
      marker2.end_date = Date.now() / 1000 + 200;

      const { body } = await start_challenge(event, db);

      expect(body).toBe('This challenge is not available right now');
    });

    it(`fails if challenge has passed`, async () => {
      td.when(db.map.get(mapId)).thenResolve(map);
      td.when(db.challenge.get(mapId, String(challengeId))).thenResolve(challenge);

      map.challenges.push(marker2);
      marker2.active_date = Date.now() / 1000 - 200;
      marker2.end_date = Date.now() / 1000 - 100;

      const { body } = await start_challenge(event, db);

      expect(body).toBe('This challenge is not available right now');
    });
  });

  describe('success', () => {
    beforeEach(() => {
      td.when(db.map.get(mapId)).thenResolve(map);
      td.when(db.challenge.get(mapId, String(challengeId))).thenResolve(challenge);
      td.when(db.user.get(userId)).thenResolve(user);

      user.prerequisite_challenges_completed = 5;
      map.challenges = [marker1, marker2];
      marker2.id = challengeId;
      marker2.prerequisites = undefined;
      marker2.active_date = undefined;
      marker2.release_date = undefined;
      marker2.end_date = undefined;
    });

    it('succeeds if there are no prerequisites', async () => {
      const { body } = await start_challenge(event, db);

      // We're using this as a proxy for the operation having succeeded
      expect(body).toHaveProperty('image_url');
    });

    it('succeeds if the prerequisites have been met', async () => {
      marker2.prerequisites = 2;

      const { body } = await start_challenge(event, db);

      expect(body).toHaveProperty('image_url');
    });

    it('succeeds if the challenge has an active date in the past but no end date', async () => {
      marker2.active_date = Date.now() / 1000 - 100;

      const { body } = await start_challenge(event, db);

      expect(body).toHaveProperty('image_url');
    });

    it('succeeds if the challenge has a release date in the past but no end date', async () => {
      marker2.release_date = Date.now() / 1000 - 100;

      const { body } = await start_challenge(event, db);

      expect(body).toHaveProperty('image_url');
    });

    it('succeeds if the challenge has an end date in the future but no active or release date', async () => {
      marker2.end_date = Date.now() / 1000 + 100;

      const { body } = await start_challenge(event, db);

      expect(body).toHaveProperty('image_url');
    });
  });
});

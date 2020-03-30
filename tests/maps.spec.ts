import fetch from 'node-fetch';

const base = process.env.API_URL ?? 'http://127.0.0.1:3000';

describe('Maps', () => {
  // The name of a found map that can be used for further testing.
  let found_map_name: string | undefined;

  it('Should GET /maps', async () => {
    const response = await fetch(`${base}/maps`);
    expect(response.status).toEqual(200);

    const body = await response.json();
    expect(Array.isArray(body)).toEqual(true);

    if (body.length === 0) {
      console.warn('Couldnt test more about /maps, as no maps were given.');
      return;
    }

    const map = body[0];
    found_map_name = map.name;

    expect(map).toHaveProperty('name');
    expect(typeof map.name).toEqual(typeof '');
    expect(map).toHaveProperty('area');
    expect(Array.isArray(map.area)).toEqual(true);

    if (map.area.length === 0) {
      console.warn('Warning, map length is not ');
      return;
    }

    expect(map.area[0]).toHaveProperty('latitude');
    expect(typeof map.area[0].latitude).toEqual(typeof 1.0);
    expect(map.area[0]).toHaveProperty('longitude');
    expect(typeof map.area[0].longitude).toEqual(typeof 1.0);
  }, 15000);

  it('Should GET /maps/{id}', async () => {
    if (!found_map_name) {
      console.warn('No specific map found to test.');
      return;
    }

    const response = await fetch(`${base}/maps/${found_map_name}`);
    expect(response.status).toEqual(200);

    const map = await response.json();
    expect(map).toHaveProperty('next_release');
    expect(map).toHaveProperty('challenges');
    expect(Array.isArray(map.challenges)).toEqual(true);

    if (map.challenges.length > 0) {
      const challenge = map.challenges[0];
      expect(challenge).toHaveProperty('id');
      expect(challenge).toHaveProperty('location');

      expect(typeof challenge.location.latitude).toEqual(typeof 1.0);
      expect(typeof challenge.location.longitude).toEqual(typeof 1.0);
    } else console.warn('No challenges on this map to validate');

    expect(map).toHaveProperty('events');
    expect(Array.isArray(map.events)).toEqual(true);

    if (map.events.length > 0) {
      const event = map.events[0];
      expect(event).toHaveProperty('description');
      expect(typeof event.description).toEqual(typeof '');
      expect(event).toHaveProperty('location');
      expect(typeof event.location.latitude).toEqual(typeof 1.0);
      expect(typeof event.location.longitude).toEqual(typeof 1.0);
    } else console.warn('No challenges on this map to validate');
  }, 15000);

  it('Should fail to GET /maps/this_map_doesnt_exist', async () => {
    const response = await fetch(`${base}/maps/this_map_doesnt_exist`);
    expect(response.status).toEqual(404);
  }, 15000);
});

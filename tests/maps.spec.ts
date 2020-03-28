import { } from 'mocha';
import { expect } from 'chai';
import fetch from 'node-fetch';

const base = process.env.API_URL ?? 'http://127.0.0.1:3000';

describe('Maps', () => {
  // The name of a found map that can be used for further testing.
  let found_map_name: string | undefined;

  it('Should GET /maps', async () => {
    const response = await fetch(`${base}/maps`);
    expect(response.status).to.equal(200);

    const body = await response.json();
    expect(Array.isArray(body)).to.equal(true);

    if(body.length === 0) {
      console.warn('Couldnt test more about /maps, as no maps were given.');
      return;
    }

    const map = body[0];
    found_map_name = map.name;

    expect(map).to.be.an('object');
    expect(map).to.have.property('name');
    expect(map.name).to.be.a(typeof '');
    expect(map).to.have.property('area');
    expect(Array.isArray(map.area)).to.equal(true);

    if(map.area.length === 0) {
      console.warn('Warning, map length is not ');
      return;
    }

    expect(map.area[0]).to.have.property('latitude');
    expect(map.area[0].latitude).to.be.a(typeof 1.0);
    expect(map.area[0]).to.have.property('longitude');
    expect(map.area[0].longitude).to.be.a(typeof 1.0);
  });

  it('Should GET /maps/{id}', async () => {
    if(!found_map_name) {
      console.warn('No specific map found to test.');
      return;
    }

    const response = await fetch(`${base}/maps/${found_map_name}`);
    expect(response.status).to.equal(200);

    const map = await response.json();
    expect(map).to.have.property('next_release');
    expect(map).to.have.property('challenges');
    expect(Array.isArray(map.challenges)).to.equal(true);

    if(map.challenges.length > 0) {
      const challenge = map.challenges[0];
      expect(challenge).to.have.property('id');
      expect(challenge).to.have.property('location');

      expect(challenge.location.latitude).to.be.a(typeof 1.0);
      expect(challenge.location.longitude).to.be.a(typeof 1.0);
    }
    else
      console.warn('No challenges on this map to validate');

    expect(map).to.have.property('events');
    expect(Array.isArray(map.events)).to.equal(true);

    if(map.events.length > 0) {
      const event = map.events[0];
      expect(event).to.have.property('description');
      expect(event.description).to.be.a(typeof '');
      expect(event).to.have.property('location');
      expect(event.location.latitude).to.be.a(typeof 1.0);
      expect(event.location.longitude).to.be.a(typeof 1.0);
    }
    else
      console.warn('No challenges on this map to validate');
  });

  it('Should fail to GET /maps/this_map_doesnt_exist', async () => {
    const response = await fetch(`${base}/maps/this_map_doesnt_exist`);
    expect(response.status).to.equal(404);
  });
});

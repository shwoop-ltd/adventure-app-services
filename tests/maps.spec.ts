import { } from 'mocha';
import { expect } from 'chai';
import fetch from 'node-fetch';

const base = "http://127.0.0.1:3000";

describe('Maps', () => {
  it("Should GET /maps", async () => {
    const response = await fetch(`${base}/maps`);
    expect(response.status).to.equal(200);

    const body = await response.json();
    expect(body).to.be.an('Array');
    const uoa = body.find((item: any) => item.name === "uoa");

    expect(uoa).to.exist;
    expect(uoa).to.have.property('image_url');
    expect(uoa).to.have.property('top_left');
    expect(uoa).to.have.property('bottom_right');

    //Check that the coordinates are present
    expect(uoa.top_left).to.have.property('latitude');
    expect(uoa.top_left).to.have.property('longitude');
    expect(uoa.bottom_right).to.have.property('latitude');
    expect(uoa.bottom_right).to.have.property('longitude');
  });

  it("Should GET /maps/uoa", async () => {
    const response = await fetch(`${base}/maps/uoa`);
    expect(response.status).to.equal(200);

    const map = await response.json();
    expect(map).to.have.property('next_release');
    expect(map).to.have.property('markers');
    expect(map.markers[0]).to.have.property('id');
    expect(map.markers[0]).to.have.property('name');
    expect(map.markers[0]).to.have.property('release');
    expect(map.markers[0]).to.have.property('location');

    expect(map.markers[0].location).to.have.property('latitude');
    expect(map.markers[0].location).to.have.property('longitude');
  });

  it("Should fail to GET /maps/this_map_doesnt_exist", async () => {
    const response = await fetch(`${base}/maps/this_map_doesnt_exist`);
    expect(response.status).to.equal(404);
  });

  it("Should GET /maps/uoa/beacon/0000_0000", async () => {
    const response = await fetch(`${base}/maps/uoa/beacon/0000_0000`);
    expect(response.status).to.equal(200);

    const beacon = await response.json();

    expect(beacon).to.have.property("id");
    expect(beacon).to.have.property("beacon_type");
  });

  it("Should fail to GET /maps/asdasd/beacon/0000_0000", async () => {
    const response = await fetch(`${base}/maps/this_map_doesnt_exist`);
    expect(response.status).to.equal(404);
  });

  it("Should fail to GET /maps/uoa/beacon/FFFF_FFFF", async () => {
    const response = await fetch(`${base}/maps/this_map_doesnt_exist`);
    expect(response.status).to.equal(404);
  });
});

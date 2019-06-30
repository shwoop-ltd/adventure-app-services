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
  });

  it("Should GET /maps/uoa", async () => {
    const response = await fetch(`${base}/maps/uoa`);
    expect(response.status).to.equal(200);

    const body = await response.json();
    expect(body).to.have.property('markers');
    expect(body.markers).to.be.an('Array');
    expect(body.markers[0]).to.have.property('id');
    expect(body.markers[0]).to.have.property('location');
  });

  it("Should fail to GET /maps/this_map_doesnt_exist", async () => {
    const response = await fetch(`${base}/maps/this_map_doesnt_exist`);
    expect(response.status).to.equal(404);
  });
});

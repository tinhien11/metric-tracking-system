process.env.NODE_ENV = 'test';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const db  = require('../src/db/database');

// Helpers
const post  = (body) => request(app).post('/metrics').send(body);
const get   = (q)    => request(app).get(`/metrics?${q}`);
const chart = (q)    => request(app).get(`/metrics/chart?${q}`);

const TODAY      = new Date().toISOString().split('T')[0];
const YESTERDAY  = new Date(Date.now() - 86400000).toISOString().split('T')[0];

beforeEach(() => db.exec('DELETE FROM metrics'));

// ---------------------------------------------------------------------------
describe('POST /metrics', () => {
  it('creates a distance metric', async () => {
    const res = await post({ userId: 'u1', type: 'distance', date: TODAY, value: 100, unit: 'meter' });
    assert.equal(res.status, 201);
    assert.equal(res.body.value, 100);
    assert.equal(res.body.unit, 'meter');
  });

  it('creates a temperature metric', async () => {
    const res = await post({ userId: 'u1', type: 'temperature', date: TODAY, value: 37, unit: 'C' });
    assert.equal(res.status, 201);
    assert.equal(res.body.value, 37);
    assert.equal(res.body.unit, 'C');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await post({ userId: 'u1' });
    assert.equal(res.status, 400);
  });

  it('returns 400 for invalid type', async () => {
    const res = await post({ userId: 'u1', type: 'speed', date: TODAY, value: 10, unit: 'meter' });
    assert.equal(res.status, 400);
  });

  it('returns 400 for invalid unit', async () => {
    const res = await post({ userId: 'u1', type: 'distance', date: TODAY, value: 10, unit: 'km' });
    assert.equal(res.status, 400);
  });
});

// ---------------------------------------------------------------------------
describe('GET /metrics - list', () => {
  beforeEach(async () => {
    await post({ userId: 'u1', type: 'distance', date: YESTERDAY, value: 1,   unit: 'meter' });
    await post({ userId: 'u1', type: 'distance', date: TODAY,     value: 2,   unit: 'meter' });
    await post({ userId: 'u1', type: 'temperature', date: TODAY,  value: 100, unit: 'C'     });
    await post({ userId: 'u2', type: 'distance', date: TODAY,     value: 99,  unit: 'meter' });
  });

  it('returns paginated response shape', async () => {
    const res = await get('userId=u1&type=distance');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.pagination);
    assert.equal(res.body.pagination.total, 2);
    assert.equal(res.body.pagination.page, 1);
    assert.equal(res.body.pagination.limit, 20);
    assert.equal(res.body.pagination.totalPages, 1);
  });

  it('returns all distance metrics for userId without unit param', async () => {
    const res = await get('userId=u1&type=distance');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.data[0].unit, 'meter'); // original unit preserved
  });

  it('converts values when unit param is provided (meter → feet)', async () => {
    const res = await get('userId=u1&type=distance&unit=feet');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);
    res.body.data.forEach(r => assert.equal(r.unit, 'feet'));
    // 2 meters → ~6.5617 feet
    const twoMeters = res.body.data.find(r => r.date === TODAY);
    assert.ok(Math.abs(twoMeters.value - 6.5617) < 0.001);
  });

  it('converts temperature when unit param is provided (C → F)', async () => {
    const res = await get('userId=u1&type=temperature&unit=F');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].unit, 'F');
    // 100°C → 212°F
    assert.equal(res.body.data[0].value, 212);
  });

  it('does not return other users data', async () => {
    const res = await get('userId=u1&type=distance');
    assert.ok(res.body.data.every(r => r.user_id === 'u1'));
  });

  it('paginates correctly with page and limit', async () => {
    const res = await get('userId=u1&type=distance&page=1&limit=1');
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.pagination.total, 2);
    assert.equal(res.body.pagination.totalPages, 2);

    const res2 = await get('userId=u1&type=distance&page=2&limit=1');
    assert.equal(res2.body.data.length, 1);
    assert.equal(res2.body.pagination.page, 2);
  });

  it('returns empty data on out-of-range page', async () => {
    const res = await get('userId=u1&type=distance&page=99&limit=20');
    assert.equal(res.body.data.length, 0);
    assert.equal(res.body.pagination.total, 2);
  });

  it('returns 400 when userId or type is missing', async () => {
    assert.equal((await get('type=distance')).status, 400);
    assert.equal((await get('userId=u1')).status, 400);
  });

  it('returns 400 for invalid unit param', async () => {
    const res = await get('userId=u1&type=distance&unit=km');
    assert.equal(res.status, 400);
  });
});

// ---------------------------------------------------------------------------
describe('GET /metrics/chart', () => {
  beforeEach(async () => {
    // Multiple entries same day → only latest should appear in chart
    await post({ userId: 'u1', type: 'distance', date: TODAY,     value: 1, unit: 'meter' });
    await post({ userId: 'u1', type: 'distance', date: TODAY,     value: 2, unit: 'meter' }); // latest for TODAY
    await post({ userId: 'u1', type: 'distance', date: YESTERDAY, value: 5, unit: 'meter' });
  });

  it('returns one entry per day without unit param', async () => {
    const res = await chart('userId=u1&type=distance&period=1');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 2); // TODAY + YESTERDAY
    res.body.forEach(r => assert.ok(r.date));
    // original units preserved
    res.body.forEach(r => assert.equal(r.unit, 'meter'));
  });

  it('returns the latest entry per day (not earliest)', async () => {
    const res = await chart('userId=u1&type=distance&period=1');
    const today = res.body.find(r => r.date === TODAY);
    assert.equal(today.value, 2); // latest insert was value=2
  });

  it('converts values when unit param is provided (meter → centimeter)', async () => {
    const res = await chart('userId=u1&type=distance&period=1&unit=centimeter');
    assert.equal(res.status, 200);
    res.body.forEach(r => assert.equal(r.unit, 'centimeter'));
    const today = res.body.find(r => r.date === TODAY);
    assert.equal(today.value, 200); // 2 meters = 200 cm
  });

  it('converts temperature chart values (C → K)', async () => {
    await post({ userId: 'u2', type: 'temperature', date: TODAY, value: 0, unit: 'C' });
    const res = await chart('userId=u2&type=temperature&period=1&unit=K');
    assert.equal(res.status, 200);
    assert.equal(res.body[0].value, 273.15);
    assert.equal(res.body[0].unit, 'K');
  });

  it('filters by period (entries outside range are excluded)', async () => {
    const oldDate = new Date();
    oldDate.setMonth(oldDate.getMonth() - 3);
    const old = oldDate.toISOString().split('T')[0];
    await post({ userId: 'u1', type: 'distance', date: old, value: 999, unit: 'meter' });

    const res = await chart('userId=u1&type=distance&period=1');
    assert.ok(res.body.every(r => r.date >= new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]));
    assert.ok(res.body.every(r => r.value !== 999));
  });

  it('returns 400 when userId or type is missing', async () => {
    assert.equal((await chart('type=distance')).status, 400);
    assert.equal((await chart('userId=u1')).status, 400);
  });

  it('returns 400 for invalid unit param', async () => {
    const res = await chart('userId=u1&type=distance&unit=km');
    assert.equal(res.status, 400);
  });
});

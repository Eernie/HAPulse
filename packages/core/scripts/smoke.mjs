/**
 * Smoke test for @hapulse/core.
 * Run: node packages/core/scripts/smoke.mjs
 *
 * Verifies:
 *  - buildRooms produces ≥6 rooms with expected IDs
 *  - roomSummary produces sensible values for each room
 *  - DEMO_ENTITIES and DEMO_REGISTRIES are well-formed
 *  - domainOf, isToggleable, formatEntityState, domainIcon work correctly
 *  - createDemoTicker fires callbacks
 *  - applyDemoService mutates state correctly
 */

import {
  buildRooms,
  roomSummary,
  DEMO_ENTITIES,
  DEMO_REGISTRIES,
  domainOf,
  isToggleable,
  formatEntityState,
  domainIcon,
  isFavoriteRelevant,
  createDemoTicker,
  applyDemoService,
  HAAuthError,
  HAConnectionError,
  startHASignIn,
  resumeHASession,
  roomIconName,
  roomStatusIconName,
  CANONICAL_ROOM_ICONS,
} from '../dist/index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, label) {
  assert(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// ---------------------------------------------------------------------------
// buildRooms
// ---------------------------------------------------------------------------

console.log('\n── buildRooms ──');

const rooms = buildRooms(DEMO_REGISTRIES, DEMO_ENTITIES);

assert(rooms.length >= 6, `at least 6 rooms (got ${rooms.length})`);

const roomIds = rooms.map(r => r.id);
for (const expected of ['living_room', 'kitchen', 'bedroom', 'office', 'bathroom', 'hallway']) {
  assert(roomIds.includes(expected), `room "${expected}" exists`);
}

// Rooms are alphabetically sorted
const names = rooms.map(r => r.name);
const sorted = [...names].sort((a, b) => a.localeCompare(b));
assert(JSON.stringify(names) === JSON.stringify(sorted), 'rooms are sorted alphabetically');

// Living room should have lights
const lr = rooms.find(r => r.id === 'living_room');
assert(lr !== undefined, 'living_room room found');
assert(Array.isArray(lr.domains['light']) && lr.domains['light'].length > 0, 'living_room has lights in domains');
assert(lr.entityIds.length > 0, 'living_room has entityIds');

// ---------------------------------------------------------------------------
// roomSummary
// ---------------------------------------------------------------------------

console.log('\n── roomSummary ──');

for (const room of rooms) {
  const summary = roomSummary(room, DEMO_ENTITIES);
  assert(typeof summary.lightsOn === 'number', `${room.name}: lightsOn is number`);
  assert(typeof summary.lightsTotal === 'number', `${room.name}: lightsTotal is number`);
  assert(typeof summary.mediaPlaying === 'boolean', `${room.name}: mediaPlaying is boolean`);
  assert(typeof summary.anyMotion === 'boolean', `${room.name}: anyMotion is boolean`);
  assert(summary.lightsOn <= summary.lightsTotal, `${room.name}: lightsOn <= lightsTotal`);
}

// Living room: should have temperature, lights on, motion
const lrSummary = roomSummary(lr, DEMO_ENTITIES);
assert(typeof lrSummary.temperature === 'number', 'living room has temperature');
assert(lrSummary.lightsOn > 0, 'living room has lights on');
assert(lrSummary.anyMotion === true, 'living room motion detected');

// Living room TV is playing
assert(lrSummary.mediaPlaying === true, 'living room media playing');

// Kitchen: lights on (ceiling on), media not playing
const kitchen = rooms.find(r => r.id === 'kitchen');
const kitchenSummary = roomSummary(kitchen, DEMO_ENTITIES);
assert(kitchenSummary.lightsOn > 0, 'kitchen has lights on');

// ---------------------------------------------------------------------------
// domain helpers
// ---------------------------------------------------------------------------

console.log('\n── domain helpers ──');

assertEqual(domainOf('light.living_room_ceiling'), 'light', 'domainOf light');
assertEqual(domainOf('sensor.temperature'), 'sensor', 'domainOf sensor');
assertEqual(domainOf('media_player.tv'), 'media_player', 'domainOf media_player');
assertEqual(domainOf('noDotsHere'), 'noDotsHere', 'domainOf no dot');

assert(isToggleable('light'), 'light is toggleable');
assert(isToggleable('switch'), 'switch is toggleable');
assert(isToggleable('fan'), 'fan is toggleable');
assert(isToggleable('input_boolean'), 'input_boolean is toggleable');
assert(!isToggleable('sensor'), 'sensor is NOT toggleable');
assert(!isToggleable('climate'), 'climate is NOT toggleable');

const tvEntity = DEMO_ENTITIES['media_player.living_room_tv'];
assertEqual(formatEntityState(tvEntity), 'playing', 'formatEntityState playing');

const tempEntity = DEMO_ENTITIES['sensor.living_room_temperature'];
const formatted = formatEntityState(tempEntity);
assert(formatted.includes('°C'), `formatEntityState includes unit (got "${formatted}")`);

const unavailEntity = { ...tempEntity, state: 'unavailable' };
assertEqual(formatEntityState(unavailEntity), 'unavailable', 'formatEntityState unavailable');

const lightEntity = DEMO_ENTITIES['light.living_room_ceiling'];
assertEqual(domainIcon(lightEntity), 'lightbulb', 'domainIcon light → lightbulb');

const doorEntity = DEMO_ENTITIES['binary_sensor.front_door'];
assertEqual(domainIcon(doorEntity), 'door-open', 'domainIcon door binary_sensor → door-open');

const thermometerEntity = DEMO_ENTITIES['sensor.living_room_temperature'];
assertEqual(domainIcon(thermometerEntity), 'thermometer', 'domainIcon temperature sensor → thermometer');

// ---------------------------------------------------------------------------
// isFavoriteRelevant
// ---------------------------------------------------------------------------

console.log('\n── isFavoriteRelevant ──');

// Helper: build a minimal entity stub for testing
function makeEntity(entity_id, state, attributes = {}) {
  return { entity_id, state, attributes, last_changed: '', last_updated: '', context: { id: '', parent_id: null, user_id: null } };
}

// Light ON → relevant
assert(isFavoriteRelevant(makeEntity('light.living_room', 'on')), 'light on → relevant');

// Light OFF → not relevant
assert(!isFavoriteRelevant(makeEntity('light.living_room', 'off')), 'light off → not relevant');

// Binary sensor ON (e.g. motion detected) → relevant
assert(isFavoriteRelevant(makeEntity('binary_sensor.front_door', 'on', { device_class: 'door' })), 'binary_sensor on → relevant');

// Binary sensor OFF (door closed) → not relevant
assert(!isFavoriteRelevant(makeEntity('binary_sensor.front_door', 'off', { device_class: 'door' })), 'binary_sensor off → not relevant');

// Sensor always relevant (value-type)
assert(isFavoriteRelevant(makeEntity('sensor.living_room_temperature', '21.5', { unit_of_measurement: '°C' })), 'sensor always relevant');

// Unavailable → not relevant (even for sensor domain)
assert(!isFavoriteRelevant(makeEntity('sensor.broken', 'unavailable')), 'unavailable → not relevant');

// Media player playing → relevant
assert(isFavoriteRelevant(makeEntity('media_player.living_room_tv', 'playing')), 'media_player playing → relevant');

// Media player idle → not relevant
assert(!isFavoriteRelevant(makeEntity('media_player.speaker', 'idle')), 'media_player idle → not relevant');

// ---------------------------------------------------------------------------
// roomIconName + roomStatusIconName
// ---------------------------------------------------------------------------

console.log('\n── roomIconName ──');

assertEqual(roomIconName({ name: 'Kitchen' }), 'utensils', 'keyword kitchen → utensils');
assertEqual(roomIconName({ name: 'Living Room' }), 'sofa', 'keyword living → sofa');
assertEqual(roomIconName({ name: 'Bedroom', icon: 'mdi:bed' }), 'bed', 'mdi:bed → bed');
assertEqual(roomIconName({ name: 'Living Room', icon: 'sofa' }), 'sofa', 'passthrough sofa → sofa');
assertEqual(roomIconName({ name: 'Foobar' }), 'house', 'unknown name → house');
assertEqual(roomIconName({ name: 'Master Suite', icon: 'mdi:bed-double' }), 'bed', 'mdi:bed-double → bed');
assertEqual(roomIconName({ name: 'Hallway', icon: 'door-open' }), 'door-open', 'passthrough door-open → door-open');

console.log('\n── roomStatusIconName ──');

// Build a minimal room with a door binary sensor in 'on' state
const hallwayRoom = rooms.find(r => r.id === 'hallway');
assert(hallwayRoom !== undefined, 'hallway room found for status tests');

// No sensor triggered → null
const noStatusEntities = { ...DEMO_ENTITIES };
assertEqual(roomStatusIconName(hallwayRoom, noStatusEntities), null, 'status: no trigger → null');

// Open door → 'door-open'
const openDoorEntities = {
  ...DEMO_ENTITIES,
  'binary_sensor.front_door': {
    ...DEMO_ENTITIES['binary_sensor.front_door'],
    state: 'on',
    attributes: { ...DEMO_ENTITIES['binary_sensor.front_door'].attributes, device_class: 'door' },
  },
};
assertEqual(roomStatusIconName(hallwayRoom, openDoorEntities), 'door-open', 'status: open door → door-open');

// Open window → 'air-vent'
const bedroomRoom = rooms.find(r => r.id === 'bedroom');
assert(bedroomRoom !== undefined, 'bedroom room found for window status test');
const openWindowEntities = {
  ...DEMO_ENTITIES,
  'binary_sensor.bedroom_window': {
    ...DEMO_ENTITIES['binary_sensor.bedroom_window'],
    state: 'on',
    attributes: { ...DEMO_ENTITIES['binary_sensor.bedroom_window'].attributes, device_class: 'window' },
  },
};
assertEqual(roomStatusIconName(bedroomRoom, openWindowEntities), 'air-vent', 'status: open window → air-vent');

// CANONICAL_ROOM_ICONS includes expected values
assert(Array.isArray(CANONICAL_ROOM_ICONS), 'CANONICAL_ROOM_ICONS is array');
assert(CANONICAL_ROOM_ICONS.includes('house'), 'CANONICAL_ROOM_ICONS includes house');
assert(CANONICAL_ROOM_ICONS.includes('sofa'), 'CANONICAL_ROOM_ICONS includes sofa');
assert(CANONICAL_ROOM_ICONS.includes('air-vent'), 'CANONICAL_ROOM_ICONS includes air-vent');

// ---------------------------------------------------------------------------
// createDemoTicker
// ---------------------------------------------------------------------------

console.log('\n── createDemoTicker ──');

let tickerFired = false;
const stop = createDemoTicker((entities) => {
  tickerFired = true;
  assert(typeof entities === 'object' && entities !== null, 'ticker provides entity map');
  assert(Object.keys(entities).length > 0, 'ticker entity map is not empty');
  stop();
  finish();
});

// ---------------------------------------------------------------------------
// applyDemoService
// ---------------------------------------------------------------------------

console.log('\n── applyDemoService ──');

// Toggle a light on
const afterTurnOff = applyDemoService(DEMO_ENTITIES, 'light', 'turn_off', {}, { entity_id: 'light.living_room_ceiling' });
assertEqual(afterTurnOff['light.living_room_ceiling'].state, 'off', 'turn_off light → off');

const afterTurnOn = applyDemoService(afterTurnOff, 'light', 'turn_on', { brightness: 128 }, { entity_id: 'light.living_room_ceiling' });
assertEqual(afterTurnOn['light.living_room_ceiling'].state, 'on', 'turn_on light → on');
assertEqual(afterTurnOn['light.living_room_ceiling'].attributes['brightness'], 128, 'brightness set');

// Lock/unlock
const afterUnlock = applyDemoService(DEMO_ENTITIES, 'lock', 'unlock', {}, { entity_id: 'lock.front_door' });
assertEqual(afterUnlock['lock.front_door'].state, 'unlocked', 'unlock → unlocked');

// Climate temp
const afterTemp = applyDemoService(DEMO_ENTITIES, 'climate', 'set_temperature', { temperature: 23 }, { entity_id: 'climate.living_room' });
assertEqual(afterTemp['climate.living_room'].attributes['temperature'], 23, 'climate temperature set');

// Media pause
const afterPause = applyDemoService(DEMO_ENTITIES, 'media_player', 'media_pause', {}, { entity_id: 'media_player.living_room_tv' });
assertEqual(afterPause['media_player.living_room_tv'].state, 'paused', 'media_pause → paused');

// Cover open
const afterOpen = applyDemoService(DEMO_ENTITIES, 'cover', 'open_cover', {}, { entity_id: 'cover.bedroom_blinds' });
assertEqual(afterOpen['cover.bedroom_blinds'].state, 'open', 'open_cover → open');

// Alarm arm away
const afterArm = applyDemoService(DEMO_ENTITIES, 'alarm_control_panel', 'alarm_arm_away', {}, { entity_id: 'alarm_control_panel.home' });
assertEqual(afterArm['alarm_control_panel.home'].state, 'armed_away', 'alarm arm away');

// ---------------------------------------------------------------------------
// OAuth helpers — error-mapping (no real HA needed)
// ---------------------------------------------------------------------------

console.log('\n── OAuth error mapping ──');

// HAAuthError has expected properties
const authErr = new HAAuthError('test');
assert(authErr instanceof Error, 'HAAuthError is instanceof Error');
assert(authErr instanceof HAAuthError, 'HAAuthError is instanceof HAAuthError');
assertEqual(authErr.code, 'ERR_INVALID_AUTH', 'HAAuthError.code');
assertEqual(authErr.name, 'HAAuthError', 'HAAuthError.name');

// HAConnectionError has expected properties
const connErr = new HAConnectionError('test conn');
assert(connErr instanceof Error, 'HAConnectionError is instanceof Error');
assertEqual(connErr.code, 'ERR_CANNOT_CONNECT', 'HAConnectionError.code');
assertEqual(connErr.name, 'HAConnectionError', 'HAConnectionError.name');

// startHASignIn rejects with HAConnectionError when hassUrl cannot redirect
// (ERR_HASS_HOST_REQUIRED is thrown by getAuth when hassUrl is empty/missing — here we pass a
//  non-empty but clearly unreachable URL so getAuth throws ERR_CANNOT_CONNECT or similar)
try {
  await startHASignIn({
    hassUrl: 'http://localhost:9',
    clientId: 'http://localhost:9/',
    redirectUrl: 'http://localhost:9/onboarding',
    saveTokens: () => {},
    loadTokens: async () => undefined,
  });
  assert(false, 'startHASignIn should reject for unreachable host');
} catch (err) {
  assert(
    err instanceof HAConnectionError || err instanceof HAAuthError,
    'startHASignIn rejects with typed error for unreachable host'
  );
}

// resumeHASession returns null when loadTokens returns undefined and there's no callback
try {
  const result = await resumeHASession({
    clientId: 'http://localhost:9/',
    redirectUrl: 'http://localhost:9/onboarding',
    saveTokens: () => {},
    loadTokens: async () => undefined,
  });
  assert(result === null, 'resumeHASession returns null when no tokens and no callback');
} catch (err) {
  // getAuth may throw ERR_HASS_HOST_REQUIRED which we map to null — also acceptable
  assert(
    err instanceof HAConnectionError || err instanceof HAAuthError,
    'resumeHASession throws typed error (no tokens path)'
  );
}

// resumeHASession rejects with HAAuthError for expired/invalid tokens
try {
  const expiredToken = {
    hassUrl: 'http://localhost:9',
    clientId: 'http://localhost:9/',
    expires: Date.now() - 1000,
    refresh_token: 'invalid',
    access_token: 'invalid',
    expires_in: 1800,
  };
  await resumeHASession({
    clientId: 'http://localhost:9/',
    redirectUrl: 'http://localhost:9/onboarding',
    saveTokens: () => {},
    loadTokens: async () => expiredToken,
  });
  assert(false, 'resumeHASession should reject for invalid tokens');
} catch (err) {
  assert(
    err instanceof HAAuthError || err instanceof HAConnectionError,
    'resumeHASession rejects with typed error for invalid tokens'
  );
}

// startHASignIn and resumeHASession are exported and callable
assert(typeof startHASignIn === 'function', 'startHASignIn exported as function');
assert(typeof resumeHASession === 'function', 'resumeHASession exported as function');

// ---------------------------------------------------------------------------
// Finish (after ticker or timeout)
// ---------------------------------------------------------------------------

const timeout = setTimeout(() => {
  if (!tickerFired) {
    console.error('  ✗ FAIL: createDemoTicker never fired within 8s');
    failed++;
  }
  finish();
}, 8000);

function finish() {
  clearTimeout(timeout);
  console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

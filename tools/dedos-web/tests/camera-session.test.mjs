import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CameraSession } from '../src/camera-session.js';

const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function makeStream(id) {
  const track = { stops: 0, stop() { this.stops++; }, getSettings: () => ({ deviceId: id }) };
  return { track, getTracks: () => [track], getVideoTracks: () => [track] };
}
function fixture(getUserMedia) {
  const video = { srcObject: null, play: async () => {}, pause() {} };
  return { video, session: new CameraSession(video, { getUserMedia }) };
}
test('no solicita la cámara hasta empezar y nunca solicita audio', async () => {
  let calls = 0;
  const stream = makeStream('front');
  const { session } = fixture(async options => { calls++; assert.equal(options.audio, false); return stream; });
  assert.equal(calls, 0);
  assert.equal(await session.start(), true);
  assert.equal(session.deviceId, 'front');
  session.stop();
  assert.equal(stream.track.stops, 1);
});
test('apagar mientras se espera permiso detiene el stream tardío', async () => {
  const permission = deferred();
  const { video, session } = fixture(() => permission.promise);
  const pending = session.start();
  session.stop();
  const stream = makeStream('late');
  permission.resolve(stream);
  assert.equal(await pending, false);
  assert.equal(stream.track.stops, 1);
  assert.equal(video.srcObject, null);
});
test('cambiar cámara conserva la anterior cuando falla el permiso', async () => {
  const first = makeStream('first');
  let calls = 0;
  const { video, session } = fixture(async options => {
    if (++calls === 1) return first;
    assert.deepEqual(options.video.deviceId, { exact: 'second' });
    throw Object.assign(new Error('ocupada'), { name: 'NotReadableError' });
  });
  await session.start();
  await assert.rejects(session.start('second'));
  assert.equal(first.track.stops, 0);
  assert.equal(video.srcObject, first);
  assert.equal(session.deviceId, 'first');
});
test('si la cámara nueva no reproduce, cierra esa cámara y restaura la anterior', async () => {
  const first = makeStream('first'), second = makeStream('second');
  let calls = 0;
  const { video, session } = fixture(async () => ++calls === 1 ? first : second);
  await session.start();
  video.play = async () => { throw new Error('falló play'); };
  await assert.rejects(session.start('second'));
  assert.equal(video.srcObject, first);
  assert.equal(second.track.stops, 1);
  assert.equal(first.track.stops, 0);
});
test('apagar mientras se inicia reproducción no deja streams activos', async () => {
  const playing = deferred();
  const stream = makeStream('camera');
  const { video, session } = fixture(async () => stream);
  video.play = () => playing.promise;
  const pending = session.start();
  await Promise.resolve();
  session.stop();
  playing.resolve();
  assert.equal(await pending, false);
  assert.equal(video.srcObject, null);
  assert.ok(stream.track.stops > 0);
});
test('el cambio exitoso detiene la cámara anterior después de reproducir', async () => {
  const first = makeStream('first'), second = makeStream('second');
  let calls = 0;
  const { video, session } = fixture(async () => ++calls === 1 ? first : second);
  await session.start();
  video.play = async () => { assert.equal(first.track.stops, 0); };
  assert.equal(await session.start('second'), true);
  assert.equal(first.track.stops, 1);
  assert.equal(second.track.stops, 0);
  session.stop();
  assert.equal(second.track.stops, 1);
});

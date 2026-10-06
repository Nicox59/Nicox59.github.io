export class CameraSession {
  constructor(video, mediaDevices) {
    this.video = video;
    this.mediaDevices = mediaDevices;
    this.stream = null;
    this.pendingStream = null;
    this.generation = 0;
    this.deviceId = '';
  }

  async start(deviceId = '') {
    const generation = ++this.generation;
    const stream = await this.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }),
        width: { ideal: 1280 }, height: { ideal: 720 }
      }
    });
    if (generation !== this.generation) {
      this.stopTracks(stream);
      return false;
    }
    const previousStream = this.stream;
    this.pendingStream = stream;
    this.video.srcObject = stream;
    try {
      await this.video.play();
    } catch (error) {
      this.stopTracks(stream);
      if (generation === this.generation) {
        this.pendingStream = null;
        this.video.srcObject = previousStream;
        throw error;
      }
      return false;
    }
    if (generation !== this.generation) {
      this.stopTracks(stream);
      return false;
    }
    this.stream = stream;
    this.pendingStream = null;
    this.deviceId = stream.getVideoTracks()[0]?.getSettings().deviceId || deviceId;
    this.stopTracks(previousStream);
    return true;
  }

  stopTracks(stream) {
    stream?.getTracks().forEach(track => track.stop());
  }

  stop() {
    ++this.generation;
    this.stopTracks(this.pendingStream);
    this.stopTracks(this.stream);
    this.pendingStream = null;
    this.stream = null;
    this.deviceId = '';
    this.video.pause();
    this.video.srcObject = null;
  }
}

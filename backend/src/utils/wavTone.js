export function generateToneWavDataUrl(durationSec = 0.7, freq = 440, sampleRate = 16000 ){
    const length = Math.floor(sampleRate * durationSec);
    const buf = new ArrayBuffer(44 + length * 2);
}
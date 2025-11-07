import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root'})
export class TtsService {

  createMediaSource(mime: string) {
    if (!('MediaSource' in window) || !MediaSource.isTypeSupported(mime)) {
      throw new Error(`MediaSource does not support ${mime}`);
    }

    const ms = new MediaSource();
    const audio = new Audio();
    audio.src = URL.createObjectURL(ms);

    let sb: SourceBuffer | null = null;
    const queue: ArrayBuffer[] = [];
    let open = false;

    ms.addEventListener('sourceopen', () => {
      sb = ms.addSourceBuffer(mime);
      open = true;

      sb.addEventListener('updateend', () => {
        if (queue.length > 0 && sb && !sb.updating) {
          sb.appendBuffer(new Uint8Array(queue.shift()!));
        }
      });
    });

    const append = (chunk: ArrayBuffer) => {
      if (!open || !sb) {
        queue.push(chunk);
        return;
      }
      if (sb.updating) {
        queue.push(chunk);
        return;
      }
      sb.appendBuffer(new Uint8Array(chunk));
    };

    const play = () => audio.play().catch(() => {});
    const end = () => {
      try { ms.endOfStream(); } catch {}
    };

    return { audio, append, play, end };
  }

}

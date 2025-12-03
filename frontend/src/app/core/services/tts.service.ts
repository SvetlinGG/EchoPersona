import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root'})
export class TtsService {

  createMediaSource(mime: string) {
    if (!('MediaSource' in window) || !MediaSource.isTypeSupported(mime)) {
      console.warn(`MediaSource does not support ${mime}, falling back to blob`);
      return this.createBlobAudio();
    }

    const ms = new MediaSource();
    const audio = new Audio();
    audio.src = URL.createObjectURL(ms);
    audio.volume = 0.5;
    audio.preload = 'auto';

    let sb: SourceBuffer | null = null;
    const queue: ArrayBuffer[] = [];
    let open = false;

    ms.addEventListener('sourceopen', () => {
      try {
        sb = ms.addSourceBuffer(mime);
        open = true;

        sb.addEventListener('updateend', () => {
          if (queue.length > 0 && sb && !sb.updating) {
            const chunk = queue.shift()!;
            try {
              sb.appendBuffer(new Uint8Array(chunk));
            } catch (error) {
              console.error('Buffer append error:', error);
            }
          }
        });
        
        // Process initial queue
        if (queue.length > 0) {
          const chunk = queue.shift()!;
          sb.appendBuffer(new Uint8Array(chunk));
        }
      } catch (error) {
        console.error('MediaSource error:', error);
      }
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
      try {
        sb.appendBuffer(new Uint8Array(chunk));
      } catch (error) {
        console.error('Append buffer error:', error);
      }
    };

    const play = () => {
      // Start playing immediately when first chunk arrives
      if (audio.readyState >= 2) {
        audio.play().catch(error => {
          console.error('Audio play error:', error);
        });
      } else {
        audio.addEventListener('canplay', () => {
          audio.play().catch(error => {
            console.error('Audio play error:', error);
          });
        }, { once: true });
      }
    };
    
    const end = () => {
      try { 
        if (ms.readyState === 'open') {
          ms.endOfStream(); 
        }
      } catch (error) {
        console.error('End stream error:', error);
      }
    };

    return { audio, append, play, end };
  }

  private createBlobAudio() {
    const chunks: ArrayBuffer[] = [];
    let audio: HTMLAudioElement | null = null;

    const append = (chunk: ArrayBuffer) => {
      chunks.push(chunk);
    };

    const play = () => {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        audio = new Audio(url);
        audio.volume = 0.5;
        audio.preload = 'auto';
        audio.play().catch(error => {
          console.error('Blob audio play error:', error);
        });
      }
    };

    const end = () => {
      // Blob audio doesn't need explicit ending
    };

    return { audio: null, append, play, end };
  }

  playUrl(url: string) {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.preload = 'auto';
    audio.play().catch(error => {
      console.error('URL audio play error:', error);
    });
  }
}

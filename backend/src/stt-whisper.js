import ffmpegPath from "ffmpeg-static";
import Ffmpeg from "fluent-ffmpeg";
import fs from 'fs';
import os from 'os';
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";


Ffmpeg.setFfmpegPath(ffmpegPath);

export async function transcribeWebmOpusBufferToText(buf){
    // 1) make .webm
    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-'));
    const inPath = path.join(tmpDir, 'in.webm');
    const outPath = path.join(tmpDir, 'out.wav');
    fs.writeFileSync(inPath, buf);

    // 2) convert to wav 16k mono
    await new Promise((resolve, reject) => {
        Ffmpeg(inPath)
            .audioChannels(1)
            .audioFrequency(16000)
            .format('wav')
            .save(outPath)
            .on('end', resolve)
            .on('error', reject)
    });

    // 3) send to Whisper ( OpenAI STT )
    const form = new FormData();
    form.append('model', 'whisper-1');
    form.append('file', fs.createReadStream(outPath), { filename: 'audio.wav', contentType: 'audio/wav'});

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form
    });

    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Whisper STT failed: ${resp.status} ${text}`);
    }

    const json = await resp.json();

    // 4) Cleaning
    try {
        fs.unlinkSync(inPath);
        fs.unlinkSync(outPath);
        fs.rmdirSync(tmpDir);
    } catch{}

    return json.text || '';
}
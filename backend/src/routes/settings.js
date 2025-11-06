import express from 'express';
const router = express.Router();

let settings = {
    voice: { voiceId: 'eleven_monolingual_v1', rate: 1.0, pitch: 0, volume: 1.0 },
    mode: 'coach'
};

router.get('/', (req, res) => res.json(settings));

router.post('/', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json({ ok: true, settings});
});

export default router;
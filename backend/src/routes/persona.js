import express from 'express';
import { PERSONA_TEMPLATES } from '../presets.js';

const router = express.Router();
let personaPrompt = PERSONA_TEMPLATES[0].prompt;

router.get('/templates', (req, res) => res.json(PERSONA_TEMPLATES));
router.get('/', (req, res) => res.json({ prompt: personaPrompt }));

router.post('/', (req, res) => {
    personaPrompt = req.body?.prompt || '';
    res.json({ ok: true, prompt: personaPrompt });
});

export default router;

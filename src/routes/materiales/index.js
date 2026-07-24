const { Router } = require('express');

const router = Router();

// Placeholder — Materiales module
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'materiales', message: 'Module placeholder - not yet implemented' });
});

// TODO: Add materiales routes when module is implemented

module.exports = router;

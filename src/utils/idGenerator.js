const { NANO_ID_LENGTH } = require('@/config/security.config');

let _nanoid; // module-level cache

// Lazy-load nanoid only once
async function loadNanoid() {
  if (!_nanoid) {
    const mod = await import('nanoid');
    _nanoid = mod.nanoid;
  }
  return _nanoid;
}

// Async generator (safe, scalable)
async function generateNanoId(length = NANO_ID_LENGTH) {
  const nanoid = await loadNanoid();
  return nanoid(length);
}

module.exports = { generateNanoId };

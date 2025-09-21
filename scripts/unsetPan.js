/*
  Usage:
  node scripts/unsetPan.js --code=1234
  node scripts/unsetPan.js --pan=ABCDE1234F
*/

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const path = require('path');

async function main() {
  try {
    const argCode = process.argv.find((a) => a.startsWith('--code='));
    const argPan = process.argv.find((a) => a.startsWith('--pan='));

    const code = argCode ? argCode.split('=')[1] : undefined;
    const pan = argPan ? argPan.split('=')[1] : undefined;

    if (!code && !pan) {
      console.error('Provide --code=XXXX or --pan=ABCDE1234F');
      process.exit(1);
    }

    if (!process.env.DATABASE) {
      console.error('DATABASE env var not set. Check .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.DATABASE);

    // Load models
    const User = require(path.resolve(__dirname, '../src/models/userModels/User'));

    const query = {};
    if (code) query.code = code;
    if (pan) query.pan = pan;

    const users = await User.find(query).lean();
    if (!users.length) {
      console.log('No users found for query:', query);
      await mongoose.disconnect();
      return;
    }

    const result = await User.updateMany(query, { $unset: { pan: '' } });
    console.log(
      `Matched: ${result.matchedCount || result.n}, Modified: ${
        result.modifiedCount || result.nModified
      }`
    );

    const after = await User.find(query).lean();
    console.log(
      'Post-update sample (first):',
      after[0] ? { _id: after[0]._id, code: after[0].code, pan: after[0].pan } : null
    );

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error unsetting PAN:', err);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

main();

// CommonJS version so it can be run on environments without ESM enabled
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
// Resolve server/.env relative to this script file
const envPath = path.resolve(__dirname, '..', '..', '.env');
require('dotenv').config({ path: envPath });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in environment');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;
  const users = db.collection('users');

  console.log('Unsetting null/empty aadhaarCard.number and panCard.pan_number...');
  await users.updateMany(
    { 'aadhaarCard.number': { $in: [null, ''] } },
    { $unset: { 'aadhaarCard.number': '' } }
  );
  await users.updateMany(
    { 'panCard.pan_number': { $in: [null, ''] } },
    { $unset: { 'panCard.pan_number': '' } }
  );

  console.log('Fetching existing indexes...');
  const indexes = await users.indexes();
  console.log('Current indexes:', indexes.map(i => i.name));

  for (const idx of indexes) {
    try {
      const keyNames = Object.keys(idx.key || {});
      if (keyNames.includes('aadhaarCard.number') || keyNames.includes('panCard.pan_number')) {
        console.log('Dropping index', idx.name);
        await users.dropIndex(idx.name);
      }
    } catch (e) {
      console.warn('Could not drop index', idx.name, e.message);
    }
  }

  console.log('Creating sparse unique indexes...');
  try {
    await users.createIndex({ 'aadhaarCard.number': 1 }, { unique: true, sparse: true });
    console.log('Created index aadhaarCard.number');
  } catch (e) {
    console.warn('Failed to create aadhaarCard.number index:', e.message);
  }

  try {
    await users.createIndex({ 'panCard.pan_number': 1 }, { unique: true, sparse: true });
    console.log('Created index panCard.pan_number');
  } catch (e) {
    console.warn('Failed to create panCard.pan_number index:', e.message);
  }

  console.log('Index fix complete');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});

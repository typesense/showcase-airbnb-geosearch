require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Typesense = require('typesense');
const readline = require('readline');

const DATA_DIR = path.resolve(__dirname, '../data/raw');
const DATA_FILE = path.resolve(DATA_DIR, '..', 'transformed_dataset.jsonl');
const CLIENT_BATCH_SIZE = 500000;
const typesense = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: process.env.TYPESENSE_PORT,
      protocol: process.env.TYPESENSE_PROTOCOL,
    },
  ],
  apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
  connectionTimeoutSeconds: 20 * 60,
});

async function indexData() {
  const aliasName = 'airbnb_listings';
  const collectionName = `${aliasName}_${Date.now()}`;
  console.log(`Creating new collection ${collectionName}`);
  await typesense.collections().create({
    name: collectionName,
    fields: [
      { name: 'name', type: 'string' },
      { name: 'neighbourhood_cleansed', type: 'string', optional: true },
      { name: 'property_type', type: 'string', facet: true },
      { name: 'room_type', type: 'string', facet: true },
      { name: 'accommodates', type: 'int32', facet: true },
      { name: 'beds', type: 'int32', facet: true, optional: true },
      { name: 'amenities', type: 'string[]', facet: true },
      { name: 'price', type: 'float', facet: true },
      { name: 'number_of_reviews', type: 'int32', facet: true },
      {
        name: 'review_scores_rating',
        type: 'float',
        facet: true,
        optional: true,
      },
      { name: 'coordinates', type: 'geopoint' },
    ],
    default_sorting_field: 'number_of_reviews',
  });

  const fileStream = fs.createReadStream(DATA_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  console.log(`Adding records to new collection ${collectionName}`);
  let records = '';
  let currentLine = 0;
  for await (const line of rl) {
    currentLine += 1;
    records += '\n' + line;
    if (currentLine % CLIENT_BATCH_SIZE === 0) {
      console.log(` Adding upto ${currentLine} records`);
      const results = await typesense
        .collections(collectionName)
        .documents()
        .import(records);
      const parsedResults = results.split('\n').map((r) => JSON.parse(r));
      const failedResults = parsedResults.filter((r) => r['success'] !== true);
      if (failedResults.length > 0) {
        console.error(failedResults);
      }
      console.log(` Lines upto ${currentLine} ✅`);
      records = '';
    }
  }

  if (records.length > 0) {
    await typesense.collections(collectionName).documents().import(records);
    console.log(` Lines upto ${currentLine} ✅`);
  }

  // Update alias, and delete old collection
  let oldCollectionName;
  try {
    oldCollectionName = await typesense.aliases(aliasName).retrieve()[
      'collection_name'
    ];
  } catch (error) {
    // Do nothing
  }

  try {
    console.log(`Update alias ${aliasName} -> ${collectionName}`);
    await typesense
      .aliases()
      .upsert(aliasName, { collection_name: collectionName });
    if (oldCollectionName) {
      console.log(`Deleting old collection ${oldCollectionName}`);
      await typesense.collections(oldCollectionName).delete();
    }
  } catch (error) {
    console.error(error);
  }
}
indexData();

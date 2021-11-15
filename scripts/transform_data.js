const fs = require('fs').promises;
const path = require('path');
const csv = require('csvtojson');

const DATA_DIR = path.resolve(__dirname, '../data/raw');

async function transformData() {
  const outputFile = await fs.open(
    path.resolve(DATA_DIR, '..', 'transformed_dataset.jsonl'),
    'w'
  );

  const files = await fs.readdir(DATA_DIR);
  for (const file of files) {
    if (!file.endsWith('.csv')) {
      continue;
    }

    console.log(`Transforming ${file}`);

    await csv()
      .fromFile(path.resolve(DATA_DIR, file))
      .subscribe(async (record) => {
        const transformedRecord = Object.fromEntries(
          [
            'id',
            'picture_url',
            'name',
            'host_name',
            'neighbourhood_cleansed',
            'property_type',
            'room_type',
            'accommodates',
            'beds',
            'amenities',
            'price',
            'number_of_reviews',
            'review_scores_rating',
          ]
            .filter((key) => key in record)
            .map((key) => [key, record[key]])
        );

        transformedRecord['coordinates'] = [
          parseFloat(record['latitude']),
          parseFloat(record['longitude']),
        ];

        transformedRecord['amenities'] = JSON.parse(
          transformedRecord['amenities']
        );

        transformedRecord['accommodates'] = parseInt(
          transformedRecord['accommodates']
        );
        transformedRecord['beds'] = parseInt(transformedRecord['beds']);
        transformedRecord['price'] = parseFloat(
          transformedRecord['price'].replace('$', '')
        );
        transformedRecord['number_of_reviews'] = parseInt(
          transformedRecord['number_of_reviews']
        );
        transformedRecord['review_scores_rating'] = parseFloat(
          transformedRecord['review_scores_rating']
        );

        // console.log(transformedRecord);
        await outputFile.write(JSON.stringify(transformedRecord) + '\n');
      });
  }
}

transformData();

# Airbnb Geo Search

This is a demo that showcases Typesense's Geo Search features using a snapshot of Airbnb listings from [insideairbnb](http://insideairbnb.com/).

View it live here: https://airbnb-geosearch.typesense.org/

# Tech Stack

This search experience is powered by Typesense which is a fast, open source typo-tolerant search-engine. It is an open source alternative to Algolia and an easier-to-use alternative to ElasticSearch.

The app was built using the [Typesense Adapter for InstantSearch.js](https://github.com/typesense/typesense-instantsearch-adapter) and is hosted on Cloudflare Pages.

The search/browsing backend is powered by a geo-distributed 3-node Typesense cluster running on [Typesense Cloud](https://cloud.typesense.org), with nodes in Oregon, Frankfurt and Mumbai.


## Repo structure

- `src/` and `index.html` - contain the frontend UI components, built with <a href="https://github.com/typesense/typesense-instantsearch-adapter" target="_blank">Typesense Adapter for InstantSearch.js</a>
- `scripts/` - contains the scripts to extract, transform and index the data into Typesense.

## Development

1. Create a `.env` file using `.env.example` as reference.

2. Transform and index the data
  ```shell
  yarn transformData
  yarn indexData
  ```

4. Install dependencies and run the local server:

```shell
yarn
yarn start
```

Open http://localhost:3000 to see the app.

## Deployment

The app is hosted on Cloudflare Pages and is set to auto-deploy on git push

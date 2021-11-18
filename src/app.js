import jQuery from 'jquery';

window.$ = jQuery; // workaround for https://github.com/parcel-bundler/parcel/issues/333

import 'popper.js';
import 'bootstrap';

import instantsearch from 'instantsearch.js/es';
import {
  searchBox,
  geoSearch,
  configure,
  stats,
  analytics,
  refinementList,
  rangeInput,
  ratingMenu,
  rangeSlider,
} from 'instantsearch.js/es/widgets';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import { SearchClient as TypesenseSearchClient } from 'typesense'; // To get the total number of docs
import images from '../images/*.*';

let TYPESENSE_SERVER_CONFIG = {
  apiKey: process.env.TYPESENSE_SEARCH_ONLY_API_KEY, // Be sure to use an API key that only allows searches, in production
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: process.env.TYPESENSE_PORT,
      protocol: process.env.TYPESENSE_PROTOCOL,
    },
  ],
  numRetries: 8,
  useServerSideSearchCache: true,
};

// [2, 3].forEach(i => {
//   if (process.env[`TYPESENSE_HOST_${i}`]) {
//     TYPESENSE_SERVER_CONFIG.nodes.push({
//       host: process.env[`TYPESENSE_HOST_${i}`],
//       port: process.env.TYPESENSE_PORT,
//       protocol: process.env.TYPESENSE_PROTOCOL,
//     });
//   }
// });

// Unfortunately, dynamic process.env keys don't work with parcel.js
// So need to enumerate each key one by one

if (process.env[`TYPESENSE_HOST_2`]) {
  TYPESENSE_SERVER_CONFIG.nodes.push({
    host: process.env[`TYPESENSE_HOST_2`],
    port: process.env.TYPESENSE_PORT,
    protocol: process.env.TYPESENSE_PROTOCOL,
  });
}

if (process.env[`TYPESENSE_HOST_3`]) {
  TYPESENSE_SERVER_CONFIG.nodes.push({
    host: process.env[`TYPESENSE_HOST_3`],
    port: process.env.TYPESENSE_PORT,
    protocol: process.env.TYPESENSE_PROTOCOL,
  });
}

if (process.env[`TYPESENSE_HOST_NEAREST`]) {
  TYPESENSE_SERVER_CONFIG['nearestNode'] = {
    host: process.env[`TYPESENSE_HOST_NEAREST`],
    port: process.env.TYPESENSE_PORT,
    protocol: process.env.TYPESENSE_PROTOCOL,
  };
}

const INDEX_NAME = 'airbnb_listings';

async function getIndexSize() {
  let typesenseSearchClient = new TypesenseSearchClient(
    TYPESENSE_SERVER_CONFIG
  );
  let results = await typesenseSearchClient
    .collections(INDEX_NAME)
    .documents()
    .search({ q: '*' });

  return results['found'];
}

let indexSize;

(async () => {
  indexSize = await getIndexSize();
})();

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: TYPESENSE_SERVER_CONFIG,
  // The following parameters are directly passed to Typesense's search API endpoint.
  //  So you can pass any parameters supported by the search endpoint below.
  //  queryBy is required.
  additionalSearchParameters: {
    queryBy: 'name,neighbourhood_cleansed',
    dropTokensThreshold: 2,
    typoTokensThreshold: 2,
    numTypos: 1,
  },
  geoLocationField: 'coordinates',
});
const searchClient = typesenseInstantsearchAdapter.searchClient;

const search = instantsearch({
  searchClient,
  indexName: INDEX_NAME,
  routing: true,
});

window.initMap = function () {
  search.addWidgets([
    geoSearch({
      container: '#map',
      googleReference: window.google,
      enableClearMapRefinement: false,
      enableRefineControl: false,
    }),

    configure({
      insideBoundingBox: [
        [
          34.45165702054374,
          -117.62488725779188,
          33.582023930285914,
          -118.94324663279188,
        ],
      ],
      hitsPerPage: 250,
    }),

    analytics({
      pushFunction(formattedParameters, state, results) {
        window.ga(
          'set',
          'page',
          (window.location.pathname + window.location.search).toLowerCase()
        );
        window.ga('send', 'pageView');
      },
    }),

    stats({
      container: '#stats',
      templates: {
        text: ({ nbHits, hasNoResults, hasOneResult, processingTimeMS }) => {
          let statsText = '';
          if (hasNoResults) {
            statsText = 'no listings';
          } else if (hasOneResult) {
            statsText = '1 listing';
          } else {
            statsText = `${nbHits.toLocaleString()} listings`;
          }
          return `Found ${statsText} ${
            indexSize ? ` from ${indexSize.toLocaleString()}` : ''
          } in ${processingTimeMS}ms.`;
        },
      },
      cssClasses: {
        text: 'text-muted small',
      },
    }),

    refinementList({
      container: '#amenities-refinement',
      attribute: 'amenities',
      searchable: true,
      searchablePlaceholder: 'Search amenities',
      showMore: true,
      showMoreLimit: 40,
      sortBy: ['count:asc', 'name:asc'],
      cssClasses: {
        searchableInput: 'form-control form-control-sm mb-2 border-light-2',
        searchableSubmit: 'd-none',
        searchableReset: 'd-none',
        showMore: 'btn btn-secondary btn-sm align-content-center',
        list: 'list-unstyled',
        count: 'badge badge-light bg-light-2 ml-2',
        label: 'd-flex align-items-center text-capitalize',
        checkbox: 'mr-2',
      },
    }),

    refinementList({
      container: '#property-type-refinement',
      attribute: 'property_type',
      searchable: true,
      searchablePlaceholder: 'Search amenities',
      showMore: true,
      showMoreLimit: 40,
      cssClasses: {
        searchableInput: 'form-control form-control-sm mb-2 border-light-2',
        searchableSubmit: 'd-none',
        searchableReset: 'd-none',
        showMore: 'btn btn-secondary btn-sm align-content-center',
        list: 'list-unstyled',
        count: 'badge badge-light bg-light-2 ml-2',
        label: 'd-flex align-items-center text-capitalize',
        checkbox: 'mr-2',
      },
    }),

    rangeInput({
      container: '#beds-refinement',
      attribute: 'beds',
      cssClasses: {
        form: 'form',
        input: 'form-control form-control-sm form-control-secondary',
        submit:
          'btn btn-sm btn-secondary ml-2 border border-secondary border-width-2',
        separator: 'text-muted mx-2',
      },
    }),

    rangeSlider({
      container: '#price-slider',
      attribute: 'price',
    }),
  ]);

  search.start();
};

function handleSearchTermClick(event) {
  const $searchBox = $('#searchbox input[type=search]');
  search.helper.clearRefinements();
  $searchBox.val(event.currentTarget.textContent);
  $searchBox.trigger('change');
  search.helper.setQuery($searchBox.val()).search();
}

$(async function () {
  const $searchBox = $('#searchbox input[type=search]');
  // Handle example search terms
  $('.clickable-search-term').on('click', handleSearchTermClick);
});

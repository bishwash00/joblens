import { getJSON } from './helpers.js';
import { API_KEY, API_APP_ID, PROXY, JOB_API_URL } from './config.js';

export const state = {
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: 10,
  },
  job: {},
  analytics: {
    demandByCountry: {},
    avgSalaryByCountry: {},
  },
  currency: {
    base: 'USD',
    target: 'NPR',
    rate: 1,
  },
  bookmarks: [],
};

const getJobAPIURL = function () {
  return `${JOB_API_URL}in/search/2?app_id=${API_APP_ID}&app_key=${API_KEY}&results_per_page=20&what=python`;
};

const getJobObjects = function (resultsArr) {};

export const controlJobs = async function () {
  try {
    const apiUrl = getJobAPIURL();
    const data = await getJSON(PROXY + encodeURIComponent(apiUrl));
    console.log(data);

    state.search.count = data.count;
    state.search.results = getJobObjects(data.results[0]);
  } catch (err) {
    throw err;
  }
};

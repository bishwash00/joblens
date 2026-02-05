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
  return `${JOB_API_URL}gb/search/1?app_id=${API_APP_ID}&app_key=${API_KEY}&results_per_page=9&what=javascript`;
};

const getJobObjects = function (resultsArr) {
  return resultsArr.map(result => ({
    title: result.title,
    companyName: result.company.display_name,
    id: result.id,
    location: result.location.display_name,
    description: result.description,
    contractTime: result.contract_time ? result.contract_time : 'full_time',
    salaryMax: result.salary_max,
    salaryMin: result.salary_min,
    date: result.created.split('T')[0],
  }));
};

export const getJobs = async function () {
  try {
    const apiUrl = getJobAPIURL();
    const proxyUrl = PROXY + apiUrl;

    const data = await getJSON(proxyUrl);
    console.log(data);

    state.search.count = data.count;
    state.search.results = getJobObjects(data.results);
    console.log(state.search.results);
  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  }
};

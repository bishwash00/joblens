import * as model from './model.js';
import jobsResultView from './views/jobsResultView.js';
import jobSearchView from './views/jobSearchView.js';

// Main controller for job search - just handles data
const controlJobResults = async function (query, page = 1, filters = {}) {
  console.log('Controller: Starting job search', { query, page, filters });

  // Fetch jobs using the API
  await model.getJobs(query, page, filters);

  console.log('Controller: Jobs fetched, rendering results');

  // Render the results
  jobsResultView.render(model.state.search);
};

// Controller for applying filters
const controlFilters = async function (newFilters) {
  console.log('🔧 Controller: Applying filters', newFilters);

  const { query } = model.state.search;

  // Reset to page 1 when applying new filters
  await controlJobResults(query, 1, newFilters);
};

const controlServerHealth = async function () {
  console.log('🔍 Checking proxy server health...');
  const health = await model.checkServerHealth();
  console.log('✅ Proxy server is running!');
  return health;
};

const init = function () {
  console.log('🚀 JobLens Application Starting...');

  controlServerHealth();

  jobSearchView.showSuggestions();
  jobSearchView.addHandlerSearch(controlJobResults);
  jobSearchView.addHandlerFilters(controlFilters);
  jobSearchView.addHandlerSuggestions(controlJobResults);

  jobSearchView.focusSearch();

  console.log('✅ JobLens Application Ready!');
  console.log('💡 Data processing and filtering ready!');
};

// Start the application
init();

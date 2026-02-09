import * as model from './model.js';
import jobsResultView from './views/jobsResultView.js';
import jobSearchView from './views/jobSearchView.js';
import paginationView from './views/paginationView.js';
import jobModalView from './views/jobModalView.js';

// Main controller for job search - just handles data
const controlJobResults = async function (query, page = 1, filters = {}) {
  try {
    console.log('Controller: Starting job search', { query, page, filters });

    jobsResultView.renderSpinner();
    jobsResultView.clearGrid();

    // Fetch jobs using the API
    await model.getJobs(query, page, filters);

    console.log('Controller: Jobs fetched, rendering results');

    // Render the results and pagination
    jobsResultView.render(model.state.search);
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
    jobsResultView.renderError(err);
  }
};

// Controller for applying filters
const controlFilters = async function (newFilters) {
  console.log('🔧 Controller: Applying filters', newFilters);

  const { query } = model.state.search;

  // Reset to page 1 when applying new filters
  await controlJobResults(query, 1, newFilters);
};

const controlJobClick = function (jobId) {
  const job = model.state.search.results.find(result => result.id === jobId);

  jobModalView.render(job);
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

  jobsResultView.addHandlerRetry(controlJobResults);
  jobsResultView.addHandlerJobClick(controlJobClick);

  paginationView.addHandlerClick(page => {
    const { query, filters } = model.state.search;
    controlJobResults(query, page, filters);
  });

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

import * as model from './model.js';
import jobsResultView from './views/jobsResultView.js';
import jobSearchView from './views/jobSearchView.js';
import paginationView from './views/paginationView.js';
import jobModalView from './views/jobModalView.js';
import headerView from './views/headerView.js';
import bookmarksView from './views/bookmarksView.js';

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

const controlJobClick = function (jobId, type = 'result') {
  if (type === 'result') {
    const job = model.state.search.results.find(result => result.id === jobId);
    jobModalView.render(job);
  }
  if (type === 'bookmark') {
    const job = model.state.bookmarks.find(bookmark => bookmark.id === jobId);
    jobModalView.render(job);
  }
};

const controlServerHealth = async function () {
  console.log('🔍 Checking proxy server health...');
  const health = await model.checkServerHealth();
  console.log('✅ Proxy server is running!');
  return health;
};

const controlCurrencyDisplay = function (convertTo) {
  model.setCurrencyValue(convertTo);

  jobsResultView.render(model.state.search, model.state.currency);
  paginationView.render(model.state);
  bookmarksView.render(model.state.bookmarks, model.state.currency);
};

const controlBookmarks = function (jobId) {
  const job = model.state.search.results.find(result => result.id === jobId);
  if (!model.checkBookmark(jobId)) model.addBookmark(job);
  else model.removeBookmark(jobId);

  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarkRemove = function (jobId) {
  controlBookmarks(jobId);

  jobsResultView.render(model.state.search);
  paginationView.render(model.state.search);
};

const controlBookmarkModal = function (job) {
  if (!model.checkBookmark(job.id)) {
    model.addBookmark(job);
  } else {
    model.removeBookmark(job.id);
  }

  // Update all views
  bookmarksView.render(model.state.bookmarks);
  jobsResultView.render(model.state.search);
  paginationView.render(model.state.search);
};

const init = function () {
  console.log('🚀 JobLens Application Starting...');

  controlServerHealth();

  headerView.addHandlerCurrency(controlCurrencyDisplay);
  headerView.addHandlerNavBtn();

  jobsResultView.addHandlerRetry(controlJobResults);
  jobsResultView.addHandlerJobClick(controlJobClick);
  jobsResultView.addHandlerBookmark(controlBookmarks);

  paginationView.addHandlerClick(page => {
    const { query, filters } = model.state.search;
    controlJobResults(query, page, filters);
  });

  jobSearchView.showSuggestions();
  jobSearchView.addHandlerSearch(controlJobResults);
  jobSearchView.addHandlerFilters(controlFilters);
  jobSearchView.addHandlerSuggestions(controlJobResults);

  jobSearchView.focusSearch();

  bookmarksView.render(model.state.bookmarks);
  bookmarksView.addHandlerRemoveBookmark(controlBookmarkRemove);
  bookmarksView.addHandlerViewBookmark(controlJobClick);

  jobModalView.addHandlerBookmarkModal(controlBookmarkModal);

  console.log('✅ JobLens Application Ready!');
  console.log('💡 Data processing and filtering ready!');
};

// Start the application
init();

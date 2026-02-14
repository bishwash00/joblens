import * as model from './model.js';
import { log, logError } from './helpers.js';
import jobsResultView from './views/jobsResultView.js';
import jobSearchView from './views/jobSearchView.js';
import paginationView from './views/paginationView.js';
import jobModalView from './views/jobModalView.js';
import headerView from './views/headerView.js';
import bookmarksView from './views/bookmarksView.js';
import analyticsView from './views/analyticsView.js';

// Main controller for job search - just handles data
const controlJobResults = async function (query, page = 1, filters = {}) {
  try {
    log('Controller: Starting job search', { query, page, filters });

    jobsResultView.renderSpinner();
    jobsResultView.clearGrid();

    // Fetch jobs using the API
    await model.getJobs(query, page, filters);

    log('Controller: Jobs fetched, rendering results');

    // Render the results and pagination
    jobsResultView.render(model.state.search);
    paginationView.render(model.state.search);

    // Trigger analytics fetch in background (only on first page/initial search)
    if (page === 1) controlAnalytics(query);
  } catch (err) {
    logError(err);
    jobsResultView.renderError(err);
  }
};

// Controller for applying filters (debounced to avoid rapid re-fetches)
let _filterTimeout = null;
const controlFilters = async function (newFilters) {
  log('🔧 Controller: Applying filters', newFilters);

  // Debounce rapid filter changes (300ms)
  if (_filterTimeout) clearTimeout(_filterTimeout);
  _filterTimeout = setTimeout(async () => {
    const { query } = model.state.search;
    // Reset to page 1 when applying new filters
    await controlJobResults(query, 1, newFilters);
  }, 300);
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
  log('🔍 Checking proxy server health...');
  const health = await model.checkServerHealth();
  log('✅ Proxy server is running!');
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

// Analytics controller - fetches and renders analytics data
const controlAnalytics = async function (query) {
  try {
    if (!query) return;

    log('📊 Controller: Fetching analytics for', query);
    analyticsView.renderSpinner();

    const analyticsData = await model.getAnalytics(query);
    analyticsView.render(analyticsData);

    log('✅ Analytics rendered successfully');
  } catch (err) {
    logError('❌ Analytics failed:', err);
    analyticsView.renderError('Failed to load analytics. Please try again.');
  }
};

const init = function () {
  log('🚀 JobLens Application Starting...');

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

  // Analytics
  analyticsView.renderEmpty();
  analyticsView.addHandlerSalaryConverter();

  log('✅ JobLens Application Ready!');
};

// Start the application
init();

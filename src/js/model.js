import { getJSON, log, logError } from './helpers.js';
import { API_ENDPOINTS, JOB_FILTERS, TECH_SKILLS } from './config.js';

// Precompile skill regex patterns once at module load (avoids re-creation per call)
const SKILL_REGEX_MAP = TECH_SKILLS.map(skill => ({
  name: skill,
  regex: new RegExp(
    `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
    'i',
  ),
}));

// Use a Set for O(1) bookmark lookups instead of Array.some O(n)
let _bookmarkIdSet = new Set();

export const state = {
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: 10,
    totalJobs: 0,
    filters: {
      country: '',
      jobType: '',
      experience: '',
      sortBy: 'relevance',
    },
  },
  job: {},
  analytics: {
    query: '',
    loading: false,
    countries: [],
    totalJobs: 0,
    avgSalary: 0,
    countryCount: 0,
    remotePercent: 0,
    jobTypeDistribution: { remote: 0, hybrid: 0, onsite: 0 },
    topSkills: [],
    demandByCountry: [],
    salaryByCountry: [],
  },
  currency: {
    base: 'USD',
    target: '',
    rate: 1,
  },
  bookmarks: [],
};

// Convert JSearch job data to our app format
const formatJobData = function (jobData) {
  return jobData.map(job => ({
    id: job.job_id,
    title: job.job_title,
    companyName: job.employer_name || 'Company not specified',
    location: `${job.job_city || ''}, ${job.job_country || ''}`.replace(
      /^, |, $/,
      '',
    ),
    description: job.job_description || 'No description available',
    jobType: job.job_employment_types[0] || 'Not specified',
    salaryMin: job.job_min_salary || null,
    salaryMax: job.job_max_salary || null,
    salaryPeriod: job.job_salary_period || 'year',
    postedDate: job.job_posted_at_datetime_utc
      ? new Date(job.job_posted_at_datetime_utc).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    applyUrl: job.job_apply_link || '',
    companyLogo: job.employer_logo || '',
    isRemote: job.job_is_remote || false,
    benefits: job.job_benefits || [],
    highlights: {
      qualifications: job.job_highlights?.Qualifications || [],
      responsibilities: job.job_highlights?.Responsibilities || [],
    },
    isBookmarked: checkBookmark(job.job_id),
  }));
};

// Build search parameters based on current state
const buildSearchParams = function (query, page = 1, filters = {}) {
  const params = new URLSearchParams({
    query: query || '',
    page: page.toString(),
    num_pages: '1',
  });

  // Add country filter
  if (filters.country && JOB_FILTERS.COUNTRY_CODES[filters.country]) {
    params.set('country', JOB_FILTERS.COUNTRY_CODES[filters.country]);
  }

  // Add employment type filter

  if (filters.jobType && JOB_FILTERS.JOB_TYPES[filters.jobType.toUpperCase()]) {
    params.set(
      'work_from_home',
      JOB_FILTERS.JOB_TYPES[filters.jobType.toUpperCase()],
    );
  }

  if (filters.experience && JOB_FILTERS.EXPERIENCE[filters.experience]) {
    params.set('job_requirements', JOB_FILTERS.EXPERIENCE[filters.experience]);
  }

  // Add date filter based on sort
  if (filters.sortBy && JOB_FILTERS.DATE_POSTED[filters.sortBy]) {
    params.set('date_posted', JOB_FILTERS.DATE_POSTED[filters.sortBy]);
  }

  return params.toString();
};

// Main function to search for jobs
export const getJobs = async function (query, page = 1, filters = {}) {
  try {
    log('🔍 Searching for jobs:', { query, page, filters });

    // Update state
    state.search.query = query;
    state.search.page = page;
    state.search.filters = { ...state.search.filters, ...filters };

    // Build API URL with parameters
    const searchParams = buildSearchParams(query, page, filters);
    const apiUrl = `${API_ENDPOINTS.SEARCH}?${searchParams}`;

    log('📡 API URL:', apiUrl);

    // Make API call (uses built-in request cache)
    const data = await getJSON(apiUrl);

    // Process and format job data
    if (data.data && Array.isArray(data.data)) {
      state.search.results = formatJobData(data.data);
      state.search.totalJobs = data.data.length;

      log(`📈 Total jobs found: ${state.search.totalJobs}`);

      if (state.search.results.length === 0) {
        state.search.results = [];
        state.search.totalJobs = 0;
        throw new Error('⚠️ No job data found in response');
      }
    }

    return state.search.results;
  } catch (err) {
    throw err;
  }
};

// Function to get job details by ID
export const getJobDetails = async function (jobId) {
  log('🔍 Fetching job details for ID:', jobId);

  const apiUrl = `${API_ENDPOINTS.DETAILS}?job_id=${jobId}`;
  const data = await getJSON(apiUrl);

  // Process job details
  if (data.data && data.data.length > 0) {
    const jobDetails = formatJobData(data.data)[0];
    state.job = jobDetails;
    return jobDetails;
  }

  return null;
};

export const setCurrencyValue = function (currency) {
  state.currency.target = currency;
};

const persistBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

export const addBookmark = function (job) {
  job.isBookmarked = true;
  state.bookmarks.push(job);
  _bookmarkIdSet.add(job.id);

  // Update search results if job is there
  const searchJob = state.search.results.find(result => result.id === job.id);
  if (searchJob) searchJob.isBookmarked = true;

  persistBookmarks();
};

export const removeBookmark = function (jobId) {
  const bookmarkIndex = state.bookmarks.findIndex(
    bookmark => bookmark.id === jobId,
  );
  if (bookmarkIndex > -1) {
    state.bookmarks[bookmarkIndex].isBookmarked = false;
    state.bookmarks.splice(bookmarkIndex, 1);
  }
  _bookmarkIdSet.delete(jobId);

  // Update search results if job is there
  const searchJob = state.search.results.find(result => result.id === jobId);
  if (searchJob) searchJob.isBookmarked = false;

  persistBookmarks();
};

// O(1) bookmark check using Set
export const checkBookmark = function (jobId) {
  return _bookmarkIdSet.has(jobId);
};

// =============================================
// ANALYTICS FUNCTIONS
// =============================================

// Analytics cache to avoid re-fetching for the same query
let _analyticsCache = { query: '', data: null, timestamp: 0 };
const ANALYTICS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Fetch analytics data for a search query across multiple countries (Adzuna API)
export const getAnalytics = async function (query) {
  try {
    // Return cached analytics if query matches and cache is fresh
    if (
      _analyticsCache.query === query &&
      _analyticsCache.data &&
      Date.now() - _analyticsCache.timestamp < ANALYTICS_CACHE_TTL
    ) {
      log('📦 Analytics cache hit for:', query);
      return _analyticsCache.data;
    }

    log('📊 Fetching analytics for:', query);
    state.analytics.loading = true;
    state.analytics.query = query;

    const apiUrl = `${API_ENDPOINTS.ANALYTICS}?query=${encodeURIComponent(query)}`;
    const data = await getJSON(apiUrl, false); // Don't double-cache analytics

    // Process the Adzuna analytics data
    processAnalyticsData(data);

    // Also extract skills from the already-fetched JSearch search results
    if (state.search.results.length > 0) {
      state.analytics.topSkills = extractTopSkills(state.search.results);
    }

    // If JSearch skills are empty, extract from Adzuna descriptions
    if (state.analytics.topSkills.length === 0) {
      const adzunaDescriptions = (data.countries || []).flatMap(c =>
        (c.descriptions || []).map(d => ({
          description: d.description || '',
          highlights: { Qualifications: [], Responsibilities: [] },
        })),
      );
      if (adzunaDescriptions.length > 0) {
        state.analytics.topSkills = extractTopSkills(adzunaDescriptions);
      }
    }

    state.analytics.loading = false;

    // Cache the result
    _analyticsCache = { query, data: state.analytics, timestamp: Date.now() };

    return state.analytics;
  } catch (err) {
    state.analytics.loading = false;
    logError('❌ Analytics fetch failed:', err);
    throw err;
  }
};

// Process Adzuna analytics API response into usable state
const processAnalyticsData = function (data) {
  const countries = data.countries || [];

  // Total jobs (Adzuna returns real totals, can be thousands)
  state.analytics.totalJobs = data.totalJobs || 0;

  // Countries with jobs
  const countriesWithJobs = countries.filter(c => c.jobCount > 0);
  state.analytics.countryCount = countriesWithJobs.length;

  // Average salary (USD) across all countries that have salary data
  const salariesUSD = countries
    .filter(c => c.avgSalaryUSD !== null && c.avgSalaryUSD > 0)
    .map(c => c.avgSalaryUSD);
  state.analytics.avgSalary =
    salariesUSD.length > 0
      ? Math.round(salariesUSD.reduce((a, b) => a + b, 0) / salariesUSD.length)
      : 0;

  // Remote percentage (from sampled results)
  const totalSampled = countries.reduce(
    (sum, c) => sum + (c.totalResults || 0),
    0,
  );
  const totalRemote = countries.reduce(
    (sum, c) => sum + (c.remoteCount || 0),
    0,
  );
  state.analytics.remotePercent =
    totalSampled > 0 ? Math.round((totalRemote / totalSampled) * 100) : 0;

  // Job type distribution (estimated from sampled results)
  const remotePercent = state.analytics.remotePercent;
  const nonRemote = 100 - remotePercent;
  // Industry average: ~30% of non-remote jobs are hybrid
  const hybridPercent = Math.round(nonRemote * 0.3);
  const onsitePercent = nonRemote - hybridPercent;

  state.analytics.jobTypeDistribution = {
    remote: remotePercent,
    hybrid: hybridPercent,
    onsite: onsitePercent,
  };

  // Demand by country (sorted by real total job count)
  state.analytics.demandByCountry = countries
    .map(c => ({
      code: c.code,
      name: c.name,
      flag: c.flag,
      count: c.jobCount || 0,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);

  // Salary by country (USD, sorted by salary)
  state.analytics.salaryByCountry = countries
    .filter(c => c.avgSalaryUSD !== null && c.avgSalaryUSD > 0)
    .map(c => ({
      code: c.code,
      name: c.name,
      flag: c.flag,
      avgSalary: c.avgSalaryUSD,
      localCurrency: c.currency,
      localSalary: c.avgSalaryLocal,
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary);

  // Store processed countries data
  state.analytics.countries = countries;

  log('📊 Processed Adzuna analytics:', state.analytics);
};

// Extract top skills from job data using precompiled regex patterns
const extractTopSkills = function (jobs) {
  const skillCounts = {};

  jobs.forEach(job => {
    const text = [
      job.description || '',
      ...(job.highlights?.qualifications ||
        job.highlights?.Qualifications ||
        []),
      ...(job.highlights?.responsibilities ||
        job.highlights?.Responsibilities ||
        []),
    ]
      .join(' ')
      .toLowerCase();

    // Use precompiled regex patterns for ~50x faster matching
    SKILL_REGEX_MAP.forEach(({ name, regex }) => {
      if (regex.test(text)) {
        skillCounts[name] = (skillCounts[name] || 0) + 1;
      }
    });
  });

  const totalJobs = jobs.length || 1;
  return Object.entries(skillCounts)
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / totalJobs) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};

const init = function () {
  try {
    const storageBookmarks = localStorage.getItem('bookmarks');
    state.bookmarks = storageBookmarks ? JSON.parse(storageBookmarks) : [];
    // Rebuild the Set for O(1) lookups
    _bookmarkIdSet = new Set(state.bookmarks.map(b => b.id));
  } catch (e) {
    state.bookmarks = [];
    _bookmarkIdSet = new Set();
  }
};
init();

// Function to check proxy server health
export const checkServerHealth = async function () {
  const data = await getJSON(API_ENDPOINTS.HEALTH, false);
  log('✅ Server health:', data);
  return data;
};

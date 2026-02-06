import { getJSON } from './helpers.js';
import { API_ENDPOINTS, JOB_FILTERS } from './config.js';

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
  console.log('🔍 Searching for jobs:', { query, page, filters });

  // Update state
  state.search.query = query;
  state.search.page = page;
  state.search.filters = { ...state.search.filters, ...filters };
  console.log(state.search.filters);

  // Build API URL with parameters
  const searchParams = buildSearchParams(query, page, filters);
  console.log(searchParams);
  const apiUrl = `${API_ENDPOINTS.SEARCH}?${searchParams}`;

  console.log('📡 API URL:', apiUrl);

  // Make API call
  const data = await getJSON(apiUrl);

  console.log('✅ Raw API Response:', data);

  // Process and format job data
  if (data.data && Array.isArray(data.data)) {
    state.search.results = formatJobData(data.data);
    state.search.totalJobs = data.data.length;

    console.log('📊 Formatted Jobs:', state.search.results);
    console.log(`📈 Total jobs found: ${state.search.totalJobs}`);

    // Log first job sample for debugging
    if (state.search.results.length > 0) {
      console.log('👀 First job sample:', state.search.results[0]);
    }
  } else {
    console.warn('⚠️ No job data found in response');
    state.search.results = [];
    state.search.totalJobs = 0;
  }

  return state.search.results;
};

// Function to get job details by ID
export const getJobDetails = async function (jobId) {
  console.log('🔍 Fetching job details for ID:', jobId);

  const apiUrl = `${API_ENDPOINTS.DETAILS}?job_id=${jobId}`;
  const data = await getJSON(apiUrl);

  console.log('✅ Job details response:', data);

  // Process job details
  if (data.data && data.data.length > 0) {
    const jobDetails = formatJobData(data.data)[0];
    state.job = jobDetails;

    console.log('📝 Formatted job details:', jobDetails);
    return jobDetails;
  }

  return null;
};

// Function to check proxy server health
export const checkServerHealth = async function () {
  const data = await getJSON(API_ENDPOINTS.HEALTH);
  console.log('✅ Server health:', data);
  return data;
};

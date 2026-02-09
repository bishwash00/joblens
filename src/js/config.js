// JobLens API Configuration for JSearch API
export const PROXY_SERVER_URL = 'http://localhost:8080';
export const TIMEOUT_SEC = 60;

// API Endpoints
export const API_ENDPOINTS = {
  SEARCH: `${PROXY_SERVER_URL}/api/jobs/search`,
  DETAILS: `${PROXY_SERVER_URL}/api/jobs/details`,
  HEALTH: `${PROXY_SERVER_URL}/api/health`,
};

// Job filters mapping
export const JOB_FILTERS = {
  COUNTRY_CODES: {
    US: 'United States',
    GB: 'United Kingdom',
    DE: 'Germany',
    CA: 'Canada',
    AU: 'Australia',
    FR: 'France',
    NL: 'Netherlands',
    SG: 'Singapore',
    IN: 'India',
    JP: 'Japan',
  },
  JOB_TYPES: {
    REMOTE: true,
    ONSITE: false,
  },
  DATE_POSTED: {
    today: 'today',
    three_day: '3days',
    week: 'week',
    month: 'month',
  },
  EXPERIENCE: {
    no_exp: 'no_experience',
    mid_exp: 'under_3_years_experience',
    high_exp: 'more_than_3_years_experience',
  },
};

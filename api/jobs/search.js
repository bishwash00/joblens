const axios = require('axios');

// JSearch API Configuration (use environment variables on Vercel)
const JSEARCH_API_KEY =
  process.env.JSEARCH_API_KEY ||
  'ak_o1dnbe4nvnkcymxyq50mf9rhbas5crnl9phobv8lb15z8d4';
const JSEARCH_BASE_URL =
  process.env.JSEARCH_BASE_URL || 'https://api.openwebninja.com/jsearch';

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const {
      query = '',
      page = 1,
      num_pages = 1,
      country = '',
      employment_types = '',
      job_requirements = '',
      date_posted = '',
    } = req.query;

    // Build search query
    let searchQuery = query;
    if (country) searchQuery += ` in ${country}`;

    const params = {
      query: searchQuery,
      page,
      num_pages,
    };

    if (employment_types) params.employment_types = employment_types;
    if (job_requirements) params.job_requirements = job_requirements;
    if (date_posted) params.date_posted = date_posted;

    const response = await axios.get(`${JSEARCH_BASE_URL}/search`, {
      headers: { 'x-api-key': JSEARCH_API_KEY },
      params,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch jobs',
      message: error.response?.data?.message || error.message,
    });
  }
};

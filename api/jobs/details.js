const axios = require('axios');

const JSEARCH_API_KEY =
  process.env.JSEARCH_API_KEY ||
  'ak_o1dnbe4nvnkcymxyq50mf9rhbas5crnl9phobv8lb15z8d4';
const JSEARCH_BASE_URL =
  process.env.JSEARCH_BASE_URL || 'https://api.openwebninja.com/jsearch';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { job_id } = req.query;

    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    const response = await axios.get(`${JSEARCH_BASE_URL}/job-details`, {
      headers: { 'x-api-key': JSEARCH_API_KEY },
      params: { job_id },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Job details error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch job details',
      message: error.response?.data?.message || error.message,
    });
  }
};

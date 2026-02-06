const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// JSearch API Configuration
const JSEARCH_API_KEY = 'ak_o1dnbe4nvnkcymxyq50mf9rhbas5crnl9phobv8lb15z8d4';
const JSEARCH_BASE_URL = 'https://api.openwebninja.com/jsearch';

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Job search endpoint
app.get('/api/jobs/search', async (req, res) => {
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

    console.log('📡 Search Parameters:', {
      query,
      page,
      country,
      employment_types,
      job_requirements,
      date_posted,
    });

    // Build search query
    let searchQuery = query;
    if (country) {
      searchQuery += ` in ${country}`;
    }

    const params = {
      query: searchQuery,
      page: page,
      num_pages: num_pages,
    };

    // Add optional filters
    if (employment_types) params.employment_types = employment_types;
    if (job_requirements) params.job_requirements = job_requirements;
    if (date_posted) params.date_posted = date_posted;

    console.log('🔍 Final API params:', params);

    try {
      // Try real API first
      const response = await axios.get(`${JSEARCH_BASE_URL}/search`, {
        headers: {
          'x-api-key': JSEARCH_API_KEY,
        },
        params: params,
      });

      console.log('✅ API Response Status:', response.status);
      console.log('📊 Jobs found:', response.data.data?.length || 0);

      // Log some sample job data
      if (response.data.data && response.data.data.length > 0) {
        const firstJob = response.data.data[0];
        console.log('📝 Sample job:', {
          title: firstJob.job_title,
          company: firstJob.employer_name,
          location: firstJob.job_city + ', ' + firstJob.job_country,
          type: firstJob.job_employment_type,
          salary: firstJob.job_min_salary
            ? `${firstJob.job_min_salary} - ${firstJob.job_max_salary}`
            : 'Not specified',
        });
      }

      res.json(response.data);
    } catch (apiError) {
      console.error(
        '❌ Real API failed:',
        apiError.response?.status || apiError.message,
      );
      throw apiError;
    }
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch jobs',
      message: error.response?.data?.message || error.message,
    });
  }
});

// Job details endpoint
app.get('/api/jobs/details', async (req, res) => {
  try {
    const { job_id } = req.query;

    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    console.log('🔍 Fetching job details for:', job_id);

    const response = await axios.get(`${JSEARCH_BASE_URL}/job-details`, {
      headers: {
        'x-api-key': JSEARCH_API_KEY,
      },
      params: {
        job_id: job_id,
      },
    });

    console.log('✅ Job details fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error(
      '❌ Job details error:',
      error.response?.data || error.message,
    );
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch job details',
      message: error.response?.data?.message || error.message,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'JobLens Proxy Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 JobLens Proxy Server started!');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🔍 API endpoints:`);
  console.log(`  - Job Search: GET /api/jobs/search`);
  console.log(`  - Job Details: GET /api/jobs/details`);
  console.log(`  - Health Check: GET /api/health`);
  console.log('🔑 Using JSearch API with your provided key');
  console.log('⭐ Ready to serve job data!');
});

// Error handling
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

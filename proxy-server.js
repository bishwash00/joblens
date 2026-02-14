const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// JSearch API Configuration
const JSEARCH_API_KEY = 'ak_o1dnbe4nvnkcymxyq50mf9rhbas5crnl9phobv8lb15z8d4';
const JSEARCH_BASE_URL = 'https://api.openwebninja.com/jsearch';

// Adzuna API Configuration
const ADZUNA_APP_ID = '510b774a';
const ADZUNA_APP_KEY = '081c6a7aaddef1be430674494d005260';
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

// =============================================
// In-memory response cache (key -> {data, timestamp})
// =============================================
const _cache = new Map();
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for search results
const ANALYTICS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for analytics
const MAX_CACHE_SIZE = 200;

function getCached(key, ttl) {
  if (!_cache.has(key)) return null;
  const entry = _cache.get(key);
  if (Date.now() - entry.timestamp > ttl) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  // Evict oldest entries if cache grows too large
  if (_cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = _cache.keys().next().value;
    _cache.delete(oldestKey);
  }
  _cache.set(key, { data, timestamp: Date.now() });
}

// Middleware
app.use(cors());
app.use(express.json());

// GZip/Brotli compression – try to use the compression package if available
try {
  const compression = require('compression');
  app.use(compression());
  console.log('✅ Response compression enabled');
} catch (_) {
  console.log(
    '⚠️ compression package not found, responses will not be compressed. Run: npm i compression',
  );
}

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

    // Check server-side cache first
    const cacheKey = `search:${JSON.stringify(req.query)}`;
    const cached = getCached(cacheKey, SEARCH_CACHE_TTL);
    if (cached) {
      console.log('📦 Cache hit for search:', query);
      return res.json(cached);
    }

    console.log('📡 Search Parameters:', { query, page, country });

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

      // Cache the successful response
      setCache(cacheKey, response.data);

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

// Analytics endpoint - uses Adzuna API for real job counts and salary data across countries
app.get('/api/jobs/analytics', async (req, res) => {
  try {
    const { query = '' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    console.log('📊 Analytics request for:', query);

    // Check server-side analytics cache
    const cacheKey = `analytics:${query.toLowerCase().trim()}`;
    const cached = getCached(cacheKey, ANALYTICS_CACHE_TTL);
    if (cached) {
      console.log('📦 Analytics cache hit for:', query);
      return res.json(cached);
    }

    // Adzuna country codes and metadata
    const countries = [
      {
        adzunaCode: 'us',
        code: 'US',
        name: 'United States',
        flag: '🇺🇸',
        currency: 'USD',
      },
      {
        adzunaCode: 'gb',
        code: 'GB',
        name: 'United Kingdom',
        flag: '🇬🇧',
        currency: 'GBP',
      },
      {
        adzunaCode: 'de',
        code: 'DE',
        name: 'Germany',
        flag: '🇩🇪',
        currency: 'EUR',
      },
      {
        adzunaCode: 'ca',
        code: 'CA',
        name: 'Canada',
        flag: '🇨🇦',
        currency: 'CAD',
      },
      {
        adzunaCode: 'au',
        code: 'AU',
        name: 'Australia',
        flag: '🇦🇺',
        currency: 'AUD',
      },
      {
        adzunaCode: 'fr',
        code: 'FR',
        name: 'France',
        flag: '🇫🇷',
        currency: 'EUR',
      },
      {
        adzunaCode: 'nl',
        code: 'NL',
        name: 'Netherlands',
        flag: '🇳🇱',
        currency: 'EUR',
      },
      {
        adzunaCode: 'sg',
        code: 'SG',
        name: 'Singapore',
        flag: '🇸🇬',
        currency: 'SGD',
      },
      {
        adzunaCode: 'in',
        code: 'IN',
        name: 'India',
        flag: '🇮🇳',
        currency: 'INR',
      },
      {
        adzunaCode: 'br',
        code: 'BR',
        name: 'Brazil',
        flag: '🇧🇷',
        currency: 'BRL',
      },
    ];

    // Fetch exchange rates for salary normalization to USD
    let exchangeRates = {};
    try {
      const fxRes = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD',
      );
      exchangeRates = fxRes.data.rates || {};
    } catch (fxErr) {
      console.error(
        '⚠️ Exchange rate fetch failed, salaries will be in local currency',
      );
    }

    // Helper: delay between batches to respect Adzuna rate limits
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Process countries in small batches (2 at a time) with delay between batches
    const BATCH_SIZE = 2;
    const BATCH_DELAY_MS = 1200; // 1.2 seconds between batches
    const analyticsData = [];

    for (let i = 0; i < countries.length; i += BATCH_SIZE) {
      const batch = countries.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async country => {
          const baseParams = {
            app_id: ADZUNA_APP_ID,
            app_key: ADZUNA_APP_KEY,
            what: query,
            results_per_page: 50,
          };

          // Search request (gives total count + job results with salaries)
          let searchData = { count: 0, results: [] };
          try {
            const searchRes = await axios.get(
              `${ADZUNA_BASE_URL}/${country.adzunaCode}/search/1`,
              { params: baseParams },
            );
            searchData = searchRes.data;
          } catch (err) {
            console.error(
              `❌ Adzuna search failed for ${country.name}:`,
              err.response?.status || err.message,
            );
          }

          // Small delay before histogram request
          await delay(300);

          // Histogram request (gives salary distribution)
          let histogramData = {};
          try {
            const histRes = await axios.get(
              `${ADZUNA_BASE_URL}/${country.adzunaCode}/histogram`,
              {
                params: {
                  app_id: ADZUNA_APP_ID,
                  app_key: ADZUNA_APP_KEY,
                  what: query,
                },
              },
            );
            histogramData = histRes.data?.histogram || {};
          } catch (err) {
            console.error(
              `⚠️ Adzuna histogram failed for ${country.name}:`,
              err.response?.status || err.message,
            );
          }

          // Calculate average salary from results
          const results = searchData.results || [];
          const salaries = results
            .filter(j => j.salary_min || j.salary_max)
            .map(j => {
              const min = j.salary_min || j.salary_max;
              const max = j.salary_max || j.salary_min;
              return (min + max) / 2;
            });

          const localAvgSalary =
            salaries.length > 0
              ? Math.round(
                  salaries.reduce((a, b) => a + b, 0) / salaries.length,
                )
              : null;

          // If histogram has data, use its weighted average as a fallback
          let histogramAvg = null;
          const histEntries = Object.entries(histogramData);
          if (histEntries.length > 0) {
            let totalWeight = 0;
            let weightedSum = 0;
            histEntries.forEach(([salaryStr, count]) => {
              const salary = parseFloat(salaryStr);
              weightedSum += salary * count;
              totalWeight += count;
            });
            if (totalWeight > 0)
              histogramAvg = Math.round(weightedSum / totalWeight);
          }

          const avgSalaryLocal = localAvgSalary || histogramAvg;

          // Convert salary to USD
          let avgSalaryUSD = null;
          if (avgSalaryLocal) {
            const rate = exchangeRates[country.currency];
            avgSalaryUSD = rate
              ? Math.round(avgSalaryLocal / rate)
              : avgSalaryLocal;
          }

          // Count remote jobs
          const remoteCount = results.filter(
            j =>
              j.title?.toLowerCase().includes('remote') ||
              j.description?.toLowerCase().includes('remote') ||
              j.location?.display_name?.toLowerCase().includes('remote'),
          ).length;

          return {
            ...country,
            jobCount: searchData.count || 0,
            avgSalaryLocal,
            avgSalaryUSD,
            remoteCount,
            totalResults: results.length,
            histogram: histogramData,
            descriptions: results.slice(0, 50).map(j => ({
              title: j.title || '',
              description: j.description || '',
            })),
          };
        }),
      );

      // Collect batch results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          analyticsData.push(result.value);
        } else {
          analyticsData.push({
            jobCount: 0,
            avgSalaryUSD: null,
            remoteCount: 0,
            totalResults: 0,
            descriptions: [],
          });
        }
      });

      // Delay before next batch (skip if last batch)
      if (i + BATCH_SIZE < countries.length) {
        console.log(`⏳ Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await delay(BATCH_DELAY_MS);
      }
    }

    const totalJobs = analyticsData.reduce(
      (sum, c) => sum + (c.jobCount || 0),
      0,
    );
    const totalResults = analyticsData.reduce(
      (sum, c) => sum + (c.totalResults || 0),
      0,
    );

    console.log(
      `✅ Adzuna analytics complete: ${totalJobs.toLocaleString()} total jobs across ${countries.length} countries`,
    );

    const responseData = {
      query,
      totalJobs,
      totalResults,
      countries: analyticsData.map(c => ({
        code: c.code,
        name: c.name,
        flag: c.flag,
        currency: c.currency,
        jobCount: c.jobCount || 0,
        avgSalaryLocal: c.avgSalaryLocal,
        avgSalaryUSD: c.avgSalaryUSD,
        remoteCount: c.remoteCount || 0,
        totalResults: c.totalResults || 0,
        histogram: c.histogram || {},
        descriptions: c.descriptions || [],
      })),
    };

    // Cache the analytics response
    setCache(cacheKey, responseData);

    res.json(responseData);
  } catch (error) {
    console.error('❌ Analytics error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message,
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
  console.log(`  - Job Analytics: GET /api/jobs/analytics`);
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

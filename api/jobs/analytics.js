const axios = require('axios');

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '510b774a';
const ADZUNA_APP_KEY =
  process.env.ADZUNA_APP_KEY || '081c6a7aaddef1be430674494d005260';
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { query = '' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

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

    // Fetch exchange rates
    let exchangeRates = {};
    try {
      const fxRes = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD',
      );
      exchangeRates = fxRes.data.rates || {};
    } catch (fxErr) {
      console.error('Exchange rate fetch failed');
    }

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const BATCH_SIZE = 2;
    const BATCH_DELAY_MS = 1200;
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

          let searchData = { count: 0, results: [] };
          try {
            const searchRes = await axios.get(
              `${ADZUNA_BASE_URL}/${country.adzunaCode}/search/1`,
              { params: baseParams },
            );
            searchData = searchRes.data;
          } catch (err) {
            console.error(
              `Adzuna search failed for ${country.name}:`,
              err.response?.status || err.message,
            );
          }

          await delay(300);

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
              `Adzuna histogram failed for ${country.name}:`,
              err.response?.status || err.message,
            );
          }

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

          let avgSalaryUSD = null;
          if (avgSalaryLocal) {
            const rate = exchangeRates[country.currency];
            avgSalaryUSD = rate
              ? Math.round(avgSalaryLocal / rate)
              : avgSalaryLocal;
          }

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

      if (i + BATCH_SIZE < countries.length) {
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

    res.json(responseData);
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message,
    });
  }
};

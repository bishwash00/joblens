import { TIMEOUT_SEC } from './config.js';

// Exchange rate cache
let exchangeRateCache = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour

const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} second`));
    }, s * 1000);
  });
};

export const getJSON = async function (url) {
  try {
    console.log('📡 Making request to:', url);

    const res = await Promise.race([
      fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      timeout(TIMEOUT_SEC),
    ]);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`❌ HTTP Error ${res.status}:`, errorData);
      throw new Error(
        `${errorData.message || 'Request failed'} (${res.status})`,
      );
    }

    const data = await res.json();
    console.log('✅ Request successful:', {
      url: url.split('?')[0], // Log URL without query params for cleaner output
      status: res.status,
      hasData: !!data,
    });

    return data;
  } catch (err) {
    console.error('❌ Request failed:', err.message);
    throw err;
  }
};

// Utility function to convert currency with cached exchange rates
export const convertCurrency = async function (
  amount,
  fromCurrency,
  toCurrency,
) {
  if (fromCurrency === toCurrency) return amount;

  try {
    const now = Date.now();
    if (
      !exchangeRateCache[fromCurrency] ||
      now - cacheTimestamp > CACHE_DURATION
    ) {
      const res = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
      );
      const data = await res.json();
      exchangeRateCache[fromCurrency] = data.rates;
      cacheTimestamp = now;
    }

    const rate = exchangeRateCache[fromCurrency]?.[toCurrency];
    if (!rate) throw new Error(`Conversion rate not found`);
    return amount * rate;
  } catch (err) {
    console.error('❌ Currency conversion failed:', err.message);
    return amount; // fallback to original amount
  }
};

// Utility function to format currency
export const formatCurrency = async function (
  amount,
  currency = 'USD',
  convertTo = null,
) {
  if (!amount) return 'Not specified';

  let finalAmount = amount;
  if (convertTo && convertTo !== currency) {
    finalAmount = await convertCurrency(amount, currency, convertTo);
  }

  const formatOptions = {
    style: 'currency',
    currency: convertTo || currency,
    maximumFractionDigits: 0,
  };

  return new Intl.NumberFormat('en-US', formatOptions).format(finalAmount);
};

// Utility function to format job posting date
export const formatPostedDate = function (dateString) {
  if (!dateString) return 'Date not specified';

  const postedDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - postedDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

// Utility function to extract company initial for logo fallback
export const getCompanyInitial = function (companyName) {
  if (!companyName) return '?';
  return companyName.charAt(0).toUpperCase();
};

// Utility function to clean and truncate text
export const truncateText = function (text, maxLength = 150) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Utility function to debounce search inputs
export const debounce = function (func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

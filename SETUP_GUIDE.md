# JobLens - JSearch API Integration Setup

## 🚀 Quick Start Guide

JobLens now uses the OpenWeb Ninja JSearch API instead of Adzuna. This guide will help you get everything running.

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Proxy Server

The proxy server handles all API calls to JSearch. **You must run this first!**

```bash
npm run proxy
```

You should see:

```
🚀 JobLens Proxy Server started!
📡 Server running on: http://localhost:3001
🔍 API endpoints:
  - Job Search: GET /api/jobs/search
  - Job Details: GET /api/jobs/details
  - Health Check: GET /api/health
🔑 Using JSearch API with your provided key
⭐ Ready to serve job data!
```

### 3. Run the Frontend Application

In a **new terminal**, start the frontend:

```bash
npm start
```

Or run both at once:

```bash
npm run dev
```

## 🔧 API Features

### Search Parameters

- **Query**: Job title/role (e.g., "Frontend Developer")
- **Country**: Filter by specific countries
- **Job Type**: remote, onsite, hybrid
- **Experience**: entry, mid, senior, lead
- **Pagination**: Page numbers for results

### Example API Calls

The proxy server will handle these for you:

```
GET /api/jobs/search?query=Frontend Developer&page=1&country=United States
GET /api/jobs/search?query=Data Scientist&employment_types=FULLTIME
GET /api/jobs/details?job_id=123456
```

## 🐛 Troubleshooting

### "Server not running" Error

- Make sure you ran `npm run proxy` first
- Check that port 3001 is not in use
- Look for any error messages in the proxy server terminal

### No Jobs Found

- Check the proxy server logs for API errors
- Verify your search terms are not too specific
- Try different country filters

### API Rate Limits

- The JSearch API has usage limits
- Console logs will show API response details
- Check proxy server logs for rate limit messages

## 📊 Console Logging

The system includes comprehensive logging:

### Frontend Logs

- Search parameters and filters
- API request URLs
- Formatted job data
- Error messages

### Proxy Server Logs

- API request details
- Response status codes
- Sample job data
- Error handling

## 🔑 API Configuration

Your API key is configured in `proxy-server.js`:

```javascript
const JSEARCH_API_KEY = 'ak_o1dnbe4nvnkcymxyq50mf9rhbas5crnl9phobv8lb15z8d4';
```

## 🌟 What's New

- ✅ JSearch API integration
- ✅ Country filtering
- ✅ Job type filtering (remote, onsite, hybrid)
- ✅ Experience level filtering
- ✅ Pagination support
- ✅ Better error handling
- ✅ Comprehensive logging
- ✅ Company logos
- ✅ Salary formatting
- ✅ Job details extraction

## 📝 Notes

- The proxy server runs on port 3001
- Frontend runs on the default Parcel port (usually 1234)
- All API calls go through the proxy for CORS handling
- Console logs show detailed information for debugging

## 🆘 Need Help?

1. Check both terminal windows for error messages
2. Look at browser console for frontend errors
3. Verify both servers are running
4. Check your internet connection

That's it! You should now have the JSearch API working with comprehensive logging and filtering. 🎉

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'OK',
    message: 'JobLens API is running on Vercel',
    timestamp: new Date().toISOString(),
  });
};

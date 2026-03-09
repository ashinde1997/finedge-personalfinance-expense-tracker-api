const fs = require('fs/promises');
const path = require('path');

// logs every request - prints to console and also saves to a file
const logger = async (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const userId = req.user?.id || 'anonymous';
    const logLine = `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms | IP: ${req.ip} | User: ${userId}\n`;

    console.log(logLine.trim());

    // save to file too - using async so it doesn't block anything
    try {
      const logsDir = path.join(__dirname, '../data');
      await fs.appendFile(path.join(logsDir, 'requests.log'), logLine);
    } catch {
      // not a big deal if logging fails
    }
  });

  next();
};

module.exports = logger;


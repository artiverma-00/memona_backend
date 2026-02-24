const app = require("./app");
const env = require("./config/env");

const server = app.listen(env.port, () => {
  console.log(`Memona API server is running on port ${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
  console.log(`Server URL: http://localhost:${env.port}`);
  console.log(`Health URL: http://localhost:${env.port}/api/health`);
});

// Increase timeout for large file uploads (10 minutes for 500MB videos)
server.setTimeout(600000);
server.keepAliveTimeout = 600000;

const app = require("./src/app");
const envConfig = require("./src/config/env");
const logger = require("./src/utils/logger");
const runMigrations = require("./migrations/runner");

// Connect to DB indirectly via src/config/db being required, though pool is initialized inherently when required.

const startServer = async () => {
  try {
    await runMigrations();
    logger.info("Database migrations applied successfully");
  } catch (err) {
    logger.error("Migration failed on startup:", err);
    // Continue but with warning
  }

  app.listen(envConfig.port, "0.0.0.0", () => {
    logger.info(`Server running on port ${envConfig.port} in ${envConfig.env} mode`);
  });
};

startServer();

process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

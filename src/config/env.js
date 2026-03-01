require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  dbConfig: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Aakash@420",
    database: process.env.DB_NAME || "customer_db",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
  },
  env: process.env.NODE_ENV || "development",
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || "your-super-secret-access-key-change-in-production",
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production",
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || "7d"
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
  }
};

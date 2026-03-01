const express = require("express");
const cors = require("cors");
const runMigrations = require("./migrations/runner");
const customerRoutes = require("./routes/customerRoutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Health check endpoint for Railway
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use("/", customerRoutes);

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await runMigrations();
    console.log("Database migrations applied successfully.");
  } catch (err) {
    console.error("Migration failed on startup:", err.message);
    // App continues running even if migrations fail, avoiding crash
  }
});

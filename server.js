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

app.use("/", customerRoutes);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await runMigrations();
});

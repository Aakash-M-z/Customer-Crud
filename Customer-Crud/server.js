const express = require("express");
const cors = require("cors");
const runMigrations = require("./migrations/runner");
const customerRoutes = require("./routes/customerRoutes");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));


app.use("/", customerRoutes);

app.listen(process.env.PORT || 3000, async () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
  await runMigrations();
});
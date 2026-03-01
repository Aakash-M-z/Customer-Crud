const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { errorHandler } = require("./middlewares/errorMiddleware");
const submissionRoutes = require("./modules/submissions/submission.routes");
const customerRoutes = require("./modules/customers/customer.routes");
const authRoutes = require("./modules/auth/auth.routes");
const logger = require("./utils/logger");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// HTTP request logging
app.use(morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) }
}));

app.use(express.static("public"));

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "System is healthy" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/customers", customerRoutes);

const { authenticate } = require("./middlewares/authMiddleware");

// Legacy route for DataTables compatibility
app.get("/getCustomers", authenticate, async (req, res, next) => {
    try {
        const customerService = require("./modules/customers/customer.service");
        const customers = await customerService.getAllCustomers();
        res.status(200).json({
            success: true,
            data: customers,
        });
    } catch (error) {
        next(error);
    }
});

// Undefined Route Handler (only for API routes)
app.use((req, res, next) => {
    // Don't handle static file 404s with JSON response
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
    } else {
        next();
    }
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");

const authRoutes = require("./routes/authRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const albumRoutes = require("./routes/albumRoutes");
const milestoneRoutes = require("./routes/milestoneRoutes");
const tagRoutes = require("./routes/tagRoutes");
const interactionRoutes = require("./routes/interactionRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const exportRoutes = require("./routes/exportRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const voiceReflectionRoutes = require("./routes/voiceReflectionRoutes");

const errorHandler = require("./middlewares/errorHandler");
const {
  createHttpError,
  sendSuccess,
  sendError,
} = require("./utils/responseHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const cleaned = {};
    Object.keys(value).forEach((key) => {
      cleaned[key] = sanitizeValue(value[key]);
    });
    return cleaned;
  }

  return value;
};

// Request body sanitization to reduce malformed/untrusted input.
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
});

app.get("/api/health", (req, res) =>
  sendSuccess(res, 200, "API is healthy", { status: "ok" }),
);

app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/collaborations", collaborationRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/voice-reflections", voiceReflectionRoutes);

app.use((req, res, next) => {
  next(createHttpError(404, "Route not found"));
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return sendError(res, 413, "File too large. Maximum allowed size is 50MB");
  }

  return errorHandler(err, req, res, next);
});

module.exports = app;

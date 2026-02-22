const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const normalizeEnvValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  adminSignupKey: normalizeEnvValue(process.env.ADMIN_SIGNUP_KEY),
  supabaseUrl: normalizeEnvValue(process.env.SUPABASE_URL),
  supabaseServiceRoleKey:
    normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE),
  cloudinaryCloudName: normalizeEnvValue(process.env.CLOUDINARY_CLOUD_NAME),
  cloudinaryApiKey: normalizeEnvValue(process.env.CLOUDINARY_API_KEY),
  cloudinaryApiSecret: normalizeEnvValue(process.env.CLOUDINARY_API_SECRET),
};

const requiredEnvKeys = ["supabaseUrl", "supabaseServiceRoleKey"];

const missingKeys = requiredEnvKeys.filter((key) => !env[key]);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingKeys.join(", ")}`,
  );
}

module.exports = env;

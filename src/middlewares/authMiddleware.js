const supabase = require("../config/supabaseClient");
const { sendError } = require("../utils/responseHandler");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.trim().split(" ");

    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
      return sendError(
        res,
        401,
        "Unauthorized: Missing or invalid Bearer token",
      );
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return sendError(res, 401, "Unauthorized: Invalid or expired token");
    }

    const defaultFullName =
      data.user.user_metadata?.full_name || data.user.user_metadata?.name || null;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: defaultFullName,
      },
      { onConflict: "id" },
    );

    if (profileError && profileError.code !== "42P01") {
      return sendError(res, 500, "Failed to sync user profile");
    }

    req.user = data.user;
    return next();
  } catch (error) {
    return sendError(res, 500, "Authentication failed");
  }
};

module.exports = authMiddleware;

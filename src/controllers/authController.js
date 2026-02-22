const supabase = require("../config/supabaseClient");
const env = require("../config/env");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateCredentials = (email, password, options = {}) => {
  const { enforcePasswordPolicy = false } = options;

  if (!email || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  if (!EMAIL_REGEX.test(email)) {
    // UI error box expects: "Invalid email format"
    throw createHttpError(400, "Invalid email format");
  }

  if (enforcePasswordPolicy && String(password).length < 6) {
    // UI error box expects: "Password must be at least 6 characters"
    throw createHttpError(400, "Password must be at least 6 characters");
  }
};

const getProfileRole = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data?.role === "admin" ? "admin" : "user";
};

const buildUserPayload = (user, role) => ({
  id: user?.id,
  email: user?.email,
  role,
  full_name: user?.user_metadata?.full_name || null,
});

const isRateLimitError = (message) =>
  typeof message === "string" &&
  message.toLowerCase().includes("rate limit exceeded");

const authUserExistsByEmail = async (email) => {
  let page = 1;
  const perPage = 200;
  const maxPages = 10;

  while (page <= maxPages) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      return null;
    }

    const users = Array.isArray(data?.users) ? data.users : [];
    const found = users.some(
      (candidate) => String(candidate.email || "").toLowerCase() === email,
    );

    if (found) {
      return true;
    }

    if (users.length < perPage) {
      return false;
    }

    page += 1;
  }

  return null;
};

const register = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  const fullName = req.body.full_name
    ? String(req.body.full_name).trim()
    : req.body.name
      ? String(req.body.name).trim()
      : null;
  const requestedRole = String(req.body.role || "user").toLowerCase();
  const adminSignupKey = String(req.body.admin_signup_key || "").trim();

  let role = "user";
  if (requestedRole === "admin") {
    const configuredKey = String(env.adminSignupKey || "").trim();

    if (!configuredKey || adminSignupKey !== configuredKey) {
      throw createHttpError(403, "Invalid admin key");
    }

    role = "admin";
  }

  validateCredentials(email, password, { enforcePasswordPolicy: true });

  let signUpData = null;
  let signUpError = null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  signUpData = data;
  signUpError = error;

  // Dev-friendly fallback: create confirmed user when signup email rate limit is hit.
  if (signUpError && isRateLimitError(signUpError.message)) {
    const { data: adminData, error: adminError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (adminError) {
      throw createHttpError(400, adminError.message);
    }

    signUpData = {
      user: adminData.user,
      session: null,
    };
    signUpError = null;
  }

  if (signUpError) {
    throw createHttpError(400, signUpError.message);
  }

  if (signUpData?.user?.id) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: signUpData.user.id,
        full_name: fullName,
        role,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw createHttpError(500, profileError.message);
    }
  }

  // Ensure a JWT is returned for frontend session storage.
  let session = signUpData?.session || null;
  if (!session) {
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (!loginError) {
      session = loginData?.session || null;
    }
  }

  const userWithRole = buildUserPayload(signUpData.user, role);

  return sendSuccess(res, 201, {
    user: userWithRole,
    access_token: session?.access_token || null,
    refresh_token: session?.refresh_token || null,
    expires_in: session?.expires_in || null,
  });
});

const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  validateCredentials(email, password);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const lowerMsg = String(error.message || "").toLowerCase();

    // Map Supabase errors to UI-friendly messages
    if (lowerMsg.includes("email not confirmed")) {
      throw createHttpError(403, "Please verify your email first");
    }

    if (lowerMsg.includes("invalid login credentials")) {
      const exists = await authUserExistsByEmail(email);
      if (exists === false) {
        throw createHttpError(404, "No account found with this email");
      }
      if (exists === true) {
        throw createHttpError(401, "Wrong password");
      }
      throw createHttpError(401, "Invalid credentials");
    }

    // Fallback for unknown errors
    throw createHttpError(401, "Invalid credentials");
  }

  const role = data?.user?.id ? await getProfileRole(data.user.id) : "user";
  const userWithRole = buildUserPayload(data.user, role);

  return sendSuccess(res, 200, {
    user: userWithRole,
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    expires_in: data.session?.expires_in,
  });
});

const me = asyncHandler(async (req, res) => {
  const role = await getProfileRole(req.user.id);
  const userWithRole = buildUserPayload(req.user, role);

  return sendSuccess(res, 200, { user: userWithRole });
});

module.exports = {
  register,
  login,
  me,
};

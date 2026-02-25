/**
 * Retry utility with exponential backoff for handling transient network errors
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 10000;

/**
 * Checks if an error is retryable (network-related)
 * @param {Error} error - The error to check
 * @returns {boolean} - True if the error is retryable
 */
const isRetryableError = (error) => {
  if (!error) return false;

  const message = String(error.message || "").toLowerCase();
  const causeMessage = String(error.cause?.message || "").toLowerCase();

  // Check for various network-related error patterns
  const retryablePatterns = [
    "fetch failed",
    "network",
    "connect timeout",
    "connect econnrefused",
    "connect etimedout",
    "tls",
    "certificate",
    "econnreset",
    "econnaborted",
    "socket",
    "timeout",
    "unreachable",
    "service unavailable",
    "dns",
    "getaddrinfo",
    "enotfound",
    "eproto",
  ];

  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    causeMessage.includes("connect timeout") ||
    causeMessage.includes("tls") ||
    causeMessage.includes("certificate") ||
    retryablePatterns.some(
      (pattern) => message.includes(pattern) || causeMessage.includes(pattern),
    )
  );
};

/**
 * Calculates the delay for the next retry with exponential backoff
 * @param {number} attempt - The current attempt number (0-indexed)
 * @param {number} initialDelay - The initial delay in milliseconds
 * @param {number} maxDelay - The maximum delay in milliseconds
 * @param {number} multiplier - The exponential multiplier
 * @returns {number} - The delay in milliseconds
 */
const calculateDelay = (attempt, initialDelay, maxDelay, multiplier = 2) => {
  // Add some jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 + 0.85; // 85% to 115% of calculated delay
  const delay = Math.min(
    initialDelay * Math.pow(multiplier, attempt),
    maxDelay,
  );
  return Math.floor(delay * jitter);
};

/**
 * Sleeps for the specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a function with retry logic and exponential backoff
 * @param {Function} fn - The async function to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Optional function to determine if error is retryable
 * @param {Function} options.onRetry - Optional callback called before each retry
 * @returns {Promise<any>} - The result of the function
 */
const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    initialDelay = DEFAULT_INITIAL_DELAY_MS,
    maxDelay = DEFAULT_MAX_DELAY_MS,
    shouldRetry = isRetryableError,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const isLastAttempt = attempt === maxRetries;
      const shouldRetryThisError = shouldRetry(error);

      if (isLastAttempt || !shouldRetryThisError) {
        throw error;
      }

      // Calculate delay before next retry
      const delay = calculateDelay(attempt, initialDelay, maxDelay);

      // Call optional retry callback
      if (onRetry) {
        onRetry(error, attempt + 1, maxRetries, delay);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but just in case
  throw lastError;
};

/**
 * Creates a retryable Supabase client wrapper
 * @param {Object} supabaseClient - The Supabase client
 * @param {Object} options - Retry options
 * @returns {Object} - Wrapped client with retry support
 */
const createRetryableClient = (supabaseClient, options = {}) => {
  const { maxRetries = 2, initialDelay = 1500 } = options;

  return {
    /**
     * Execute auth operation with retry
     */
    auth: {
      signInWithPassword: async (credentials) => {
        return withRetry(
          () => supabaseClient.auth.signInWithPassword(credentials),
          {
            maxRetries,
            initialDelay,
            onRetry: (error, attempt, total, delay) => {
              console.log(
                `[Auth] Sign in failed, retrying in ${delay}ms (attempt ${attempt}/${total})`,
              );
            },
          },
        );
      },

      signUp: async (options) => {
        return withRetry(() => supabaseClient.auth.signUp(options), {
          maxRetries,
          initialDelay,
          onRetry: (error, attempt, total, delay) => {
            console.log(
              `[Auth] Sign up failed, retrying in ${delay}ms (attempt ${attempt}/${total})`,
            );
          },
        });
      },

      signOut: async () => {
        return withRetry(() => supabaseClient.auth.signOut(), {
          maxRetries,
          initialDelay,
          onRetry: (error, attempt, total, delay) => {
            console.log(
              `[Auth] Sign out failed, retrying in ${delay}ms (attempt ${attempt}/${total})`,
            );
          },
        });
      },

      getSession: async () => {
        return withRetry(() => supabaseClient.auth.getSession(), {
          maxRetries,
          initialDelay,
          onRetry: (error, attempt, total, delay) => {
            console.log(
              `[Auth] Get session failed, retrying in ${delay}ms (attempt ${attempt}/${total})`,
            );
          },
        });
      },

      // Pass through other methods without retry
      ...Object.keys(supabaseClient.auth).reduce((acc, key) => {
        if (
          typeof supabaseClient.auth[key] === "function" &&
          !["signInWithPassword", "signUp", "signOut", "getSession"].includes(
            key,
          )
        ) {
          acc[key] = supabaseClient.auth[key].bind(supabaseClient.auth);
        }
        return acc;
      }, {}),
    },

    // Pass through other client methods
    from: supabaseClient.from.bind(supabaseClient),
    storage: supabaseClient.storage,
    channel: supabaseClient.channel.bind(supabaseClient),
    removeChannel: supabaseClient.removeChannel.bind(supabaseClient),
    getChannels: supabaseClient.getChannels.bind(supabaseClient),
  };
};

module.exports = {
  isRetryableError,
  calculateDelay,
  sleep,
  withRetry,
  createRetryableClient,
  DEFAULT_MAX_RETRIES,
  DEFAULT_INITIAL_DELAY_MS,
  DEFAULT_MAX_DELAY_MS,
};

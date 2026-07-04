export const VAULT_SESSION = {
  // How long vault stays unlocked after last activity
  // User can choose their preferred duration
  DURATIONS: {
    SHORT: 30 * 60 * 1000, //  30 minutes
    MEDIUM: 2 * 60 * 60 * 1000, //   2 hours  (default)
    LONG: 8 * 60 * 60 * 1000, //   8 hours
    DAY: 24 * 60 * 60 * 1000, //  24 hours (use with caution)
  },

  DEFAULT_DURATION: 2 * 60 * 60 * 1000, // 2 hours default

  STORAGE_KEY: 'vault_session', // sessionStorage key
  PREF_KEY: 'vault_session_duration', // localStorage key for user preference
  // (preference persists, session does not)
};

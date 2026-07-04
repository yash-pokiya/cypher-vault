import { VAULT_SESSION } from '../config/vaultSession.config.js';

// ─────────────────────────────────────────────────────────────
// What gets stored (sessionStorage — cleared when tab closes):
// {
//   verifier:        string,  ← PBKDF2(vaultPassword, verifierSalt, 1000, SHA-256)
//                                 used ONLY to verify password on re-derive
//                                 cannot be reversed to get original password
//   verifierSalt:    string,  ← base64 random salt for verifier (NOT vaultSalt)
//   vaultSalt:       string,  ← from backend, needed for MasterKey derivation
//   unlockedAt:      number,  ← ms timestamp
//   expiresAt:       number,  ← ms timestamp
// }
// ─────────────────────────────────────────────────────────────

const KEY = VAULT_SESSION.STORAGE_KEY;

// ── Save session after successful vault unlock ────────────────
export async function saveVaultSession(vaultPassword, vaultSalt, durationMs) {
  const duration = durationMs || getUserPreferredDuration();

  // Create a one-way verifier: PBKDF2 with low iterations
  // This lets us verify password on re-derive WITHOUT storing the password
  const verifierSalt = crypto.getRandomValues(new Uint8Array(16));
  const verifierSaltB64 = btoa(String.fromCharCode(...verifierSalt));

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(vaultPassword),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const verifierBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: verifierSalt, iterations: 1000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const verifier = btoa(String.fromCharCode(...new Uint8Array(verifierBits)));

  const session = {
    verifier,
    verifierSalt: verifierSaltB64,
    vaultSalt, // from backend — not secret, just needed
    unlockedAt: Date.now(),
    expiresAt: Date.now() + duration,
  };

  sessionStorage.setItem(KEY, JSON.stringify(session));
}

// ── Read and validate session ─────────────────────────────────
export function getVaultSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);

    // Check expiry
    if (Date.now() > session.expiresAt) {
      clearVaultSession();
      return null;
    }

    return session;
  } catch {
    clearVaultSession();
    return null;
  }
}

// ── Check if session is still valid ──────────────────────────
export function isVaultSessionValid() {
  return getVaultSession() !== null;
}

// ── Get remaining time in ms ──────────────────────────────────
export function getSessionTimeRemaining() {
  const session = getVaultSession();
  if (!session) return 0;
  return Math.max(0, session.expiresAt - Date.now());
}

// ── Extend session on user activity ──────────────────────────
export function refreshVaultSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;

    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) return; // already expired

    const duration = getUserPreferredDuration();
    session.expiresAt = Date.now() + duration;
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* silent */
  }
}

// ── Clear session (logout / explicit lock) ────────────────────
export function clearVaultSession() {
  sessionStorage.removeItem(KEY);
}

// ── User duration preference (persists across sessions) ───────
export function getUserPreferredDuration() {
  const saved = localStorage.getItem(VAULT_SESSION.PREF_KEY);
  return saved ? parseInt(saved, 10) : VAULT_SESSION.DEFAULT_DURATION;
}

export function setUserPreferredDuration(ms) {
  localStorage.setItem(VAULT_SESSION.PREF_KEY, String(ms));
}

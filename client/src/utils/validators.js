export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isStrongPassword = (pwd) =>
  pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);

export const passwordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 20) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0-6
};

export const strengthLabel = (score) => {
  if (score <= 2) return { label: 'Weak', color: 'text-red-400' };
  if (score <= 4) return { label: 'Fair', color: 'text-amber-400' };
  return { label: 'Strong', color: 'text-emerald-400' };
};

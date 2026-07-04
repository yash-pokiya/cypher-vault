import api from './axios.instance';

export const profileAPI = {
  getProfile:          () => api.get('/profile'),
  getStorageStats:     () => api.get('/profile/stats'),
  updatePassword:      (data) => api.patch('/profile/password', data),

  // NEW: Vault password endpoints
  getVaultStatus:      () => api.get('/profile/vault-status').then((r) => r.data.data),
  setupVault:          (data) => api.post('/profile/vault-setup', data).then((r) => r.data),
  changeVaultPassword: (data) => api.patch('/profile/vault-change', data).then((r) => r.data),
};

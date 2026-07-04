import api from './axios.instance';

export const profileAPI = {
  getProfile:          () => api.get('/profile'),
  getStorageStats:     () => api.get('/profile/stats'),
  updatePassword:      (data) => api.patch('/profile/password', data),

  // Vault password endpoints
  getVaultStatus:         () => api.get('/profile/vault-status').then((r) => r.data.data),
  reportFailedUnlock:     () => api.post('/profile/vault-failed-unlock').then((r) => r.data).catch((e) => e.response?.data || { locked: true }),
  reportSuccessfulUnlock: () => api.post('/profile/vault-successful-unlock').then((r) => r.data),
  setupVault:             (data) => api.post('/profile/vault-setup', data).then((r) => r.data),
  changeVaultPassword:    (data) => api.patch('/profile/vault-change', data).then((r) => r.data),

  // Envelope encryption migration — stores wrappedMasterKey on server
  migrateVault:           (data) => api.post('/profile/vault-migrate', data).then((r) => r.data),
};

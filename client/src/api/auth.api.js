import api from './axios.instance';

export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  logout:   ()      => api.post('/auth/logout'),
  refresh:  ()      => api.post('/auth/refresh'),
};

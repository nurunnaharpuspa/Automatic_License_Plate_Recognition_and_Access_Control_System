import api from './axios'

export const login          = (data)   => api.post('/accounts/login/', data)
export const register       = (data)   => api.post('/accounts/register/', data)
export const getMe          = ()       => api.get('/accounts/me/')
export const createStaff    = (data)   => api.post('/accounts/staff/create/', data)
export const getAllUsers        = ()      => api.get('/accounts/users/')
export const getPendingUsers = ()      => api.get('/accounts/users/pending/')
export const approveUser    = (id, status) => api.patch(`/accounts/users/${id}/approval/`, { status })
export const deleteUser     = (id)    => api.delete(`/accounts/users/${id}/delete/`)

export const getMyVehicles = () => api.get('/vehicles/my/')
export const addVehicle = (data) => api.post('/vehicles/my/', data)
export const getAllVehicles = () => api.get('/vehicles/all/')
export const getPendingVehicles = () => api.get('/vehicles/pending/')
export const approveVehicle = (id, status) =>
  api.patch(`/vehicles/${id}/approval/`, { status })

export const getAllLogs          = (params) => api.get('/parking/logs/', { params })
export const getGroupedLogs     = (params) => api.get('/parking/logs/grouped/', { params })
export const getCurrentlyParked    = ()           => api.get('/parking/logs/currently-parked/')
export const reviewUnregistered    = (id, data)   => api.post(`/parking/logs/${id}/review/`, data)
export const getMyLogs          = ()       => api.get('/parking/my-logs/')
export const getMyStatus        = ()       => api.get('/parking/my-status/')
export const getPendingCorrections = ()    => api.get('/parking/corrections/pending/')
export const submitCorrection   = (id, data) => api.post(`/parking/corrections/${id}/submit/`, data)
export const logGuest           = (data)  => api.post('/parking/guest/', data)

export const uploadVideo = (formData) =>
  api.post('/recognition/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getSettings = () => api.get('/cameras/settings/')
export const updateSettings = (data) => api.patch('/cameras/settings/', data)
export const getCameras = () => api.get('/cameras/')
export const addCamera = (data) => api.post('/cameras/', data)
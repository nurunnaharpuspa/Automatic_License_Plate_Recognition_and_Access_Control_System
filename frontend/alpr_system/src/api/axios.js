import axios from 'axios'

// use env variable so you don't hardcode the IP everywhere
// const BASE_URL = import.meta.env.VITE_API_URL //|| 'http://localhost:8000/api'    10.176.203.242
// const BASE_URL = 'http://192.168.0.147:8000/api'
const BASE_URL = 'http://10.176.203.242:8000/api'
console.log(BASE_URL)
const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${BASE_URL.replace('/api', '')}/api/accounts/token/refresh/`, { refresh })
        localStorage.setItem('access', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
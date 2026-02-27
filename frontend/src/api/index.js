import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
}

export const bookApi = {
  getList: (params) => api.get('/books', { params }),
  getDetail: (id) => api.get(`/books/${id}`),
  create: (data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    return api.post('/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  update: (id, data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    return api.put(`/books/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  delete: (id) => api.delete(`/books/${id}`)
}

export const categoryApi = {
  getList: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
}

export const borrowApi = {
  getList: (params) => api.get('/borrow', { params }),
  borrow: (bookId) => api.post('/borrow/borrow', { bookId }),
  return: (recordId) => api.post('/borrow/return', { recordId }),
  renew: (recordId) => api.post('/borrow/renew', { recordId }),
  getOverdue: () => api.get('/borrow/overdue')
}

export const statisticsApi = {
  getOverview: () => api.get('/statistics/overview'),
  getCategoryStats: () => api.get('/statistics/category-stats'),
  getBorrowTrend: (days) => api.get('/statistics/borrow-trend', { params: { days } }),
  getPopularBooks: (limit) => api.get('/statistics/popular-books', { params: { limit } }),
  getActiveUsers: (limit) => api.get('/statistics/active-users', { params: { limit } }),
  getOverdueList: () => api.get('/statistics/overdue-list')
}

export const userApi = {
  getList: (params) => api.get('/auth/users', { params }),
  updateRole: (id, role) => api.put(`/auth/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/auth/users/${id}`)
}

export default api

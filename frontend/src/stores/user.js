import { defineStore } from 'pinia'
import { authApi } from '../api'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },

  actions: {
    async login(credentials) {
      const res = await authApi.login(credentials)
      this.token = res.token
      this.user = res.user
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      return res
    },

    async register(data) {
      return await authApi.register(data)
    },

    async fetchProfile() {
      const res = await authApi.getProfile()
      this.user = res
      localStorage.setItem('user', JSON.stringify(res))
      return res
    },

    async updateProfile(data) {
      await authApi.updateProfile(data)
      await this.fetchProfile()
    },

    async changePassword(data) {
      return await authApi.changePassword(data)
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})

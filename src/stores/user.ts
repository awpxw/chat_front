// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    accessToken: '' as string,
    refreshToken: '' as string,
    expiresIn: 0 as number
  }),
  
  actions: {
    setToken(accessToken: string, refreshToken = '', expiresIn = 0) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.expiresIn = expiresIn
    },
    logout() {
      this.accessToken = ''
      this.refreshToken = ''
      this.expiresIn = 0
    }
  },
  // 加上这行！刷新页面也不丢 token！
  persist: true
})
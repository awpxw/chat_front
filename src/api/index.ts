// src/api/index.ts  ← 宇宙最强版，专治 Result.success()
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 30000
})

// 请求拦截器：只管带 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一处理 Result 包装，一劳永逸！
api.interceptors.response.use(
 
  res => {
    // 文件流直接返
    if (res.config.responseType === 'blob' || res.config.responseType === 'arraybuffer') {
      return res
    }

    const result = res.data

    // 所有接口都走这里：成功返回 data，失败抛错
    if (result.code === 200 || result.code === 0) {
      return result.data ?? true   // ← 关键！直接返回你想要的真实数据
    }

    // 业务失败也抛错，让 catch 能接到
    const err: any = new Error(result.msg || '操作失败')
    err.response = res
    return Promise.reject(err)
  },
  err => {
  const msg = err.response?.data?.msg || err.response?.data?.message || err.message || '网络异常'
  ElMessage.error(msg)

  // 同时支持 HTTP 401 和业务 code 401
  if (err.response && (err.response.status === 401 || err.response.data?.code === 401)) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    // 关键：用 location.href 强制刷新跳转
    window.location.href = '/Login'
  }
  return Promise.reject(err)
}
)

export default api
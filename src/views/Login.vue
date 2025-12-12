<template>
  <div class="login">
    <el-card class="box-card">
      <h2 class="text-center mb-6">系统登录</h2>
      <el-form :model="form" @submit.prevent="login">
        <el-input v-model="form.username" placeholder="用户名 admin" class="mb-4" />
        <el-input v-model="form.password" type="password" placeholder="密码 123456" class="mb-4" />

        <!-- 验证码区域 -->
        <div class="flex items-center mb-4">
          <el-input v-model="form.captcha" placeholder="验证码" class="w-48 mr-4" />
          <img
            :src="captchaSrc"
            alt="验证码"
            class="h-10 cursor-pointer border rounded select-none"
            @click="refreshCaptcha"
          />
        </div>

        <el-button type="primary" native-type="submit" class="w-full" :loading="loading">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import api from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { reactive, ref, onMounted, computed } from 'vue'

const router = useRouter()
const store = useUserStore()
const loading = ref(false)

// 验证码数据（拦截器已返回 result.data）
const captcha = reactive({
  captchaId: '',
  image: '' // 后端返回的裸 base64 字符串（不带前缀）
})

// 自动补 data:image/png;base64, 前缀
const captchaSrc = computed(() => {
  return captcha.image ? `data:image/png;base64,${captcha.image}` : ''
})

const form = reactive({
  username: 'admin',
  password: '123456',
  captcha: '',
  captchaId: ''
})

// 刷新验证码（同时更新 captchaId 和图片）
const refreshCaptcha = async () => {
  try {
    const res = await api.post('/api/auth/captcha', { expireIns: 300 })
    // 现在 res 就是 { captchaId, image } ← 拦截器已解包
    captcha.captchaId = res.captchaId
    captcha.image = res.image
    form.captchaId = res.captchaId
    form.captcha = '' // 清空输入框
  } catch (err) {
    ElMessage.error('验证码加载失败')
  }
}

const login = async () => {
  if (!form.username || !form.password) {
    return ElMessage.warning('请填写用户名和密码')
  }
  if (!form.captcha) {
    return ElMessage.warning('请输入验证码')
  }

  loading.value = true
  try {
    const res = await api.post('/api/auth/login', {
      username: form.username,
      password: form.password,
      captcha: form.captcha.toLowerCase(),
      captchaId: form.captchaId
    })

    // 现在 res 就是 { accessToken, refreshToken, expiresIn }
    const { accessToken, refreshToken = '', expiresIn = 0 } = res

    // 存 localStorage（关键！刷新页面靠它）
    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)

    // 存 Pinia（可选，方便其他地方直接用）
    store.setToken(accessToken, refreshToken, expiresIn)

    ElMessage.success('登录成功')
    router.push('/user')
  } catch (err: any) {
    ElMessage.error(err.message || '登录失败')
    form.captcha = ''
    await refreshCaptcha() // 失败后重新获取一张图
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshCaptcha()
})
</script>

<style scoped>
.login {
  @apply min-h-screen bg-gray-100 flex items-center justify-center;
}
.box-card {
  width: 420px;
}
.text-center {
  text-align: center;
}
</style>
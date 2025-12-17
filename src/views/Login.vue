<template>
  <div class="login">
    <div class="login-container">
      <el-card class="login-card shadow-2xl">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800">系统登录</h2>
          <p class="text-gray-500 mt-2">欢迎回来，请登录您的账号</p>
        </div>

        <el-form :model="form" @submit.prevent="login">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              size="large"
              placeholder="用户名 admin"
              prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              size="large"
              placeholder="密码 123456"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <!-- 验证码区域 -->
          <el-form-item prop="captcha" class="captcha-item">
            <div class="captcha-wrapper">
              <el-input
                v-model="form.captcha"
                size="large"
                placeholder="验证码"
                maxlength="6"
                class="captcha-input"
              />
              <img
                :src="captchaSrc"
                alt="验证码"
                class="captcha-img"
                @click="refreshCaptcha"
              />
            </div>
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            native-type="submit"
            class="w-full mt-8 submit-btn"
            :loading="loading"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>

          <div class="text-center mt-8">
            <span class="text-gray-500 text-sm">没有账号？</span>
            <el-link type="primary" :underline="false" class="ml-2 font-medium" @click="$router.push('/register')">
              立即注册 →
            </el-link>
          </div>
        </el-form>
      </el-card>
    </div>
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

// 验证码数据
const captcha = reactive({
  captchaId: '',
  image: ''
})

// 自动补前缀
const captchaSrc = computed(() => {
  return captcha.image ? `data:image/png;base64,${captcha.image}` : ''
})

const form = reactive({
  username: 'admin',
  password: '123456',
  captcha: '',
  captchaId: ''
})

// 刷新验证码
const refreshCaptcha = async () => {
  try {
    const res = await api.post('/api/auth/captcha', { expireIns: 300 })
    captcha.captchaId = res.captchaId
    captcha.image = res.image
    form.captchaId = res.captchaId
    form.captcha = ''
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

    const { accessToken, refreshToken = '', expiresIn = 0 } = res

    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)

    store.setToken(accessToken, refreshToken, expiresIn)

    ElMessage.success('登录成功')
    router.push('/user')
  } catch (err: any) {
    ElMessage.error(err.message || '登录失败')
    form.captcha = ''
    await refreshCaptcha()
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
  @apply min-h-screen flex items-center justify-center;
  background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
  position: relative;
  overflow: hidden;
}

/* 背景装饰圆形 */
.login::before {
  content: '';
  position: absolute;
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.12);
  top: -300px;
  left: -300px;
  z-index: 0;
}

.login::after {
  content: '';
  position: absolute;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.1);
  bottom: -400px;
  right: -400px;
  z-index: 0;
}

/* 完美居中 */
.login-container {
  width: 460px;
  margin: 0 auto;
  padding: 20px;
  z-index: 1;
  position: relative;
}

.login-card {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* 验证码区域优化 */
.captcha-item {
  margin-bottom: 32px !important;
}

.captcha-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
}

.captcha-input {
  flex: 1;
}

.captcha-img {
  width: 140px;
  height: 56px;
  border-radius: 16px;
  border: 1px solid #dcdfe6;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
}

.captcha-img:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.submit-btn {
  height: 54px;
  font-size: 19px;
  font-weight: 600;
  border-radius: 18px;
  background: linear-gradient(to right, #667eea, #764ba2);
  border: none;
  transition: all 0.4s ease;
}

.submit-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4);
}

/* 输入框统一美化 */
:deep(.el-input__wrapper) {
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.95);
  height: 54px;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3);
}

:deep(.el-card__body) {
  padding: 52px 48px;
}

/* 所有表单项统一间距 */
:deep(.el-form-item) {
  margin-bottom: 28px;
}
</style>
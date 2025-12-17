<template>
  <div class="login">
    <div class="login-container">
      <el-card class="register-card shadow-2xl">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800">用户注册</h2>
          <p class="text-gray-500 mt-2">欢迎加入，请填写信息完成注册</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="register">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              size="large"
              placeholder="用户名（字母数字）"
              prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              size="large"
              placeholder="密码（6位以上）"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPwd">
            <el-input
              v-model="form.confirmPwd"
              type="password"
              size="large"
              placeholder="确认密码"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item prop="mobile">
            <el-input
              v-model="form.mobile"
              size="large"
              placeholder="手机号"
              prefix-icon="Iphone"
              clearable
            />
          </el-form-item>

          <!-- 验证码区域：加大整体间距 -->
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
            {{ loading ? '注册中...' : '立即注册' }}
          </el-button>

          <div class="text-center mt-8">
            <span class="text-gray-500 text-sm">已有账号？</span>
            <el-link type="primary" :underline="false" class="ml-2 font-medium" @click="$router.push('/login')">
              去登录 →
            </el-link>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)

// 验证码数据（拦截器已返回 result.data）
const captcha = reactive({
  captchaId: '',
  image: '' // 后端返回的裸 base64 字符串
})

// 自动补前缀
const captchaSrc = computed(() => {
  return captcha.image ? `data:image/png;base64,${captcha.image}` : ''
})

const form = reactive({
  username: '',
  password: '',
  confirmPwd: '',
  mobile: '',
  captcha: '',
  captchaId: ''
})

// 表单校验规则（可选，你可以自己加更严格的）
const rules = {}

// 刷新验证码（同时更新 captchaId 和图片）
const refreshCaptcha = async () => {
  try {
    const res = await api.post('/api/auth/captcha', { expireIns: 300 })
    captcha.captchaId = res.captchaId
    captcha.image = res.image
    form.captchaId = res.captchaId
    form.captcha = '' // 清空用户输入
  } catch (err) {
    ElMessage.error('验证码加载失败')
  }
}

// 注册失败时只刷新图片（保持同一个 captchaId，方便用户继续输）
const refreshImageOnly = async () => {
  try {
    const res = await api.post('/api/auth/captcha', { expireIns: 300 })
    captcha.image = res.image // 只换图，不动 captchaId
  } catch (err) {
    ElMessage.error('验证码刷新失败')
  }
}

const register = async () => {
  if (!form.username || !form.password || !form.mobile) {
    return ElMessage.warning('请填写完整信息')
  }
  if (form.password !== form.confirmPwd) {
    return ElMessage.warning('两次密码不一致')
  }
  if (!form.captcha) {
    return ElMessage.warning('请输入验证码')
  }

  loading.value = true
  try {
    await api.post('/api/auth/register', {
      username: form.username,
      password: form.password,
      mobile: form.mobile,
      captcha: form.captcha.toLowerCase(),
      captchaId: form.captchaId
    })

    ElMessage.success('注册成功！请登录')
    router.push('/login')
  } catch (err: any) {
    ElMessage.error(err.message || err.response?.data?.msg || '注册失败')
    form.captcha = ''
    await refreshImageOnly() // 失败只换图，不换 key
  } finally {
    loading.value = false
  }
}

// 页面加载时先请求一次验证码
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

.register-card {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* 验证码区域间距优化：不再拥挤 */
.captcha-item {
  margin-bottom: 32px !important; /* 与上面输入框保持一致间距 */
}

.captcha-wrapper {
  display: flex;
  align-items: center;
  gap: 20px; /* 输入框和图片之间宽松间距 */
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

/* 所有 el-form-item 统一间距（保持上面一样） */
:deep(.el-form-item) {
  margin-bottom: 28px;
}

:deep(.el-form-item:last-of-type) {
  margin-bottom: 0;
}
</style>
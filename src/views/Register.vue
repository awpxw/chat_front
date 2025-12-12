<template>
  <div class="login">
    <el-card class="box-card">
      <h2 class="text-center mb-6">用户注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="register">
        <el-input v-model="form.username" placeholder="用户名（字母数字）" class="mb-4" />
        <el-input v-model="form.password" type="password" placeholder="密码（6位以上）" class="mb-4" />
        <el-input v-model="form.confirmPwd" type="password" placeholder="确认密码" class="mb-4" />
        <el-input v-model="form.mobile" placeholder="手机号" class="mb-4" />

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

        <el-button type="success" native-type="submit" class="w-full" :loading="loading">
          立即注册
        </el-button>

        <div class="text-center mt-4">
          <el-link type="primary" @click="$router.push('/login')">已有账号？去登录</el-link>
        </div>
      </el-form>
    </el-card>
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
    // 现在 res 就是 { captchaId, image } ← 拦截器已帮你解包
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
  @apply min-h-screen bg-gray-100 flex items-center justify-center;
}
.box-card {
  width: 420px;
}
</style>
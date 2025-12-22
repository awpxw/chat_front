<template>
  <div class="profile-page">
    <!-- 标题 -->
    <div class="page-header">
      <h1 class="page-title">个人中心</h1>
    </div>

    <!-- 主内容卡片 -->
    <el-card class="profile-card" shadow="hover">
      <div class="profile-content">
        <!-- 左侧头像区 -->
        <div class="avatar-section">
          <el-avatar :size="120" :src="user.avatar || defaultAvatar" class="avatar" />
          <div class="name-info mt-4 text-center">
            <h2 class="username">{{ user.name || '未设置姓名' }}</h2>
            <p class="nickname text-gray-500">{{ user.nickname || '暂无昵称' }}</p>
            <el-tag v-if="user.isAdmin === 1" type="danger" size="small" class="admin-tag">管理员</el-tag>
          </div>
        </div>

        <!-- 右侧信息区 -->
        <div class="info-section">
          <el-descriptions :column="1" border class="info-table">
            <el-descriptions-item label="工号">
              {{ user.workNo || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号">
              {{ user.mobile || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ user.email || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="部门">
              {{ user.deptName || '未分配部门' }}
            </el-descriptions-item>
            <el-descriptions-item label="岗位">
              {{ user.position || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="user.status === 1 ? 'success' : 'danger'" size="small">
                {{ user.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户ID">
              {{ user.id }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 操作按钮 -->
          <div class="actions mt-8 text-right">
            <el-button type="primary" @click="editDialogVisible = true">
              <el-icon class="mr-2"><Edit /></el-icon>
              修改资料
            </el-button>
            <el-button @click="pwdDialogVisible = true">
              <el-icon class="mr-2"><Lock /></el-icon>
              修改密码
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 修改资料弹窗部分（模板） -->
<el-dialog
  v-model="editDialogVisible"
  title="修改资料"
  width="500px"
  center
  :close-on-click-modal="false"
  :close-on-press-escape="false"
  custom-class="blur-dialog"
>
  <el-form :model="editForm" label-width="100px" :rules="editRules" ref="editFormRef">
    <el-form-item label="姓名" prop="name">
      <el-input v-model="editForm.name" placeholder="请输入姓名" />
    </el-form-item>
    <el-form-item label="昵称" prop="nickname">
      <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
    </el-form-item>
    <el-form-item label="手机号" prop="mobile">
      <el-input v-model="editForm.mobile" placeholder="请输入手机号" />
    </el-form-item>
    <el-form-item label="邮箱" prop="email">
      <el-input v-model="editForm.email" placeholder="请输入邮箱" />
    </el-form-item>
    <!-- 已移除岗位（position）字段 -->
  </el-form>

  <template #footer>
    <div class="dialog-footer">
      <el-button @click="editDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitEdit">保存</el-button>
    </div>
  </template>
</el-dialog>    

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="pwdDialogVisible"
      title="修改密码"
      width="460px"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      custom-class="blur-dialog"
    >
      <el-form :model="pwdForm" label-width="100px" :rules="pwdRules" ref="pwdFormRef">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="pwdDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPwd">确认修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Edit, Lock } from '@element-plus/icons-vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
import router from '../../router'

const defaultAvatar = 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c5ad8d6b7d7d7b7d7b7d7b7jpeg.jpeg'

const user = ref({
  id: null as number | null,
  status: 1,
  workNo: '',
  name: '',
  nickname: '',
  mobile: '',
  email: '',
  avatar: '',
  deptId: null as number | null,
  position: '',
  isAdmin: 0,
  deptName:""
})

const deptName = ref('')

// 修改资料弹窗
const editDialogVisible = ref(false)
const editFormRef = ref<any>(null)
const editForm = reactive({
  name: '',
  nickname: '',
  mobile: '',
  email: ''
})
// 规则也相应调整（移除 position 相关）
const editRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
  // 可根据实际需求加邮箱验证等
}

// 修改密码弹窗
const pwdDialogVisible = ref(false)
const pwdFormRef = ref<any>(null)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string) => {
        if (value !== pwdForm.newPassword) {
          return new Error('两次输入密码不一致')
        }
        return true
      },
      trigger: 'blur'
    }
  ]
}

// 加载个人信息
const loadProfile = async () => {
  try {
    const res = await api.post('/api/auth/user/detail')
    Object.assign(user.value, res.data || res)

    // 初始化修改资料表单
    Object.assign(editForm, {
      name: user.value.name,
      nickname: user.value.nickname,
      mobile: user.value.mobile,
      email: user.value.email,
      position: user.value.position
    })

  } catch (err) {
    ElMessage.error('加载个人信息失败')
  }
}

// 提交修改资料：显式传入 id
const submitEdit = () => {
  editFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 关键：把用户 id 一起传给后端
        const updateData = {
          id: user.value.id,        // 必须传 id，让后端知道更新谁
          name: editForm.name,
          nickname: editForm.nickname,
          mobile: editForm.mobile,
          email: editForm.email
        }

        await api.post('/api/auth/user/profile/update', updateData)  // 或 api.put，根据你的接口
        // 或者如果你后端接口路径带 id：api.put(`/api/user/${user.value.id}`, editForm)

        ElMessage.success('修改成功')
        editDialogVisible.value = false
        loadProfile()  // 刷新个人信息
      } catch (err: any) {
        ElMessage.error(err.msg || '修改失败')
      }
    }
  })
}

// 提交修改密码
const submitPwd = () => {
  pwdFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        await api.post('/api/auth/user/changePwd', {
          id: user.value.id,  
          oldPassword: pwdForm.oldPassword,
          newPassword: pwdForm.newPassword
        })
        ElMessage.success('密码修改成功，请重新登录')
        pwdDialogVisible.value = false
        // 关键：清除本地 token
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        // 可跳转登录页
        router.push("/login")
        
      } catch {
        ElMessage.error('密码修改失败')
      }
    }
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  padding: 32px 0;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2329;
}

.profile-card {
  border-radius: 20px;
  overflow: hidden;
}

.profile-content {
  display: flex;
  gap: 48px;
  padding: 32px;
  align-items: flex-start;
}

.avatar-section {
  text-align: center;
  flex-shrink: 0;
}

.avatar {
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.username {
  margin: 16px 0 8px;
  font-size: 24px;
  font-weight: 600;
}

.nickname {
  font-size: 14px;
}

.admin-tag {
  margin-top: 8px;
}

.info-section {
  flex: 1;
  min-width: 0;
}

.info-table :deep(.el-descriptions__label) {
  width: 120px;
  background: #f8f9fb;
  font-weight: 600;
}

.actions {
  border-top: 1px solid #ebeef5;
  padding-top: 24px;
}

/* 背景模糊 + 居中弹窗样式 */
:deep(.blur-dialog .el-overlay) {
  backdrop-filter: blur(8px); /* 背景模糊核心 */
  background-color: rgba(0, 0, 0, 0.4); /* 半透明暗背景 */
}

:deep(.blur-dialog .el-dialog) {
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}

:deep(.blur-dialog .el-dialog__header) {
  font-size: 20px;
  font-weight: 600;
  padding: 24px 24px 16px;
}

:deep(.blur-dialog .el-dialog__body) {
  padding: 0 32px;
}

.dialog-footer {
  padding: 20px 32px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>
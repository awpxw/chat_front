<template>
  <div class="profile-page">
    <!-- 标题 -->
    <div class="page-header">
      <h1 class="page-title">个人中心</h1>
    </div>

    <!-- 主内容卡片 -->
    <el-card class="profile-card" shadow="never">
      <div class="profile-content">
        <!-- 左侧头像区 -->
        <div class="avatar-section">
          <el-avatar :size="140" :src="user.avatar || defaultAvatar" class="avatar" />
          <div class="name-info mt-6 text-center">
            <h2 class="username">{{ user.name || '未设置姓名' }}</h2>
            <p class="nickname">{{ user.nickname || '暂无昵称' }}</p>
            <el-tag v-if="user.isAdmin === 1" type="danger" effect="dark" round size="large" class="admin-tag">
              管理员
            </el-tag>
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
              <el-tag :type="user.status === 1 ? 'success' : 'danger'" effect="dark" round>
                {{ user.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户ID">
              {{ user.id }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 操作按钮 -->
          <div class="actions mt-10">
            <el-button type="primary" size="large" @click="editDialogVisible = true">
              <el-icon class="mr-2"><Edit /></el-icon>
              修改资料
            </el-button>
            <el-button size="large" @click="pwdDialogVisible = true">
              <el-icon class="mr-2"><Lock /></el-icon>
              修改密码
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 修改资料弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改资料"
      width="520px"
      center
      :close-on-click-modal="false"
      class="modern-dialog"
    >
      <el-form
        :model="editForm"
        label-width="100px"
        :rules="editRules"
        ref="editFormRef"
        class="form-modern"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称（可选）" clearable />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="editForm.mobile" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入邮箱（可选）" clearable />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="submitEdit" size="large">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="pwdDialogVisible"
      title="修改密码"
      width="520px"
      center
      :close-on-click-modal="false"
      class="modern-dialog"
    >
      <el-form
        :model="pwdForm"
        label-width="100px"
        :rules="pwdRules"
        ref="pwdFormRef"
        class="form-modern"
      >
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入旧密码" clearable />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码" clearable />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" clearable />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="pwdDialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="submitPwd" size="large">确认修改</el-button>
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
  deptName: ""
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

const editRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
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

// 提交修改资料
const submitEdit = () => {
  editFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const updateData = {
          id: user.value.id,
          name: editForm.name,
          nickname: editForm.nickname,
          mobile: editForm.mobile,
          email: editForm.email
        }

        await api.post('/api/auth/user/profile/update', updateData)

        ElMessage.success('修改成功')
        editDialogVisible.value = false
        loadProfile()
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
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
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
  padding: 32px 24px;
  background: #f6f8fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2329;
  margin: 0;
}

.profile-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.profile-content {
  display: flex;
  gap: 64px;
  padding: 40px;
  align-items: flex-start;
}

.avatar-section {
  text-align: center;
  flex-shrink: 0;
}

.avatar {
  border: 6px solid #fff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.username {
  margin: 20px 0 8px;
  font-size: 26px;
  font-weight: 600;
  color: #1f2329;
}

.nickname {
  font-size: 16px;
  color: #909399;
}

.admin-tag {
  margin-top: 12px;
}

.info-section {
  flex: 1;
  min-width: 0;
}

.info-table :deep(.el-descriptions__label) {
  width: 120px;
  background: #f8f9fb;
  font-weight: 600;
  color: #3a3f4a;
}

.info-table :deep(.el-descriptions__content) {
  color: #606266;
  font-size: 15px;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding-top: 32px;
  border-top: 1px solid #ebeef5;
}

/* 统一弹窗样式 */
:deep(.modern-dialog .el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

:deep(.modern-dialog .el-dialog__header) {
  padding: 24px 32px 16px;
  background: #fff;
  margin: 0;
  font-weight: 600;
  font-size: 20px;
}

:deep(.modern-dialog .el-dialog__body) {
  padding: 16px 32px 32px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 32px 32px;
  border-top: 1px solid #ebeef5;
}

/* 表单美化 */
.form-modern :deep(.el-form-item__label) {
  font-weight: 500;
  color: #3a3f4a;
}

.form-modern :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.form-modern :deep(.el-textarea__inner) {
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 32px;
    padding: 32px;
  }

  .actions {
    justify-content: center;
  }
}
</style>
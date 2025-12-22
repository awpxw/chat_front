<template>
  <div class="role-page">
    <div class="header-section">
      <h1 class="page-title">角色管理</h1>
      <div class="header-info">
        <el-button type="primary" size="large" @click="handleAdd" class="add-btn">
          <el-icon class="mr-2"><Plus /></el-icon>
          新增角色
        </el-button>
      </div>
    </div>

    <!-- 角色列表 -->
    <el-card class="table-card">
      <el-table :data="roleList" stripe border v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="200" align="center" />
        <el-table-column prop="name" label="角色名称" min-width="150" />
        <el-table-column prop="code" label="角色编码" min-width="150" />
        <el-table-column prop="dataScope" label="数据范围" width="160" align="center">
          <template #default="{ row }">
            <el-tag :type="getDataScopeType(row.dataScope)" effect="dark" round>
              {{ getDataScopeLabel(row.dataScope) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip min-width="200" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            <el-button type="warning" link @click="handleAllotMenu(row)">分配权限</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="query.current"
          v-model:page-size="query.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadRoles"
          @current-change="loadRoles"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑角色' : '新增角色'"
      width="520px"
      center
      :close-on-click-modal="false"
      class="modern-dialog"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="100px"
        class="form-modern"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" clearable />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入唯一角色编码（如 ADMIN）" clearable />
        </el-form-item>
        <el-form-item label="数据范围" prop="dataScope">
          <el-radio-group v-model="form.dataScope" class="radio-group-modern">
            <el-radio :label="1" border size="large">全部</el-radio>
            <el-radio :label="2" border size="large">本级及子级</el-radio>
            <el-radio :label="3" border size="large">本级</el-radio>
            <el-radio :label="4" border size="large">仅本人</el-radio>
            <el-radio :label="5" border size="large">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入备注信息（可选）"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="submitForm" size="large">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配权限弹窗 -->
    <el-dialog
      v-model="allotDialogVisible"
      title="分配菜单权限"
      width="700px"
      center
      :close-on-click-modal="false"
      class="modern-dialog"
    >
      <div class="allot-header">
        当前角色：<span class="role-name">{{ currentRole?.name }}</span>
        （编码: {{ currentRole?.code }}）
      </div>

      <el-tree
    ref="menuTreeRef"
    :data="menuTree"
    show-checkbox
    node-key="id"
    :props="menuTreeProps"
    :default-checked-keys="checkedMenuIds"
    class="menu-tree-modern"
    highlight-current
    :check-strictly="true"   
  />

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="allotDialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="submitAllot" size="large">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// script 部分完全不变（和你原来的完全一致）
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/api'

interface Role {
  id?: string
  name: string
  code: string
  dataScope: number
  remark?: string
}

interface MenuTree {
  id: number
  name: string
  children?: MenuTree[]
}

const roleList = ref<Role[]>([])
const loading = ref(false)
const total = ref(0)
const query = reactive({
  current: 1,
  size: 10
})

const dialogVisible = ref(false)
const formRef = ref<any>(null)
const form = reactive<Role>({
  id: undefined,
  name: '',
  code: '',
  dataScope: 1,
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  dataScope: [{ required: true, message: '请选择数据范围', trigger: 'change' }]
}

const getDataScopeLabel = (value: number) => {
  const map: Record<number, string> = {
    1: '全部',
    2: '本级及子级',
    3: '本级',
    4: '仅本人',
    5: '自定义'
  }
  return map[value] || '-'
}

const getDataScopeType = (value: number) => {
  const types: Record<number, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    1: '',
    2: 'success',
    3: 'info',
    4: 'warning',
    5: 'danger'
  }
  return types[value] || ''
}

const loadRoles = async () => {
  loading.value = true
  try {
    const data = await api.post('/api/auth/role/page', query)
    roleList.value = data.records || []
    total.value = data.total || 0
    query.current = data.current || 1
    query.size = data.size || 10
  } catch {
    ElMessage.error('加载角色列表失败')
    roleList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  Object.assign(form, {
    id: undefined,
    name: '',
    code: '',
    dataScope: 1,
    remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: Role) => {
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const submitForm = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (form.id) {
          await api.post('/api/auth/role/update', form)
          ElMessage.success('编辑成功')
        } else {
          await api.post('/api/auth/role/update', form)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        loadRoles()
      } catch {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDelete = (row: Role) => {
  ElMessageBox.confirm('确定删除该角色吗？', '警告', { type: 'warning' })
    .then(async () => {
      await api.post('/api/auth/role/delete', { id: row.id })
      ElMessage.success('删除成功')
      loadRoles()
    })
    .catch(() => {})
}

const allotDialogVisible = ref(false)
const currentRole = ref<Role | null>(null)
const menuTree = ref<MenuTree[]>([])
const menuTreeProps = {
  label: 'name',
  children: 'children'
}
const checkedMenuIds = ref<number[]>([])
const menuTreeRef = ref<any>(null)

const loadMenuTree = async () => {
  try {
    const menuTreeData = await api.post('/api/auth/menu/tree')
    menuTree.value = menuTreeData.menuTree || []
  } catch {
    ElMessage.error('加载菜单树失败')
    menuTree.value = []
  }
}

const handleAllotMenu = async (row: Role) => {
  currentRole.value = row
  allotDialogVisible.value = true

  try {
    // 1. 先加载完整的菜单树
    const menuRes = await api.post('/api/auth/menu/tree')
    menuTree.value = menuRes.menuTree || []

    // 2. 再获取当前角色已分配的菜单ID列表
    // 假设你的后端有这个接口：GET 或 POST /api/auth/role/{id}/menus 返回 { menuIds: [1,2,3...] }
    const roleMenuRes = await api.post(`/api/auth/user/menu/list`,{roleId:row.id})  
    // 如果接口返回格式是 { data: [1,2,3] } 或 { menuIds: [...] }，请根据实际情况调整下面这行
    checkedMenuIds.value = roleMenuRes || []

  } catch (err) {
    ElMessage.error('加载权限数据失败')
    menuTree.value = []
    checkedMenuIds.value = []
  }

  // 3. 等 DOM 更新后设置已勾选的节点（关键！）
  await nextTick()
  if (menuTreeRef.value) {
    menuTreeRef.value.setCheckedKeys(checkedMenuIds.value)
  }
}

const submitAllot = async () => {
  if (!currentRole.value) return
  const checkedKeys = menuTreeRef.value.getCheckedKeys()
  try {
    await api.post('/api/auth/role/allot', {
      id: currentRole.value.id,
      menuIds: checkedKeys
    })
    ElMessage.success('权限分配成功')
    allotDialogVisible.value = false
  } catch {
    ElMessage.error('权限分配失败')
  }
}

onMounted(() => {
  loadRoles()
})
</script>

<style scoped>
.role-page {
  padding: 32px 0;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2329;
  margin: 0;
}

.add-btn {
  height: 52px;
  padding: 0 36px;
  font-size: 17px;
  font-weight: 600;
  border-radius: 18px;
  background: linear-gradient(to right, #667eea, #764ba2);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.25);
  transition: all 0.3s ease;
}

.add-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 35px rgba(102, 126, 234, 0.35);
}

.table-card {
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  border: none;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 24px 0 8px;
}

/* 弹窗样式与菜单管理一致 */
:deep(.modern-dialog .el-dialog) {
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}

:deep(.modern-dialog .el-dialog__header) {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  font-size: 22px;
  font-weight: 600;
}

:deep(.modern-dialog .el-dialog__body) {
  padding: 0 32px;
}

.dialog-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 32px;
  background: #ffffff;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

/* 输入框与菜单管理一致 */
:deep(.el-input__wrapper) {
  border-radius: 16px;
  height: 48px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

:deep(.el-textarea__inner) {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 单选按钮美化 */
.radio-group-modern {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* 权限树美化 */
.menu-tree-modern {
  padding: 20px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #ebeef5;
}

.allot-header {
  padding: 16px 20px;
  background: #f8f9fb;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
}

.role-name {
  color: #667eea;
  font-weight: 600;
}

/* 表格操作列固定右侧 */
:deep(.el-table__fixed-right) {
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.06);
}
/* 只在叶子节点显示 checkbox，目录/菜单节点隐藏 checkbox（更干净专业） */
.menu-tree-modern :deep(.el-tree-node__content > .el-checkbox) {
  display: none;  /* 默认隐藏所有 checkbox */
}

/* 只有叶子节点（没有 children 的节点）显示 checkbox */
.menu-tree-modern :deep(.el-tree-node.is-leaf > .el-tree-node__content > .el-checkbox) {
  display: flex !important;
}

/* 可选：调整叶子节点缩进，让文字对齐更好 */
.menu-tree-modern :deep(.el-tree-node.is-leaf > .el-tree-node__content) {
  padding-left: 20px !important;  /* 根据你的缩进调整 */
}

</style>
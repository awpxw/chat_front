<template>
  <div class="page-container">
    <!-- 标题栏：简约现代风格 -->
    <div class="header-section">
      <h1 class="page-title">员工管理</h1>
      <div class="header-info">
        <span class="total-text">共 {{ total }} 位员工</span>
        <el-button type="primary" size="large" @click="handleAdd" class="add-btn">
          <el-icon class="mr-2"><Plus /></el-icon>
          新增员工
        </el-button>
      </div>
    </div>

    <!-- 表格卡片 -->
    <el-card class="table-card">
      <el-table
        :data="list"
        v-loading="loading"
        stripe
        border
        class="data-table"
        style="width: 100%"
      >
        <!-- 姓名 + 头像 -->
        <el-table-column label="姓名" width="180" fixed="left">
          <template #default="{ row }">
            <div class="flex items-center space-x-4">
              <el-avatar
                :size="40"
                src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
              />
              <span class="font-medium text-gray-800">{{ row.name || '--' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="workNo" label="工号" width="120" align="center" />
        <el-table-column prop="mobile" label="手机号" width="160" align="center" />
        <el-table-column prop="position" label="职位" width="140" align="center" />
        
        <el-table-column label="部门" width="180" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.deptName" type="primary" effect="plain" size="small">
              {{ row.deptName }}
            </el-tag>
            <span v-else class="text-gray-400 text-sm">未分配部门</span>
          </template>
        </el-table-column>

        <el-table-column label="邮箱" width="220" align="center">
          <template #default="{ row }">
            <span class="text-blue-600" v-if="row.email">{{ row.email }}</span>
            <span v-else class="text-gray-400 text-sm">未填写</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="large" effect="dark">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页（中文美化） -->
      <div class="pagination-wrapper">
        <el-pagination
          background
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next"
          :prev-text="'上一页'"
          :next-text="'下一页'"
          class="chinese-pagination"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        >
          <template #total>
            <span class="total-text">共 {{ total }} 条</span>
          </template>
          <template #sizes>
            <span class="sizes-prefix">每页</span>
            <el-select v-model="size" class="sizes-select">
              <el-option v-for="item in [10, 20, 30, 50]" :key="item" :label="item + ' 条'" :value="item" />
            </el-select>
          </template>
        </el-pagination>
      </div>
    </el-card>

    <!-- 新增/编辑抽屉（完全恢复正常显示 + 美化） -->
    <el-drawer
      v-model="drawer"
      :title="form.id ? '编辑员工' : '新增员工'"
      direction="rtl"
      size="520px"
      :before-close="handleClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="drawer-form">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" size="large" />
        </el-form-item>

        <el-form-item label="工号" prop="workNo">
          <el-input v-model="form.workNo" placeholder="请输入工号" size="large" />
        </el-form-item>

        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" placeholder="请输入手机号" size="large" />
        </el-form-item>

        <el-form-item label="部门" prop="deptId">
          <el-tree-select
            v-model="form.deptId"
            :data="deptOptions"
            placeholder="请选择部门"
            clearable
            filterable
            check-strictly
            style="width: 100%"
            size="large"
            :props="{ label: 'name', value: 'id', children: 'children' }"
          />
        </el-form-item>

        <el-form-item label="职位" prop="position">
          <el-input v-model="form.position" placeholder="请输入职位" size="large" />
        </el-form-item>

        <el-form-item label="初始密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="不填则默认为 123456"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item label="状态" prop="originStatus">
          <el-radio-group v-model="form.originStatus" size="large">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawer = false" size="large">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submit" size="large">
            {{ form.id ? '保存' : '立即创建' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const form = ref({
  id: null as string | null,
  deptId: null as string | null,
  workNo: '',
  name: '',
  mobile: '',
  position: '',
  originStatus: 1,
  password: '',
  status: 1
})

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(true)
const drawer = ref(false)
const submitting = ref(false)
const formRef = ref<any>(null)
const deptOptions = ref<any[]>([])

const findDeptIdByName = (nodes: any[], name: string): number | null => {
  for (const node of nodes) {
    if (node.name === name) return node.id
    if (node.children?.length) {
      const found = findDeptIdByName(node.children, name)
      if (found !== null) return found
    }
  }
  return null
}

const loadDeptTree = async () => {
  try {
    const res = await api.post('/api/auth/dept/tree')
    const root = (res as any).data || res
    deptOptions.value = root ? [root] : []
  } catch {
    ElMessage.error('加载部门失败')
  }
}

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  workNo: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  deptId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  originStatus: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const load = async () => {
  loading.value = true
  try {
    const res = await api.post('/api/auth/user/page', {
      pageNum: page.value,
      pageSize: size.value
    })
    const data = (res as any).data || res
    list.value = (data.records || []).map((item: any) => ({
      ...item,
      id: item.id != null ? String(item.id) : null,
      deptId: item.deptId != null ? String(item.deptId) : null
    }))
    total.value = data.total || 0
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (val: number) => { page.value = val; load() }
const handleSizeChange = (val: number) => { size.value = val; page.value = 1; load() }

const handleAdd = () => {
  form.value = {
    id: null,
    deptId: null,
    workNo: '',
    name: '',
    mobile: '',
    position: '',
    originStatus: 1,
    password: ''
  }
  nextTick(() => formRef.value?.clearValidate())
  drawer.value = true
}

const handleEdit = (row: any) => {
  let deptId = row.deptId ?? null
  if (!deptId && row.deptName && deptOptions.value.length) {
    deptId = String(findDeptIdByName(deptOptions.value, row.deptName) ?? null)
  }

  form.value = {
    id: row.id != null ? String(row.id) : null,
    workNo: row.workNo || '',
    name: row.name || '',
    mobile: row.mobile || '',
    position: row.position || '',
    originStatus: row.status ?? 1,
    password: '',
    deptId: deptId,
    status: row.status ?? 1
  }

  nextTick(() => formRef.value?.clearValidate())
  drawer.value = true
}

const handleClose = (done: () => void) => {
  formRef.value?.clearValidate()
  done()
}

const submit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    const url = form.value.id ? '/api/auth/user/update' : '/api/auth/user/add'
    await api.post(url, form.value)
    ElMessage.success(form.value.id ? '修改成功' : '新增成功')
    drawer.value = false
    load()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定删除该员工吗？', '警告', { type: 'warning' }).then(async () => {
    await api.post('/api/auth/user/delete', { id: String(row.id) })
    ElMessage.success('删除成功')
    load()
  })
}

onMounted(() => {
  load()
  loadDeptTree()
})
</script>

<style scoped>
.page-container {
  padding: 32px 0;
}

/* 标题栏：简约现代 */
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
  line-height: 1.2;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 32px;
}

.header-info .total-text {
  font-size: 18px;
  color: #606266;
  font-weight: 500;
}

/* 新增按钮：大气渐变 */
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

/* 表格卡片 */
.table-card {
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  border: none;
}

.data-table {
  border-radius: 16px;
  overflow: hidden;
}

/* 分页容器 */
.pagination-wrapper {
  padding: 48px 0;
  display: flex;
  justify-content: center;
}

/* 中文分页 */
.chinese-pagination {
  display: flex;
  align-items: center;
  gap: 32px;
  font-size: 15px;
  font-weight: 500;
}

.chinese-pagination .total-text {
  color: #606266;
}

.chinese-pagination .sizes-prefix {
  color: #606266;
  margin-right: 8px;
}

.chinese-pagination .sizes-select {
  width: 110px;
}

/* 页码按钮 */
:deep(.chinese-pagination .el-pager li) {
  min-width: 44px !important;
  height: 44px !important;
  line-height: 44px !important;
  border-radius: 12px !important;
  margin: 0 6px !important;
}

:deep(.chinese-pagination .el-pager li.active) {
  background: linear-gradient(to right, #667eea, #764ba2) !important;
  color: #fff !important;
}

/* 上一页下一页 */
:deep(.chinese-pagination .btn-prev),
:deep(.chinese-pagination .btn-next) {
  width: 96px !important;
  height: 44px !important;
  border-radius: 12px !important;
  background: rgba(102, 126, 234, 0.08) !important;
  color: #667eea !important;
}

:deep(.chinese-pagination .btn-prev:hover),
:deep(.chinese-pagination .btn-next:hover) {
  background: #667eea !important;
  color: #fff !important;
}

/* 抽屉内容正常显示 + 美化 */
:deep(.el-drawer__body) {
  padding: 0 32px 80px 32px; /* 为 footer 留空间 */
  overflow-y: auto;
}

.drawer-form {
  padding-top: 20px;
}

:deep(.drawer-form .el-form-item) {
  margin-bottom: 28px;
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 24px 32px;
  font-size: 22px;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
}

.drawer-footer {
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

/* 输入框 */
:deep(.el-input__wrapper) {
  border-radius: 16px;
  height: 48px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 表头 */
:deep(.el-table th.el-table__cell) {
  background-color: #f8f9fb !important;
  color: #1f2329;
  font-weight: 600;
}
</style>
<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 标题栏 -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">员工管理</h1>
          <p class="text-gray-500 mt-1">共 {{ total }} 位员工</p>
        </div>
        <el-button type="primary" size="large" @click="handleAdd" class="shadow-lg">
          <i class="el-icon-plus mr-2"></i>
          新增员工
        </el-button>
      </div>

      <!-- 表格 -->
      <el-card shadow="hover" class="shadow-sm">
        <el-table :data="list" v-loading="loading" stripe border class="rounded-lg mb-4">
          <!-- 姓名 + 头像 -->
          <el-table-column label="姓名" width="160" fixed="left">
            <template #default="{ row }">
              <div class="flex items-center space-x-3">
                <el-avatar :size="36" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                <span class="font-medium text-gray-800">{{ row.name || '--' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="workNo" label="工号" width="110" align="center">
            <template #default="{ row }">
              <span class="text-gray-600 font-medium">{{ row.workNo || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="mobile" label="手机号" width="140" align="center">
            <template #default="{ row }">
              <span class="font-mono">{{ row.mobile || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="position" label="职位" width="120" align="center">
            <template #default="{ row }">
              <span class="text-gray-700">{{ row.position || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="部门" width="160" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.deptName" size="small" type="primary" effect="plain" class="w-28">
                {{ row.deptName }}
              </el-tag>
              <span v-else class="text-gray-400 text-xs">未分配部门</span>
            </template>
          </el-table-column>

          <el-table-column label="邮箱" width="200" align="center">
            <template #default="{ row }">
              <span class="text-blue-600 text-sm" v-if="row.email">{{ row.email }}</span>
              <span v-else class="text-gray-400 text-xs">未填写</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="large" effect="dark">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="130" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="flex justify-center mt-8 pb-4">
          <el-pagination
            background
            v-model:current-page="page"
            v-model:page-size="size"
            :total="total"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </el-card>

      <!-- 新增/编辑抽屉 -->
      <el-drawer
        v-model="drawer"
        :title="form.id ? '编辑员工' : '新增员工'"
        direction="rtl"
        size="500px"
        :before-close="handleClose"
      >
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="px-6">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>

          <el-form-item label="工号" prop="workNo">
            <el-input v-model="form.workNo" placeholder="请输入工号" />
          </el-form-item>

          <el-form-item label="手机号" prop="mobile">
            <el-input v-model="form.mobile" placeholder="请输入手机号" />
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
              :props="{ label: 'name', value: 'id', children: 'children' }"
            />
          </el-form-item>

          <el-form-item label="职位" prop="position">
            <el-input v-model="form.position" placeholder="请输入职位" />
          </el-form-item>

          <el-form-item label="初始密码">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="不填则默认为 123456"
              show-password
            />
          </el-form-item>

          <el-form-item label="状态" prop="originStatus">
            <el-radio-group v-model="form.originStatus">
              <el-radio :label="1">启用</el-radio>
              <el-radio :label="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="flex justify-end gap-3">
            <el-button @click="drawer = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="submit">
              {{ form.id ? '保存' : '立即创建' }}
            </el-button>
          </div>
        </template>
      </el-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

// 关键：改成 ref + 每次完整替换对象 → 彻底解决 id 错乱！
const form = ref({
  id: null as number | null,
  deptId: null as number | null,
  workNo: '',
  name: '',
  mobile: '',
  position: '',
  originStatus: 1,
  password: ''
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

// 辅助函数：根据部门名找 id（兼容后端没返回 deptId）
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

// 加载部门树
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
    list.value = data.records || []
    total.value = data.total || 0
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (val: number) => { page.value = val; load() }
const handleSizeChange = (val: number) => { size.value = val; page.value = 1; load() }

// 新增
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
  nextTick(() => formRef.value?.resetFields())
  drawer.value = true
}

// 编辑（完美版！再也不串了！）
const handleEdit = (row: any) => {
  form.value = {
    id: row.id,
    workNo: row.workNo || '',
    name: row.name || '',
    mobile: row.mobile || '',
    position: row.position || '',
    originStatus: row.status ?? 1,
    password: '',
    deptId: row.deptId ?? null  // 优先用 deptId
  }

  // 如果后端没返回 deptId，就用 deptName 反查（兼容当前情况）
  nextTick(() => {
    if (!form.value.deptId && row.deptName && deptOptions.value.length) {
      form.value.deptId = findDeptIdByName(deptOptions.value, row.deptName)
    }
    formRef.value?.resetFields()
  })

  drawer.value = true
}

const handleClose = (done: () => void) => {
  formRef.value?.resetFields()
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
    await api.post('/api/auth/user/delete', { id: row.id })
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
.el-table { overflow: hidden; }
.el-table__body-wrapper { overflow-x: hidden; }
:deep(.el-table__body), :deep(.el-table__header) { width: 100% !important; table-layout: fixed; }
:deep(.el-table th), :deep(.el-table td) { padding: 12px 0; }
</style>
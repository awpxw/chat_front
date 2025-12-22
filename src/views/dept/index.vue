<template>
  <div class="page-container">
    <!-- 标题栏（去掉新增根部门按钮） -->
    <div class="header-section">
      <h1 class="page-title">部门管理</h1>
    </div>

    <!-- 部门树 + 子部门表格 -->
    <el-card class="table-card">
      <el-row :gutter="32">
        <!-- 左侧树（纯展示） -->
        <el-col :span="9">
          <div class="tree-wrapper" v-loading="treeLoading">
            <el-tree
              :data="deptTree"
              :props="treeProps"
              node-key="id"
              highlight-current
              @node-click="handleNodeClick"
              :expand-on-click-node="false"
              :default-expanded-keys="expandedKeys"
              class="dept-tree"
            >
              <template #default="{ node }">
                <div class="tree-node">
                  <el-icon class="tree-icon">
                    <FolderOpened v-if="node.expanded" />
                    <Folder v-else />
                  </el-icon>
                  <span class="tree-label">{{ node.label }}</span>
                </div>
              </template>
            </el-tree>

            <div v-if="!treeLoading && deptTree.length === 0" class="empty-tip text-center py-20 text-gray-500">
              暂无部门数据
            </div>
          </div>
        </el-col>

        <!-- 右侧子部门列表 -->
        <el-col :span="15">
          <div class="sub-dept-header flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-gray-800">
              {{ currentDeptName ? `${currentDeptName} 的子部门` : '请选择部门查看子部门' }}
            </h3>
            <el-button v-if="currentNodeId" type="primary" size="default" @click="handleAddChild(currentNode)">
              <el-icon class="mr-1"><Plus /></el-icon>
              新增子部门
            </el-button>
          </div>

          <el-table :data="childrenList" stripe border class="data-table" v-loading="tableLoading">
            <el-table-column prop="name" label="部门名称" />
            <el-table-column prop="sort" label="排序" width="100" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="!currentNodeId && !tableLoading" class="empty-tip text-center py-20 text-gray-500">
            请在左侧选择一个部门查看其子部门
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新增/编辑抽屉 -->
    <el-drawer
      v-model="drawer"
      :title="form.id ? '编辑部门' : '新增部门'"
      direction="rtl"
      size="520px"
    >
      <div class="drawer-content">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="drawer-form">
  <el-form-item label="部门名称" prop="name">
    <el-input v-model="form.name" placeholder="请输入部门名称" size="large" />
  </el-form-item>

  <el-form-item label="上级部门">
    <span class="text-gray-500 text-sm">
      {{ parentDeptName || '无（将作为根部门）' }}
    </span>
  </el-form-item>

  <el-form-item label="排序" prop="sort">
    <el-input-number v-model="form.sort" :min="0" :max="999" controls-position="right" style="width: 100%" size="large" />
  </el-form-item>

  <el-form-item label="状态" prop="status">
    <el-radio-group v-model="form.status" size="large">
      <el-radio :label="1">启用</el-radio>
      <el-radio :label="0">禁用</el-radio>
    </el-radio-group>
  </el-form-item>
</el-form>
      </div>

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
import { ref, onMounted, nextTick, computed } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Folder, FolderOpened } from '@element-plus/icons-vue'

interface DeptVO {
  id: number
  parentId?: number
  name: string
  sort?: number
  status?: number
  children?: DeptVO[]
}

const deptTree = ref<DeptVO[]>([])
const childrenList = ref<DeptVO[]>([])
const expandedKeys = ref<number[]>([])
const currentNode = ref<DeptVO | null>(null)
const currentNodeId = ref<number | null>(null)
const treeLoading = ref(true)

const drawer = ref(false)
const submitting = ref(false)
const formRef = ref<any>(null)

const form = ref({
  id: null as number | null,
  parentId: null as number | null,
  name: '',
  sort: 0,
  status: 1
})

const treeProps = {
  label: 'name',
  children: 'children'
}

const rules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
}

const currentDeptName = computed(() => currentNode.value?.name || '')

const parentDeptName = computed(() => {
  if (!form.value.parentId || !deptTree.value.length) return ''
  const findName = (nodes: DeptVO[]): string | null => {
    for (const node of nodes) {
      if (node.id === form.value.parentId) return node.name
      if (node.children?.length) {
        const found = findName(node.children)
        if (found) return found
      }
    }
    return null
  }
  return findName(deptTree.value) || ''
})

const loadDeptTree = async () => {
  treeLoading.value = true
  try {
    const res = await api.post('/api/auth/dept/tree')
    let rootDept = res.data || res

    if (rootDept) {
      deptTree.value = [rootDept]
      expandedKeys.value = [rootDept.id]
      handleNodeClick(rootDept)
    } else {
      deptTree.value = []
      childrenList.value = []
    }
  } catch (err) {
    ElMessage.error('加载部门树失败')
    deptTree.value = []
    childrenList.value = []
  } finally {
    treeLoading.value = false
  }
}

const handleNodeClick = (data: DeptVO) => {
  currentNode.value = data
  currentNodeId.value = data.id
  childrenList.value = data.children || []
}

// 只允许新增子部门（选中部门后右侧按钮）
const handleAddChild = (node: DeptVO) => {
  form.value = {
    id: null,
    parentId: node.id,
    name: '',
    sort: 0,
    status: 1
  }
  nextTick(() => formRef.value?.clearValidate())
  drawer.value = true
}

const handleEdit = (row: DeptVO) => {
  form.value = {
    id: row.id,
    parentId: row.parentId ?? null,
    name: row.name,
    sort: row.sort ?? 0,
    status: row.status ?? 1
  }
  nextTick(() => formRef.value?.clearValidate())
  drawer.value = true
}

const handleDelete = (row: DeptVO) => {
  ElMessageBox.confirm('确定删除该部门吗？删除后不可恢复！', '警告', { type: 'warning' }).then(async () => {
    await api.post('/api/auth/dept/delete', { id: row.id })
    ElMessage.success('删除成功')
    loadDeptTree()
  })
}

const submit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    const url = form.value.id ? '/api/auth/dept/update' : '/api/auth/dept/update'  // 统一用 update
    await api.post(url, form.value)
    ElMessage.success(form.value.id ? '修改成功' : '新增成功')
    drawer.value = false
    loadDeptTree()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDeptTree()
})
</script>

<style scoped>
.page-container {
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

/* 左侧树整体容器 */
.tree-wrapper {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  height: 680px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.dept-tree {
  background: transparent;
  font-size: 15px;
}

/* 修正节点高度，避免相互挤压 */
:deep(.el-tree-node__content) {
  height: 52px !important;
  line-height: 52px !important;
  margin-bottom: 4px;
}

/* 树节点基础样式 */
.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tree-node:hover {
  background: #f5f7fa;
}

/* 图标 */
.tree-icon {
  font-size: 18px;
  color: #909399;
  margin-right: 14px;
  transition: color 0.3s;
}

/* 文字 */
.tree-label {
  font-weight: 500;
  color: #303133;
}

/* 选中节点：恢复你喜欢的深紫蓝渐变高亮 + 完美贴合大小 */
:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: transparent !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content .tree-node) {
  background: linear-gradient(to right, #667eea, #764ba2) !important;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.el-tree-node.is-current > .el-tree-node__content .tree-icon),
:deep(.el-tree-node.is-current > .el-tree-node__content .tree-label) {
  color: #ffffff !important;
  font-weight: 600;
}

/* 展开箭头 */
:deep(.el-tree-node__expand-icon) {
  font-size: 16px;
  color: #c0c4cc;
  padding: 8px;
  transition: color 0.3s;
}

:deep(.el-tree-node__expand-icon.expanded) {
  color: #667eea;
}

:deep(.el-tree-node__expand-icon:hover) {
  color: #667eea;
}

/* 子节点缩进 */
:deep(.el-tree-node__children .el-tree-node__content) {
  padding-left: 20px !important;
}

.sub-dept-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.empty-tip {
  color: #909399;
  font-size: 16px;
}

.data-table {
  margin-top: 24px;
}

/* 抽屉 */
:deep(.el-drawer__header) {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  font-size: 22px;
  font-weight: 600;
}

:deep(.el-drawer__body) {
  padding: 0 32px;
  overflow-y: auto;
}

.drawer-content {
  padding-bottom: 80px;
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
</style>
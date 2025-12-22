<template>
  <div class="page-container">
    <!-- 标题栏 -->
    <div class="header-section">
      <h1 class="page-title">菜单管理</h1>
      <div class="header-info">
        <el-button type="primary" size="large" @click="handleAddRoot" class="add-btn">
          <el-icon class="mr-2"><Plus /></el-icon>
          新增一级菜单
        </el-button>
      </div>
    </div>

    <!-- 菜单树 + 子菜单表格 -->
    <el-card class="table-card">
      <el-row :gutter="32">
        <!-- 左侧树 -->
        <el-col :span="9">
          <div class="tree-wrapper" v-loading="treeLoading">
            <el-tree
              :data="menuTree"
              :props="treeProps"
              node-key="id"
              highlight-current
              @node-click="handleNodeClick"
              :expand-on-click-node="false"
              :default-expanded-keys="expandedKeys"
              class="menu-tree"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <el-icon class="tree-icon">
                    <FolderOpened v-if="node.expanded && data.type === 0" />
                    <Folder v-else-if="data.type === 0" />
                    <Document v-else-if="data.type === 2" />
                    <Menu v-else />
                  </el-icon>
                  <span class="tree-label">{{ node.label }}</span>
                  <span class="tree-type text-xs text-gray-500 ml-2">
                    {{ data.type === 0 ? '目录' : data.type === 1 ? '菜单' : '按钮' }}
                  </span>
                  <span class="tree-code text-gray-500 text-sm ml-auto">{{ data.perms || '-' }}</span>
                </div>
              </template>
            </el-tree>

            <div v-if="!treeLoading && menuTree.length === 0" class="empty-tip text-center py-20 text-gray-500">
              暂无菜单数据
            </div>
          </div>
        </el-col>

        <!-- 右侧子菜单列表 -->
        <el-col :span="15">
          <div class="sub-menu-header flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-gray-800">
              {{ currentMenuName ? `${currentMenuName} 的子菜单` : '请选择菜单查看子菜单' }}
            </h3>
            <el-button v-if="currentNodeId" type="primary" size="default" @click="handleAddChild(currentNode!)">
              <el-icon class="mr-1"><Plus /></el-icon>
              新增子菜单
            </el-button>
          </div>

          <el-table :data="childrenList" stripe border class="data-table">
            <el-table-column prop="name" label="菜单名称" />
            <el-table-column prop="perms" label="权限标识" width="200">
              <template #default="{ row }">
                <code class="text-xs bg-gray-100 px-2 py-1 rounded">{{ row.perms || '-' }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === 0 ? 'info' : row.type === 1 ? 'primary' : 'success'">
                  {{ row.type === 0 ? '目录' : row.type === 1 ? '菜单' : '按钮' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="path" label="路由路径" width="180" />
            <el-table-column prop="component" label="组件路径" width="220" />
            <el-table-column prop="sort" label="排序" width="80" align="center" />
            <el-table-column prop="visible" label="可见" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.visible === 1 ? 'success' : 'danger'">
                  {{ row.visible === 1 ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="!currentNodeId && !treeLoading" class="empty-tip text-center py-20 text-gray-500">
            请在左侧选择一个菜单查看其子菜单
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新增/编辑抽屉 -->
    <el-drawer
      v-model="drawer"
      :title="form.id ? '编辑菜单' : '新增菜单'"
      direction="rtl"
      size="600px"
    >
      <div class="drawer-content">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
          <el-form-item label="菜单名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入菜单名称" size="large" />
          </el-form-item>

          <el-form-item label="上级菜单">
            <span class="text-gray-500 text-sm">
              {{ parentMenuName || '根菜单' }}
            </span>
          </el-form-item>

          <el-form-item label="类型" prop="type">
            <el-radio-group v-model="form.type" size="large">
              <el-radio :label="0">目录</el-radio>
              <el-radio :label="1">菜单</el-radio>
              <el-radio :label="2">按钮</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="路由路径" prop="path">
            <el-input v-model="form.path" placeholder="如 /system/user" size="large" />
          </el-form-item>

          <el-form-item label="组件路径" prop="component">
            <el-input v-model="form.component" placeholder="如 system/user/index" size="large" />
          </el-form-item>

          <el-form-item label="权限标识" prop="perms">
            <el-input v-model="form.perms" placeholder="如 system:user:list" size="large" />
          </el-form-item>

          <el-form-item label="图标" prop="icon">
            <el-input v-model="form.icon" placeholder="Element Plus 图标名，如 User" size="large" />
          </el-form-item>

          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :min="0" :max="999" controls-position="right" style="width: 100%" size="large" />
          </el-form-item>

          <el-form-item label="是否可见" prop="visible">
            <el-radio-group v-model="form.visible" size="large">
              <el-radio :label="1">是</el-radio>
              <el-radio :label="0">否</el-radio>
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
import { Plus, Folder, FolderOpened, Menu, Document } from '@element-plus/icons-vue'

interface MenuTreeVO {
  id: number
  parentId?: number
  name: string
  path?: string
  component?: string
  perms?: string
  type: number
  icon?: string
  sort?: number
  visible?: number
  children?: MenuTreeVO[]
}

const menuTree = ref<MenuTreeVO[]>([])
const childrenList = ref<MenuTreeVO[]>([])
const expandedKeys = ref<number[]>([])
const currentNode = ref<MenuTreeVO | null>(null)
const currentNodeId = ref<number | null>(null)
const treeLoading = ref(true)

const drawer = ref(false)
const submitting = ref(false)
const formRef = ref<any>(null)

const form = ref({
  id: null as number | null,
  parentId: null as number | null,
  name: '',
  path: '',
  component: '',
  perms: '',
  type: 1,
  icon: '',
  sort: 0,
  visible: 1
})

const treeProps = {
  label: 'name',
  children: 'children'
}

const rules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
  component: [{ required: true, message: '请输入组件路径', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
  visible: [{ required: true, message: '请选择是否可见', trigger: 'change' }]
}

const currentMenuName = computed(() => currentNode.value?.name || '')

const parentMenuName = computed(() => {
  if (!form.value.parentId || !menuTree.value.length) return ''
  const findName = (nodes: MenuTreeVO[]): string | null => {
    for (const node of nodes) {
      if (node.id === form.value.parentId) return node.name
      if (node.children?.length) {
        const found = findName(node.children)
        if (found) return found
      }
    }
    return null
  }
  return findName(menuTree.value) || ''
})

const loadMenuTree = async () => {
  treeLoading.value = true
  try {
    const res = await api.post('/api/auth/menu/tree')
    const treeList: MenuTreeVO[] = res?.menuTree || []

    menuTree.value = treeList

    if (menuTree.value.length > 0) {
      expandedKeys.value = menuTree.value.map(node => node.id)

      await nextTick()
      const firstNode = menuTree.value[0]
      if (firstNode) {
        handleNodeClick(firstNode)
      }
    } else {
      childrenList.value = []
    }
  } catch (err) {
    ElMessage.error('加载菜单树失败')
    menuTree.value = []
    childrenList.value = []
  } finally {
    treeLoading.value = false
  }
}

const handleNodeClick = (data: MenuTreeVO) => {
  currentNode.value = data
  currentNodeId.value = data.id
  childrenList.value = data.children || []
}

const handleAddRoot = () => {
  form.value = {
    id: null,
    parentId: null,
    name: '',
    path: '',
    component: '',
    perms: '',
    type: 1,
    icon: '',
    sort: 0,
    visible: 1
  }
  nextTick(() => formRef.value?.clearValidate())
  drawer.value = true
}

const handleAddChild = (node: MenuTreeVO) => {
  form.value = {
    id: null,
    parentId: node.id,
    name: '',
    path: '',
    component: '',
    perms: '',
    type: 1,
    icon: '',
    sort: 0,
    visible: 1
  }
  nextTick(() => formRef.value?.clearValidate())
  drawer.value = true
}

const handleEdit = (row: MenuTreeVO) => {
  form.value = {
    id: row.id,
    parentId: row.parentId ?? null,
    name: row.name,
    path: row.path || '',
    component: row.component || '',
    perms: row.perms || '',
    type: row.type,
    icon: row.icon || '',
    sort: row.sort ?? 0,
    visible: row.visible ?? 1
  }
  nextTick(() => formRef.value?.clearValidate())
  drawer.value = true
}

const handleDelete = (row: MenuTreeVO) => {
  ElMessageBox.confirm('确定删除该菜单吗？删除后不可恢复！', '警告', { type: 'warning' }).then(async () => {
    await api.post('/api/auth/menu/delete', { id: row.id })
    ElMessage.success('删除成功')
    loadMenuTree()
  })
}

const submit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    await api.post('/api/auth/menu/update', form.value)
    ElMessage.success(form.value.id ? '修改成功' : '新增成功')
    drawer.value = false
    loadMenuTree()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadMenuTree()
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

/* 树节点整体 */
.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  height: 56px; /* 高度增加，呼吸感更强 */
  padding: 0 20px; /* 左右内边距加大，让内容不贴边 */
  border-radius: 12px;
  transition: all 0.3s ease;
  box-sizing: border-box; /* 关键：确保 padding 计入宽度 */
}

/* hover 效果：背景更明显，且完整覆盖整个节点 */
.tree-node:hover {
  background: rgba(102, 126, 234, 0.18) !important; /* 更深的紫色透明背景 */
}

/* 选中节点高亮：强到瞎眼！背景 + 文字加粗 + 图标变色 */
.menu-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: rgba(102, 126, 234, 0.25) !important; /* 选中背景深紫透明 */
  font-weight: 600 !important;
}

.menu-tree :deep(.el-tree-node.is-current > .el-tree-node__content .tree-icon) {
  color: #667eea !important; /* 选中时图标高亮 */
}

.menu-tree :deep(.el-tree-node.is-current > .el-tree-node__content .tree-label) {
  color: #667eea !important; /* 选中文字变主色调 */
}

/* 重点：让 hover 和选中背景完整覆盖整个节点高度和宽度 */
.menu-tree :deep(.el-tree-node__content) {
  height: 56px !important; /* 与 tree-node 高度一致 */
  padding-left: 0 !important; /* 清除默认缩进影响 */
  border-radius: 12px;
  transition: all 0.3s ease;
}

/* hover 时也覆盖整个节点 */
.menu-tree :deep(.el-tree-node__content:hover) {
  background: rgba(102, 126, 234, 0.18) !important;
}

/* 图标大小和颜色 */
.tree-icon {
  font-size: 20px;
  color: #667eea;
  margin-right: 14px;
  flex-shrink: 0;
}

/* 名称标签：支持长文本省略 */
.tree-label {
  font-weight: 500;
  color: #303133;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 类型标签：小巧美观 */
.tree-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  margin-left: 12px;
  flex-shrink: 0;
}

/* 权限标识：始终可见，不被挤掉 */
.tree-code {
  font-size: 12px;
  color: #909399;
  margin-left: 16px;
  flex-shrink: 0;
  max-width: 200px; /* 限制最大宽度，超长省略 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 树容器高度稍增加，内容更多时不拥挤 */
.tree-wrapper {
  height: 760px; /* 原 680px → 760px */
}

.sub-menu-header {
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
<template>
  <div class="layout-wrapper">
    <!-- 背景装饰 -->
    <div class="bg-decoration"></div>

    <el-container class="layout-container">
      <!-- 顶部 Header（毛玻璃效果） -->
      <el-header class="header">
        <div class="header-left">
          <h1 class="header-title">企业后台管理系统</h1>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="user-info cursor-pointer">
              <el-avatar
                :size="40"
                src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
                class="mr-3"
              />
              <span class="username">Admin</span>
              <el-icon class="el-icon--right ml-2"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container>
        <!-- 左侧菜单（毛玻璃侧边栏） -->
        <el-aside width="240px" class="aside">
          <el-menu
            :default-active="$route.path"
            router
            class="menu"
          >
            <el-menu-item index="/user">
              <el-icon><User /></el-icon>
              <span class="menu-text">员工管理</span>
            </el-menu-item>

            <!-- 更多菜单项示例 -->
            <!-- <el-menu-item index="/dept">
              <el-icon><OfficeBuilding /></el-icon>
              <span class="menu-text">部门管理</span>
            </el-menu-item> -->
          </el-menu>
        </el-aside>

        <!-- 主内容区 -->
        <el-main class="main">
          <div class="content-wrapper">
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { User, ArrowDown, SwitchButton } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'

const router = useRouter()

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/login')
  })
}
</script>

<style scoped>
/* 整体包装器 */
.layout-wrapper {
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
}

/* 背景装饰圆形（与登录/注册一致） */
.bg-decoration {
  position: absolute;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.12);
  top: -400px;
  left: -400px;
  z-index: 0;
}

.layout-wrapper::after {
  content: '';
  position: absolute;
  width: 900px;
  height: 900px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.1);
  bottom: -450px;
  right: -450px;
  z-index: 0;
}

/* 布局容器 */
.layout-container {
  height: 100vh;
  z-index: 1;
  position: relative;
}

/* Header 毛玻璃 */
.header {
  backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

/* Aside 毛玻璃侧边栏 */
.aside {
  backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.85);
  border-right: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
}

.menu {
  background: transparent;
  border-right: none;
  height: calc(100vh - 60px);
}

.menu .el-menu-item {
  height: 56px;
  line-height: 56px;
  font-size: 15px;
  margin: 8px 16px;
  border-radius: 12px;
  transition: all 0.3s;
}

.menu .el-menu-item:hover {
  background: rgba(102, 126, 234, 0.15) !important;
}

.menu .el-menu-item.is-active {
  background: linear-gradient(to right, #667eea, #764ba2);
  color: #ffffff !important;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.menu-text {
  margin-left: 8px;
}

/* Main 内容区 */
.main {
  padding: 32px;
  overflow-y: auto;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  min-height: calc(100vh - 120px);
}
</style>
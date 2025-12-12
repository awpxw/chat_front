<template>
  <el-container class="h-screen">
    <el-header>企业后台管理系统</el-header>
    <el-container>
      <el-aside width="200px">
        <el-menu :default-active="$route.path" router>
          <el-menu-item index="/user">
            <el-icon><User /></el-icon>员工管理
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { User } from '@element-plus/icons-vue'
</script>
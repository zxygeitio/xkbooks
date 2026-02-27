<template>
  <el-container class="main-layout">
    <StarrySky />
    <el-aside :width="isCollapse ? '72px' : '240px'" class="sidebar">
      <div class="logo">
        <div class="logo-icon">
          <el-icon size="24"><Reading /></el-icon>
        </div>
        <transition name="fade">
          <span v-show="!isCollapse" class="logo-text">星空图书馆</span>
        </transition>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/books">
          <el-icon><Reading /></el-icon>
          <template #title>图书管理</template>
        </el-menu-item>
        <el-menu-item index="/borrow">
          <el-icon><Tickets /></el-icon>
          <template #title>借阅记录</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/categories">
          <el-icon><Grid /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/statistics">
          <el-icon><TrendCharts /></el-icon>
          <template #title>统计分析</template>
        </el-menu-item>
      </el-menu>
      
      <div class="sidebar-footer">
        <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
          <component :is="isCollapse ? 'Expand' : 'Fold'" />
        </el-icon>
      </div>
    </el-aside>
    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="36" class="user-avatar">
                {{ userStore.user?.name?.charAt(0) }}
              </el-avatar>
              <div class="user-detail">
                <span class="username">{{ userStore.user?.name }}</span>
                <el-tag size="small" :type="userStore.isAdmin ? 'danger' : 'info'" class="role-tag">
                  {{ userStore.isAdmin ? '管理员' : '用户' }}
                </el-tag>
              </div>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/profile')">
                  <el-icon><User /></el-icon>
                  <span>个人信息</span>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-fast" mode="out-in">
            <keep-alive :include="['Dashboard', 'Books', 'BorrowRecords']">
              <component :is="Component" :key="$route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessageBox } from 'element-plus'
import { 
  Reading, DataAnalysis, Tickets, Grid, User, 
  TrendCharts, Expand, Fold, SwitchButton, ArrowDown 
} from '@element-plus/icons-vue'
import StarrySky from '../components/StarrySky.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)

const routeTitles = {
  '/': '仪表盘',
  '/books': '图书管理',
  '/borrow': '借阅记录',
  '/categories': '分类管理',
  '/users': '用户管理',
  '/statistics': '统计分析',
  '/profile': '个人信息'
}

const currentTitle = computed(() => {
  if (route.path.startsWith('/books/') && route.path !== '/books') {
    return '图书详情'
  }
  return routeTitles[route.path] || ''
})

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/login')
  })
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  position: relative;
}

.sidebar {
  background: rgba(10, 15, 26, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  letter-spacing: 1px;
}

.sidebar-menu {
  flex: 1;
  border-right: none !important;
  padding: 12px 8px;
  overflow-y: auto;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 100%;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: center;
}

.collapse-btn {
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.collapse-btn:hover {
  color: #f1f5f9;
  background: rgba(148, 163, 184, 0.1);
}

.main-container {
  position: relative;
  z-index: 5;
  background: transparent;
}

.header {
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
}

:deep(.el-breadcrumb__inner),
:deep(.el-breadcrumb__separator) {
  color: #94a3b8;
}

:deep(.el-breadcrumb__inner a),
:deep(.el-breadcrumb__inner.is-link) {
  color: #94a3b8;
  font-weight: 400;
}

:deep(.el-breadcrumb__inner a:hover),
:deep(.el-breadcrumb__inner.is-link:hover) {
  color: #f1f5f9;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #f1f5f9;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  transition: background 0.2s;
}

.user-info:hover {
  background: rgba(148, 163, 184, 0.1);
}

.user-avatar {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  font-weight: 600;
}

.user-detail {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #f1f5f9;
}

.role-tag {
  font-size: 11px;
  padding: 0 6px;
  height: 18px;
  line-height: 16px;
}

.arrow-icon {
  color: #64748b;
  font-size: 12px;
  transition: transform 0.2s;
}

.user-info:hover .arrow-icon {
  transform: rotate(180deg);
}

.main-content {
  padding: 24px;
  overflow-y: auto;
  background: transparent;
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease-out;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease-out;
}

.slide-fade-enter-from {
  transform: translateY(8px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}

:deep(.el-dropdown-menu) {
  background: rgba(17, 24, 39, 0.98) !important;
  border: 1px solid rgba(148, 163, 184, 0.15) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
  padding: 8px 0 !important;
  margin: 0 !important;
}

:deep(.el-dropdown-menu__item) {
  color: #f1f5f9 !important;
  padding: 10px 20px !important;
  margin: 0 !important;
  line-height: 1.5 !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-dropdown-menu__item:hover) {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #60a5fa !important;
}

:deep(.el-dropdown-menu__item .el-icon) {
  color: #64748b;
  font-size: 16px;
}

:deep(.el-dropdown-menu__item:hover .el-icon) {
  color: #60a5fa;
}

:deep(.el-dropdown-menu__item--divided) {
  border-top: 1px solid rgba(148, 163, 184, 0.15) !important;
  margin-top: 0 !important;
  padding-top: 10px !important;
}

:deep(.el-dropdown-menu__item--divided::before) {
  display: none !important;
}

:deep(.el-popper.is-light) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.el-popper.is-pure) {
  background: transparent !important;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
  }
  
  .sidebar:not(.el-aside--collapse) {
    transform: translateX(0);
  }
  
  .header {
    padding: 0 16px;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .user-detail {
    display: none;
  }
}
</style>

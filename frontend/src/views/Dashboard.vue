<template>
  <div class="dashboard">
    <div class="welcome-section">
      <h1 class="welcome-title">欢迎回来，{{ userStore.user?.name }}</h1>
      <p class="welcome-subtitle">探索知识的无限可能</p>
    </div>

    <el-row :gutter="20" v-if="userStore.isAdmin" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
            <el-icon size="24"><Reading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalBooks }}</div>
            <div class="stat-label">图书总数</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <el-icon size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.availableBooks }}</div>
            <div class="stat-label">可借图书</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <el-icon size="24"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">注册用户</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            <el-icon size="24"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.overdueBorrows }}</div>
            <div class="stat-label">逾期未还</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="content-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><TrendCharts /></el-icon>
                热门图书
              </span>
            </div>
          </template>
          <el-table :data="popularBooks" stripe v-loading="loading" class="data-table">
            <el-table-column prop="title" label="书名" min-width="180">
              <template #default="{ row }">
                <span class="book-title-cell">{{ row.title }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="author" label="作者" width="120" />
            <el-table-column prop="borrow_count" label="借阅次数" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="primary" effect="dark" class="count-tag">{{ row.borrow_count }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="content-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Grid /></el-icon>
                分类统计
              </span>
            </div>
          </template>
          <div class="category-stats">
            <div 
              v-for="item in categoryStats" 
              :key="item.category" 
              class="category-item"
            >
              <div class="category-info">
                <span class="category-name">{{ item.category }}</span>
                <span class="category-count">{{ item.book_count }} 本</span>
              </div>
              <el-progress 
                :percentage="getPercentage(item.book_count)" 
                :stroke-width="8"
                :show-text="false"
                class="category-progress"
              />
            </div>
            <el-empty v-if="!categoryStats.length" description="暂无数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row" v-if="userStore.isAdmin">
      <el-col :span="24">
        <el-card shadow="hover" class="content-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Warning /></el-icon>
                逾期提醒
              </span>
              <el-tag v-if="overdueList.length" type="danger" effect="dark" class="overdue-tag">
                {{ overdueList.length }} 条
              </el-tag>
            </div>
          </template>
          <el-table :data="overdueList" stripe max-height="300" class="data-table">
            <el-table-column prop="title" label="书名" min-width="180" />
            <el-table-column prop="user_name" label="借阅人" width="100" />
            <el-table-column prop="due_date" label="应还日期" width="120">
              <template #default="{ row }">
                <span class="overdue-date">{{ formatDate(row.due_date) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="逾期天数" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="danger" effect="dark">{{ getOverdueDays(row.due_date) }} 天</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="联系电话" width="130" />
          </el-table>
          <el-empty v-if="!overdueList.length" description="暂无逾期记录" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="content-card" v-if="!userStore.isAdmin">
      <template #header>
        <span class="card-title">
          <el-icon><Tickets /></el-icon>
          我的借阅
        </span>
      </template>
      <el-table :data="myBorrows" stripe class="data-table">
        <el-table-column prop="title" label="书名" min-width="180" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="borrow_date" label="借阅日期" width="110">
          <template #default="{ row }">
            {{ formatDate(row.borrow_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="应还日期" width="110">
          <template #default="{ row }">
            <span :class="{ 'overdue-date': isOverdue(row.due_date) && row.status === 'borrowed' }">
              {{ formatDate(row.due_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'borrowed' ? 'warning' : 'success'" effect="dark">
              {{ row.status === 'borrowed' ? '借阅中' : '已归还' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!myBorrows.length" description="暂无借阅记录" :image-size="80" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { statisticsApi, borrowApi } from '../api'
import { Reading, CircleCheck, User, Warning, TrendCharts, Grid, Tickets } from '@element-plus/icons-vue'

const userStore = useUserStore()

const loading = ref(false)
const stats = ref({
  totalBooks: 0,
  availableBooks: 0,
  totalUsers: 0,
  activeBorrows: 0,
  overdueBorrows: 0
})
const popularBooks = ref([])
const categoryStats = ref([])
const overdueList = ref([])
const myBorrows = ref([])

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const isOverdue = (dueDate) => {
  return new Date(dueDate) < new Date()
}

const getOverdueDays = (dueDate) => {
  const diff = new Date() - new Date(dueDate)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const getPercentage = (count) => {
  const max = Math.max(...categoryStats.value.map(c => c.book_count), 1)
  return Math.round((count / max) * 100)
}

const fetchData = async () => {
  loading.value = true
  try {
    if (userStore.isAdmin) {
      const [overview, popular, categories, overdue] = await Promise.all([
        statisticsApi.getOverview(),
        statisticsApi.getPopularBooks(5),
        statisticsApi.getCategoryStats(),
        statisticsApi.getOverdueList()
      ])
      stats.value = overview
      popularBooks.value = popular
      categoryStats.value = categories.filter(c => c.book_count > 0)
      overdueList.value = overdue
    } else {
      const res = await borrowApi.getList({ pageSize: 5 })
      myBorrows.value = res.data
    }
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 14px;
  color: #64748b;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(17, 24, 39, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

.content-row {
  margin-bottom: 24px;
}

.content-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.card-title .el-icon {
  color: #3b82f6;
}

.overdue-tag {
  font-size: 12px;
}

.data-table {
  --el-table-border-color: rgba(148, 163, 184, 0.1);
}

.book-title-cell {
  font-weight: 500;
  color: #f1f5f9;
}

.count-tag {
  font-weight: 600;
}

.category-stats {
  max-height: 280px;
  overflow-y: auto;
}

.category-item {
  margin-bottom: 16px;
}

.category-item:last-child {
  margin-bottom: 0;
}

.category-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-name {
  font-size: 14px;
  color: #f1f5f9;
}

.category-count {
  font-size: 12px;
  color: #94a3b8;
}

.category-progress {
  --el-progress-default-color: rgba(59, 130, 246, 0.3);
}

:deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
}

.overdue-date {
  color: #ef4444;
  font-weight: 500;
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 22px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
  }
  
  .stat-value {
    font-size: 24px;
  }
}
</style>

<template>
  <div class="users-page">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            用户管理
          </span>
        </div>
      </template>

      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item>
            <el-input 
              v-model="searchForm.keyword" 
              placeholder="搜索用户名/姓名/邮箱" 
              clearable
              :prefix-icon="Search"
              class="search-input"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.role" placeholder="全部角色" clearable class="search-select">
              <el-option label="管理员" value="admin" />
              <el-option label="普通用户" value="user" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="users" stripe v-loading="loading" class="users-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="username" label="用户名" width="120">
          <template #default="{ row }">
            <span class="user-name">{{ row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" effect="dark">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="110" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              @click="changeRole(row)"
              :disabled="row.id === userStore.user?.id"
            >
              {{ row.role === 'admin' ? '设为用户' : '设为管理员' }}
            </el-button>
            <el-button 
              type="danger" 
              link 
              @click="deleteUser(row)"
              :disabled="row.id === userStore.user?.id"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchUsers"
          @current-change="fetchUsers"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { userApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Search } from '@element-plus/icons-vue'

const userStore = useUserStore()

const loading = ref(false)
const users = ref([])

const searchForm = reactive({
  keyword: '',
  role: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await userApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    users.value = res.data
    pagination.total = res.pagination.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.role = ''
  handleSearch()
}

const changeRole = (user) => {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  const actionText = newRole === 'admin' ? '设为管理员' : '设为普通用户'
  
  ElMessageBox.confirm(`确定要将"${user.name}"${actionText}吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await userApi.updateRole(user.id, newRole)
      ElMessage.success('角色更新成功')
      fetchUsers()
    } catch (error) {
      ElMessage.error(error.error || '更新失败')
    }
  })
}

const deleteUser = (user) => {
  ElMessageBox.confirm(`确定要删除用户"${user.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await userApi.delete(user.id)
      ElMessage.success('删除成功')
      fetchUsers()
    } catch (error) {
      ElMessage.error(error.error || '删除失败')
    }
  })
}

onMounted(fetchUsers)
</script>

<style scoped>
.users-page {
  padding: 0;
}

.main-card {
  min-height: calc(100vh - 160px);
}

.card-header {
  display: flex;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
}

.card-title .el-icon {
  color: #3b82f6;
}

.search-section {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-input {
  width: 220px;
}

.search-select {
  width: 140px;
}

.users-table {
  --el-table-border-color: rgba(148, 163, 184, 0.1);
}

.user-name {
  font-weight: 500;
  color: #f1f5f9;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .search-input,
  .search-select {
    width: 100%;
  }
  
  .search-form .el-form-item {
    width: 100%;
  }
}
</style>

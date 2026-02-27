<template>
  <div class="borrow-records">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Tickets /></el-icon>
            借阅记录
          </span>
        </div>
      </template>

      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item>
            <el-select v-model="searchForm.status" placeholder="全部状态" clearable class="search-select">
              <el-option label="借阅中" value="borrowed" />
              <el-option label="已归还" value="returned" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="userStore.isAdmin">
            <el-input v-model="searchForm.userId" placeholder="用户ID" clearable class="search-input" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="records" stripe v-loading="loading" class="records-table">
        <el-table-column prop="title" label="书名" min-width="180">
          <template #default="{ row }">
            <span class="book-title">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="100" />
        <el-table-column v-if="userStore.isAdmin" prop="user_name" label="借阅人" width="100" />
        <el-table-column prop="borrow_date" label="借阅日期" width="110" align="center">
          <template #default="{ row }">
            {{ formatDate(row.borrow_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="应还日期" width="110" align="center">
          <template #default="{ row }">
            <span :class="{ 'overdue-date': isOverdue(row.due_date) && row.status === 'borrowed' }">
              {{ formatDate(row.due_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="return_date" label="归还日期" width="110" align="center">
          <template #default="{ row }">
            <span v-if="row.return_date">{{ formatDate(row.return_date) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)" effect="dark">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fine_amount" label="罚款" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.fine_amount > 0" class="fine-amount">¥{{ row.fine_amount.toFixed(2) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 'borrowed'">
              <el-button type="primary" link @click="handleReturn(row)">
                <el-icon><CircleCheck /></el-icon>
                归还
              </el-button>
              <el-button type="warning" link @click="handleRenew(row)">
                <el-icon><RefreshRight /></el-icon>
                续借
              </el-button>
            </template>
            <span v-else class="text-muted">已完成</span>
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
          @size-change="fetchRecords"
          @current-change="fetchRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { borrowApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Tickets, CircleCheck, RefreshRight } from '@element-plus/icons-vue'

const userStore = useUserStore()

const loading = ref(false)
const records = ref([])

const searchForm = reactive({
  status: '',
  userId: ''
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

const isOverdue = (dueDate) => {
  return new Date(dueDate) < new Date()
}

const getStatusType = (row) => {
  if (row.status === 'returned') return 'success'
  if (isOverdue(row.due_date)) return 'danger'
  return 'warning'
}

const getStatusText = (row) => {
  if (row.status === 'returned') return '已归还'
  if (isOverdue(row.due_date)) return '已逾期'
  return '借阅中'
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const res = await borrowApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    records.value = res.data
    pagination.total = res.pagination.total
  } catch (error) {
    ElMessage.error('获取借阅记录失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchRecords()
}

const resetSearch = () => {
  searchForm.status = ''
  searchForm.userId = ''
  handleSearch()
}

const handleReturn = (row) => {
  ElMessageBox.confirm(`确定要归还《${row.title}》吗？`, '归还确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      const res = await borrowApi.return(row.id)
      if (res.overdue) {
        ElMessage.warning(`归还成功，逾期罚款：¥${res.fineAmount.toFixed(2)}`)
      } else {
        ElMessage.success('归还成功')
      }
      fetchRecords()
    } catch (error) {
      ElMessage.error(error.error || '归还失败')
    }
  })
}

const handleRenew = (row) => {
  ElMessageBox.confirm(`确定要续借《${row.title}》吗？续借期为30天。`, '续借确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      const res = await borrowApi.renew(row.id)
      ElMessage.success(`续借成功，新到期日：${formatDate(res.newDueDate)}`)
      fetchRecords()
    } catch (error) {
      ElMessage.error(error.error || '续借失败')
    }
  })
}

onMounted(fetchRecords)
</script>

<style scoped>
.borrow-records {
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

.search-select {
  width: 140px;
}

.search-input {
  width: 120px;
}

.records-table {
  --el-table-border-color: rgba(148, 163, 184, 0.1);
}

.book-title {
  font-weight: 500;
  color: #f1f5f9;
}

.overdue-date {
  color: #ef4444;
  font-weight: 500;
}

.fine-amount {
  color: #ef4444;
  font-weight: 600;
}

.text-muted {
  color: #64748b;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .search-select,
  .search-input {
    width: 100%;
  }
  
  .search-form .el-form-item {
    width: 100%;
  }
}
</style>

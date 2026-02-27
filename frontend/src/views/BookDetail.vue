<template>
  <div class="book-detail">
    <el-card shadow="hover" v-loading="loading" class="detail-card">
      <template #header>
        <div class="card-header">
          <el-button link @click="$router.back()" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
        </div>
      </template>

      <div class="book-content" v-if="book">
        <div class="book-cover-section">
          <div class="cover-wrapper">
            <el-image 
              :src="book.cover_image ? 'http://localhost:3000' + book.cover_image : defaultCover"
              fit="contain"
              class="book-cover"
            >
              <template #error>
                <div class="cover-error">
                  <el-icon size="60"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
        </div>
        
        <div class="book-info-section">
          <h1 class="book-title">{{ book.title }}</h1>
          
          <div class="book-meta">
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>{{ book.author || '未知作者' }}</span>
            </div>
            <div class="meta-item">
              <el-icon><CollectionTag /></el-icon>
              <span>{{ book.category_name || '未分类' }}</span>
            </div>
          </div>
          
          <el-descriptions :column="2" border class="book-descriptions">
            <el-descriptions-item label="ISBN">{{ book.isbn || '无' }}</el-descriptions-item>
            <el-descriptions-item label="出版社">{{ book.publisher || '未知' }}</el-descriptions-item>
            <el-descriptions-item label="出版日期">{{ book.publish_date || '未知' }}</el-descriptions-item>
            <el-descriptions-item label="存放位置">{{ book.location || '未知' }}</el-descriptions-item>
            <el-descriptions-item label="库存状态" :span="2">
              <div class="stock-info">
                <el-tag :type="book.available_copies > 0 ? 'success' : 'danger'" effect="dark" size="large">
                  {{ book.available_copies > 0 ? '可借阅' : '已借完' }}
                </el-tag>
                <span class="stock-count">
                  可借: <strong>{{ book.available_copies }}</strong> / 总数: <strong>{{ book.total_copies }}</strong>
                </span>
              </div>
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="book-description">
            <h3>内容简介</h3>
            <p>{{ book.description || '暂无简介' }}</p>
          </div>

          <div class="action-section">
            <el-button 
              type="primary" 
              size="large"
              :disabled="book.available_copies <= 0"
              @click="handleBorrow"
              class="borrow-btn"
            >
              <el-icon><Reading /></el-icon>
              {{ book.available_copies > 0 ? '立即借阅' : '暂无库存' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { bookApi, borrowApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Picture, Reading, User, CollectionTag } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const book = ref(null)
const defaultCover = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgZmlsbD0iIzFlMjkzYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NDc0OGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77kuaU8L3RleHQ+PC9zdmc+'

const fetchBook = async () => {
  loading.value = true
  try {
    book.value = await bookApi.getDetail(route.params.id)
  } catch (error) {
    ElMessage.error('获取图书详情失败')
    router.push('/books')
  } finally {
    loading.value = false
  }
}

const handleBorrow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  ElMessageBox.confirm(`确定要借阅《${book.value.title}》吗？`, '借阅确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      const res = await borrowApi.borrow(book.value.id)
      ElMessage.success(res.message)
      fetchBook()
    } catch (error) {
      ElMessage.error(error.error || '借阅失败')
    }
  })
}

onMounted(fetchBook)
</script>

<style scoped>
.book-detail {
  padding: 0;
}

.detail-card {
  min-height: calc(100vh - 160px);
}

.card-header {
  display: flex;
  align-items: center;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #94a3b8;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #3b82f6;
}

.book-content {
  display: flex;
  gap: 40px;
  padding: 20px 0;
}

.book-cover-section {
  flex-shrink: 0;
}

.cover-wrapper {
  width: 280px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-cover {
  width: 240px;
  height: 320px;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.cover-error {
  width: 240px;
  height: 320px;
  background: rgba(30, 41, 59, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  border-radius: 8px;
}

.book-info-section {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 16px;
  line-height: 1.3;
}

.book-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 14px;
}

.meta-item .el-icon {
  color: #3b82f6;
}

.book-descriptions {
  margin-bottom: 24px;
}

.stock-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stock-count {
  color: #94a3b8;
  font-size: 14px;
}

.stock-count strong {
  color: #f1f5f9;
  font-weight: 600;
}

.book-description {
  padding: 20px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  margin-bottom: 24px;
}

.book-description h3 {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.book-description p {
  color: #94a3b8;
  line-height: 1.8;
  font-size: 14px;
}

.action-section {
  padding-top: 8px;
}

.borrow-btn {
  min-width: 160px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
}

@media (max-width: 900px) {
  .book-content {
    flex-direction: column;
    align-items: center;
  }
  
  .book-cover-section {
    margin-bottom: 24px;
  }
  
  .book-info-section {
    width: 100%;
  }
  
  .book-title {
    font-size: 24px;
    text-align: center;
  }
  
  .book-meta {
    justify-content: center;
  }
  
  .action-section {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .cover-wrapper {
    width: 220px;
    padding: 16px;
  }
  
  .book-cover {
    width: 188px;
    height: 260px;
  }
}
</style>

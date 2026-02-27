<template>
  <div class="books-page">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Reading /></el-icon>
            图书列表
          </span>
          <el-button v-if="userStore.isAdmin" type="primary" @click="showAddDialog" class="add-btn">
            <el-icon><Plus /></el-icon>
            添加图书
          </el-button>
        </div>
      </template>

      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item>
            <el-input 
              v-model="searchForm.keyword" 
              placeholder="搜索书名/作者/ISBN" 
              clearable
              :prefix-icon="Search"
              class="search-input"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.category" placeholder="全部分类" clearable class="search-select">
              <el-option 
                v-for="cat in categories" 
                :key="cat.id" 
                :label="cat.name" 
                :value="cat.id" 
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.status" placeholder="全部状态" clearable class="search-select">
              <el-option label="可借" value="available" />
              <el-option label="已借完" value="unavailable" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="books" stripe v-loading="loading" class="books-table">
        <el-table-column prop="cover_image" label="封面" width="80" align="center">
          <template #default="{ row }">
            <div class="book-cover-wrapper">
              <el-image 
                :src="row.cover_image ? 'http://localhost:3000' + row.cover_image : defaultCover"
                fit="cover"
                class="book-cover"
              >
                <template #error>
                  <div class="cover-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="书名" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="viewBook(row.id)" class="book-title-link">
              {{ row.title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="isbn" label="ISBN" width="130" />
        <el-table-column prop="category_name" label="分类" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.category_name" size="small">{{ row.category_name }}</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="available_copies" label="库存" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.available_copies > 0 ? 'success' : 'danger'" effect="dark">
              {{ row.available_copies }} / {{ row.total_copies }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" width="100" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewBook(row.id)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button 
              v-if="userStore.isAdmin" 
              type="primary" 
              link 
              @click="editBook(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              v-if="userStore.isAdmin" 
              type="danger" 
              link 
              @click="deleteBook(row)"
            >
              <el-icon><Delete /></el-icon>
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
          @size-change="fetchBooks"
          @current-change="fetchBooks"
        />
      </div>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑图书' : '添加图书'" 
      width="650px"
      destroy-on-close
      class="book-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="book-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="ISBN" prop="isbn">
              <el-input v-model="form.isbn" placeholder="ISBN编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="书名" prop="title">
              <el-input v-model="form.title" placeholder="图书名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="作者" prop="author">
              <el-input v-model="form.author" placeholder="作者姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出版社" prop="publisher">
              <el-input v-model="form.publisher" placeholder="出版社名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出版日期" prop="publish_date">
              <el-date-picker 
                v-model="form.publish_date" 
                type="date" 
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category_id">
              <el-select v-model="form.category_id" placeholder="选择分类" style="width: 100%">
                <el-option 
                  v-for="cat in categories" 
                  :key="cat.id" 
                  :label="cat.name" 
                  :value="cat.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总数量" prop="total_copies">
              <el-input-number v-model="form.total_copies" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置" prop="location">
              <el-input v-model="form.location" placeholder="如: A区3排" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="封面图片">
          <el-upload
            class="cover-uploader"
            :show-file-list="false"
            :before-upload="beforeCoverUpload"
            accept="image/*"
          >
            <el-image 
              v-if="coverPreview" 
              :src="coverPreview" 
              fit="cover"
              class="cover-preview"
            />
            <div v-else class="cover-upload-placeholder">
              <el-icon size="28"><Plus /></el-icon>
              <span>上传封面</span>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入图书简介"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { bookApi, categoryApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture, Search, View, Edit, Delete, Reading } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const books = ref([])
const categories = ref([])
const defaultCover = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvuS5pTwvdGV4dD48L3N2Zz4='

const searchForm = reactive({
  keyword: '',
  category: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formRef = ref(null)
const form = reactive({
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  publish_date: '',
  category_id: '',
  total_copies: 1,
  location: '',
  description: ''
})

const coverFile = ref(null)
const coverPreview = ref('')

const rules = {
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }]
}

const fetchBooks = async () => {
  loading.value = true
  try {
    const res = await bookApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    books.value = res.data
    pagination.total = res.pagination.total
  } catch (error) {
    ElMessage.error('获取图书列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    categories.value = await categoryApi.getList()
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchBooks()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  searchForm.status = ''
  handleSearch()
}

const viewBook = (id) => {
  router.push(`/books/${id}`)
}

const showAddDialog = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publish_date: '',
    category_id: '',
    total_copies: 1,
    location: '',
    description: ''
  })
  coverFile.value = null
  coverPreview.value = ''
  dialogVisible.value = true
}

const editBook = (book) => {
  isEdit.value = true
  editId.value = book.id
  Object.assign(form, {
    isbn: book.isbn || '',
    title: book.title,
    author: book.author || '',
    publisher: book.publisher || '',
    publish_date: book.publish_date || '',
    category_id: book.category_id || '',
    total_copies: book.total_copies,
    location: book.location || '',
    description: book.description || ''
  })
  coverFile.value = null
  coverPreview.value = book.cover_image ? 'http://localhost:3000' + book.cover_image : ''
  dialogVisible.value = true
}

const deleteBook = (book) => {
  ElMessageBox.confirm(`确定要删除《${book.title}》吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await bookApi.delete(book.id)
      ElMessage.success('删除成功')
      fetchBooks()
    } catch (error) {
      ElMessage.error(error.error || '删除失败')
    }
  })
}

const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB')
    return false
  }

  coverFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    coverPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
  return false
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = { ...form }
    if (coverFile.value) {
      data.cover = coverFile.value
    }

    if (isEdit.value) {
      await bookApi.update(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await bookApi.create(data)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchBooks()
  } catch (error) {
    ElMessage.error(error.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchBooks()
  fetchCategories()
})
</script>

<style scoped>
.books-page {
  padding: 0;
}

.main-card {
  min-height: calc(100vh - 160px);
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
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
}

.card-title .el-icon {
  color: #3b82f6;
}

.add-btn {
  font-weight: 500;
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

.books-table {
  --el-table-border-color: rgba(148, 163, 184, 0.1);
}

.book-cover-wrapper {
  width: 50px;
  height: 70px;
  border-radius: 6px;
  overflow: hidden;
}

.book-cover {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 50px;
  height: 70px;
  background: rgba(30, 41, 59, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.book-title-link {
  font-weight: 500;
  font-size: 14px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.book-form {
  padding: 10px 20px;
}

.cover-uploader {
  width: 120px;
  height: 160px;
  border: 2px dashed rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.cover-uploader:hover {
  border-color: #3b82f6;
}

.cover-preview {
  width: 100%;
  height: 100%;
}

.cover-upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #64748b;
}

.cover-upload-placeholder span {
  font-size: 12px;
}

@media (max-width: 768px) {
  .search-input {
    width: 100%;
  }
  
  .search-select {
    width: 100%;
  }
  
  .search-form .el-form-item {
    width: 100%;
  }
}
</style>

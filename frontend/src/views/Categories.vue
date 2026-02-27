<template>
  <div class="categories-page">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Grid /></el-icon>
            分类管理
          </span>
          <el-button type="primary" @click="showAddDialog" class="add-btn">
            <el-icon><Plus /></el-icon>
            添加分类
          </el-button>
        </div>
      </template>

      <el-table :data="categories" stripe v-loading="loading" class="categories-table">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="分类名称" min-width="180">
          <template #default="{ row }">
            <span class="category-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span class="category-desc">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="book_count" label="图书数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary" effect="dark">{{ row.book_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="editCategory(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" link @click="deleteCategory(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑分类' : '添加分类'" 
      width="450px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" class="category-form">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入分类描述（选填）" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { categoryApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Grid, Plus, Edit, Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const categories = ref([])

const formRef = ref(null)
const form = reactive({
  name: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const fetchCategories = async () => {
  loading.value = true
  try {
    categories.value = await categoryApi.getList()
  } catch (error) {
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  editId.value = null
  form.name = ''
  form.description = ''
  dialogVisible.value = true
}

const editCategory = (category) => {
  isEdit.value = true
  editId.value = category.id
  form.name = category.name
  form.description = category.description || ''
  dialogVisible.value = true
}

const deleteCategory = (category) => {
  ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await categoryApi.delete(category.id)
      ElMessage.success('删除成功')
      fetchCategories()
    } catch (error) {
      ElMessage.error(error.error || '删除失败')
    }
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await categoryApi.update(editId.value, form)
      ElMessage.success('更新成功')
    } else {
      await categoryApi.create(form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchCategories()
  } catch (error) {
    ElMessage.error(error.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(fetchCategories)
</script>

<style scoped>
.categories-page {
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

.categories-table {
  --el-table-border-color: rgba(148, 163, 184, 0.1);
}

.category-name {
  font-weight: 500;
  color: #f1f5f9;
}

.category-desc {
  color: #94a3b8;
}

.category-form {
  padding: 10px 20px;
}
</style>

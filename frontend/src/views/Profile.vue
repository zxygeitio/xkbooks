<template>
  <div class="profile-page">
    <el-row :gutter="24">
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="profile-card">
          <div class="user-profile">
            <el-avatar :size="80" class="user-avatar">
              {{ userStore.user?.name?.charAt(0) }}
            </el-avatar>
            <h3 class="user-name">{{ userStore.user?.name }}</h3>
            <el-tag :type="userStore.isAdmin ? 'danger' : 'info'" effect="dark" class="role-tag">
              {{ userStore.isAdmin ? '管理员' : '普通用户' }}
            </el-tag>
            <p class="username">@{{ userStore.user?.username }}</p>
            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-value">{{ userBorrows }}</span>
                <span class="stat-label">借阅记录</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ activeBorrows }}</span>
                <span class="stat-label">在借图书</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="16">
        <el-card shadow="hover" class="info-card">
          <el-tabs v-model="activeTab" class="profile-tabs">
            <el-tab-pane label="基本信息" name="info">
              <el-form 
                ref="infoFormRef" 
                :model="infoForm" 
                :rules="infoRules" 
                label-width="80px"
                class="info-form"
              >
                <el-form-item label="用户名">
                  <el-input :value="userStore.user?.username" disabled />
                </el-form-item>
                <el-form-item label="姓名" prop="name">
                  <el-input v-model="infoForm.name" placeholder="请输入姓名" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="infoForm.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="infoForm.phone" placeholder="请输入手机号" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="infoLoading" @click="updateInfo">
                    保存修改
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="password">
              <el-form 
                ref="pwdFormRef" 
                :model="pwdForm" 
                :rules="pwdRules" 
                label-width="100px"
                class="pwd-form"
              >
                <el-form-item label="当前密码" prop="oldPassword">
                  <el-input 
                    v-model="pwdForm.oldPassword" 
                    type="password" 
                    placeholder="请输入当前密码"
                    show-password 
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input 
                    v-model="pwdForm.newPassword" 
                    type="password" 
                    placeholder="请输入新密码（至少6位）"
                    show-password 
                  />
                </el-form-item>
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input 
                    v-model="pwdForm.confirmPassword" 
                    type="password" 
                    placeholder="请再次输入新密码"
                    show-password 
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="pwdLoading" @click="changePassword">
                    修改密码
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { borrowApi } from '../api'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const activeTab = ref('info')
const infoLoading = ref(false)
const pwdLoading = ref(false)
const userBorrows = ref(0)
const activeBorrows = ref(0)

const infoFormRef = ref(null)
const pwdFormRef = ref(null)

const infoForm = reactive({
  name: '',
  email: '',
  phone: ''
})

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const infoRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }]
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const initForm = () => {
  const user = userStore.user
  if (user) {
    infoForm.name = user.name || ''
    infoForm.email = user.email || ''
    infoForm.phone = user.phone || ''
  }
}

const fetchBorrowStats = async () => {
  try {
    const res = await borrowApi.getList({ pageSize: 1000 })
    userBorrows.value = res.pagination.total
    activeBorrows.value = res.data.filter(r => r.status === 'borrowed').length
  } catch (error) {
    console.error('获取借阅统计失败:', error)
  }
}

const updateInfo = async () => {
  const valid = await infoFormRef.value.validate().catch(() => false)
  if (!valid) return

  infoLoading.value = true
  try {
    await userStore.updateProfile(infoForm)
    ElMessage.success('信息更新成功')
  } catch (error) {
    ElMessage.error(error.error || '更新失败')
  } finally {
    infoLoading.value = false
  }
}

const changePassword = async () => {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  pwdLoading.value = true
  try {
    await userStore.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    ElMessage.success('密码修改成功')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch (error) {
    ElMessage.error(error.error || '修改失败')
  } finally {
    pwdLoading.value = false
  }
}

onMounted(() => {
  initForm()
  fetchBorrowStats()
})
</script>

<style scoped>
.profile-page {
  padding: 0;
}

.profile-card {
  margin-bottom: 24px;
}

.user-profile {
  text-align: center;
  padding: 20px 0;
}

.user-avatar {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.role-tag {
  margin-bottom: 12px;
}

.username {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 20px;
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.info-card {
  min-height: 400px;
}

.profile-tabs {
  --el-tabs-header-height: 48px;
}

.info-form,
.pwd-form {
  max-width: 400px;
  margin-top: 20px;
  padding: 0 10px;
}

@media (max-width: 768px) {
  .user-stats {
    gap: 24px;
  }
  
  .info-form,
  .pwd-form {
    max-width: 100%;
  }
}
</style>

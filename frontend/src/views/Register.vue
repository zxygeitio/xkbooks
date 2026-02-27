<template>
  <div class="register-container">
    <StarrySky />
    <div class="register-content">
      <div class="register-box">
        <div class="register-header">
          <div class="logo-wrapper">
            <el-icon class="logo-icon"><Reading /></el-icon>
          </div>
          <h1 class="title">加入星空图书馆</h1>
          <p class="subtitle">开启你的阅读之旅</p>
        </div>
        
        <el-form ref="formRef" :model="form" :rules="rules" class="register-form">
          <el-form-item prop="username">
            <el-input 
              v-model="form.username" 
              placeholder="用户名（3-20个字符）" 
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input 
              v-model="form.password" 
              type="password" 
              placeholder="密码（至少6位）" 
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input 
              v-model="form.confirmPassword" 
              type="password" 
              placeholder="确认密码" 
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item prop="name">
            <el-input 
              v-model="form.name" 
              placeholder="您的姓名" 
              size="large"
              :prefix-icon="UserFilled"
            />
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item prop="email">
                <el-input 
                  v-model="form.email" 
                  placeholder="邮箱（选填）" 
                  size="large"
                  :prefix-icon="Message"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="phone">
                <el-input 
                  v-model="form.phone" 
                  placeholder="手机号（选填）" 
                  size="large"
                  :prefix-icon="Phone"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              :loading="loading" 
              class="register-btn"
              @click="handleRegister"
            >
              <span v-if="!loading">立即注册</span>
              <span v-else>注册中...</span>
            </el-button>
          </el-form-item>
          <div class="register-footer">
            <span class="text-secondary">已有账号？</span>
            <router-link to="/login" class="link">立即登录</router-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { Reading, User, Lock, UserFilled, Message, Phone } from '@element-plus/icons-vue'
import StarrySky from '../components/StarrySky.vue'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  email: '',
  phone: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
}

const handleRegister = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.register({
      username: form.username,
      password: form.password,
      name: form.name,
      email: form.email,
      phone: form.phone
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error.error || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 50%, #0d1220 100%);
  padding: 40px 0;
}

.register-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  width: 100%;
}

.register-box {
  width: 100%;
  max-width: 480px;
  padding: 40px;
  background: rgba(17, 24, 39, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-wrapper {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.logo-icon {
  font-size: 36px;
  color: #fff;
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  letter-spacing: 1px;
}

.register-form {
  margin-top: 24px;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 2px;
  margin-top: 8px;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

.link {
  color: #3b82f6;
  margin-left: 8px;
  transition: color 0.2s;
}

.link:hover {
  color: #60a5fa;
}

@media (max-width: 520px) {
  .register-box {
    padding: 32px 24px;
    margin: 0 16px;
  }
  
  .title {
    font-size: 22px;
  }
  
  .logo-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 16px;
  }
  
  .logo-icon {
    font-size: 30px;
  }
  
  .el-row {
    flex-direction: column;
  }
  
  .el-col {
    max-width: 100%;
    flex: 0 0 100%;
  }
}
</style>

<template>
  <div class="login-container">
    <StarrySky />
    <div class="login-content">
      <div class="login-box">
        <div class="login-header">
          <div class="logo-wrapper">
            <el-icon class="logo-icon"><Reading /></el-icon>
          </div>
          <h1 class="title">星空图书馆</h1>
          <p class="subtitle">探索知识的浩瀚宇宙</p>
        </div>
        
        <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
          <el-form-item prop="username">
            <el-input 
              v-model="form.username" 
              placeholder="请输入用户名" 
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input 
              v-model="form.password" 
              type="password" 
              placeholder="请输入密码" 
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              :loading="loading" 
              class="login-btn"
              @click="handleLogin"
            >
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
          <div class="login-footer">
            <span class="text-secondary">还没有账号？</span>
            <router-link to="/register" class="link">立即注册</router-link>
          </div>
        </el-form>
        
        <div class="demo-account">
          <el-divider>
            <span class="divider-text">演示账号</span>
          </el-divider>
          <div class="demo-info">
            <span class="text-muted">管理员:</span>
            <span class="text-accent">admin / admin123</span>
          </div>
        </div>
      </div>
      
      <div class="decoration-text">
        <p>每一本书都是一颗星</p>
        <p>照亮你前行的路</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { Reading, User, Lock } from '@element-plus/icons-vue'
import StarrySky from '../components/StarrySky.vue'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error.error || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 50%, #0d1220 100%);
}

.login-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 420px;
  min-width: 320px;
  padding: 40px;
  background: rgba(17, 24, 39, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
}

.login-header {
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
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  letter-spacing: 1px;
}

.login-form {
  margin-top: 24px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.login-form :deep(.el-input) {
  width: 100%;
}

.login-form :deep(.el-input__wrapper) {
  width: 100%;
  box-sizing: border-box;
}

.login-form :deep(.el-input__inner) {
  width: 100%;
}

.login-form :deep(.el-input__suffix) {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.login-form :deep(.el-input__suffix-inner) {
  display: flex;
  align-items: center;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 2px;
}

.login-footer {
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

.demo-account {
  margin-top: 24px;
}

.divider-text {
  font-size: 12px;
  color: #64748b;
  padding: 0 12px;
}

.demo-info {
  text-align: center;
  font-size: 13px;
}

.demo-info .text-muted {
  margin-right: 8px;
}

.decoration-text {
  margin-top: 40px;
  text-align: center;
}

.decoration-text p {
  font-size: 14px;
  color: #64748b;
  letter-spacing: 3px;
  margin: 8px 0;
  opacity: 0.8;
}

@media (max-width: 480px) {
  .login-box {
    padding: 32px 24px;
    margin: 0 16px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .logo-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 16px;
  }
  
  .logo-icon {
    font-size: 30px;
  }
}
</style>

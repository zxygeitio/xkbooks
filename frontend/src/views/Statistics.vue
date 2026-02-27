<template>
  <div class="statistics-page">
    <div class="page-header">
      <h1 class="page-title">统计分析</h1>
      <p class="page-subtitle">数据概览与趋势分析</p>
    </div>

    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">
              <el-icon><Grid /></el-icon>
              分类分布
            </span>
          </template>
          <div class="chart-container" ref="categoryChartRef"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">
              <el-icon><DataAnalysis /></el-icon>
              库存状态
            </span>
          </template>
          <div class="chart-container" ref="stockChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">
              <el-icon><TrendCharts /></el-icon>
              借阅趋势（近30天）
            </span>
          </template>
          <div class="chart-container large" ref="trendChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">
              <el-icon><Reading /></el-icon>
              热门图书TOP10
            </span>
          </template>
          <el-table :data="popularBooks" stripe max-height="350" class="rank-table">
            <el-table-column type="index" label="排名" width="60" align="center">
              <template #default="{ $index }">
                <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="书名" min-width="150" />
            <el-table-column prop="author" label="作者" width="100" />
            <el-table-column prop="borrow_count" label="借阅次数" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="primary" effect="dark">{{ row.borrow_count }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">
              <el-icon><User /></el-icon>
              活跃用户TOP10
            </span>
          </template>
          <el-table :data="activeUsers" stripe max-height="350" class="rank-table">
            <el-table-column type="index" label="排名" width="60" align="center">
              <template #default="{ $index }">
                <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="username" label="用户名" min-width="120" />
            <el-table-column prop="borrow_count" label="借阅次数" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="success" effect="dark">{{ row.borrow_count }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { statisticsApi } from '../api'
import * as echarts from 'echarts'
import { Grid, DataAnalysis, TrendCharts, Reading, User } from '@element-plus/icons-vue'

const categoryChartRef = ref(null)
const stockChartRef = ref(null)
const trendChartRef = ref(null)

let categoryChart = null
let stockChart = null
let trendChart = null

const popularBooks = ref([])
const activeUsers = ref([])

const chartColors = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  border: 'rgba(148, 163, 184, 0.15)'
}

const initCharts = () => {
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value)
  }
  if (stockChartRef.value) {
    stockChart = echarts.init(stockChartRef.value)
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
}

const fetchCategoryStats = async () => {
  try {
    const data = await statisticsApi.getCategoryStats()
    
    const chartData = data.filter(item => item.book_count > 0).map(item => ({
      name: item.category,
      value: item.book_count
    }))

    categoryChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}本 ({d}%)',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: chartColors.border,
        textStyle: { color: chartColors.text }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: chartColors.textMuted }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#0a0f1a',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            color: chartColors.text
          }
        },
        labelLine: { show: false },
        data: chartData
      }],
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']
    })

    const total = data.reduce((sum, item) => sum + (item.total_copies || 0), 0)
    const available = data.reduce((sum, item) => sum + (item.available_copies || 0), 0)
    const borrowed = total - available

    stockChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}本 ({d}%)',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: chartColors.border,
        textStyle: { color: chartColors.text }
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: { color: chartColors.textMuted }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#0a0f1a',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}',
          color: chartColors.text
        },
        data: [
          { value: available, name: '可借', itemStyle: { color: chartColors.success } },
          { value: borrowed, name: '已借出', itemStyle: { color: chartColors.warning } }
        ]
      }]
    })
  } catch (error) {
    console.error('获取分类统计失败:', error)
  }
}

const fetchTrend = async () => {
  try {
    const data = await statisticsApi.getBorrowTrend(30)
    
    const dates = data.map(item => item.date)
    const counts = data.map(item => item.count)

    trendChart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderColor: chartColors.border,
        textStyle: { color: chartColors.text }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: chartColors.border } },
        axisLabel: { 
          color: chartColors.textMuted,
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { lineStyle: { color: chartColors.border } },
        axisLabel: { color: chartColors.textMuted },
        splitLine: { lineStyle: { color: chartColors.border } }
      },
      series: [{
        data: counts,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ])
        },
        lineStyle: { color: chartColors.primary, width: 2 },
        itemStyle: { color: chartColors.primary }
      }]
    })
  } catch (error) {
    console.error('获取借阅趋势失败:', error)
  }
}

const fetchRankings = async () => {
  try {
    const [popular, active] = await Promise.all([
      statisticsApi.getPopularBooks(10),
      statisticsApi.getActiveUsers(10)
    ])
    popularBooks.value = popular
    activeUsers.value = active
  } catch (error) {
    console.error('获取排行榜失败:', error)
  }
}

const handleResize = () => {
  categoryChart?.resize()
  stockChart?.resize()
  trendChart?.resize()
}

onMounted(async () => {
  initCharts()
  await Promise.all([
    fetchCategoryStats(),
    fetchTrend(),
    fetchRankings()
  ])
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  categoryChart?.dispose()
  stockChart?.dispose()
  trendChart?.dispose()
})
</script>

<style scoped>
.statistics-page {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
}

.charts-row {
  margin-bottom: 24px;
}

.chart-card {
  height: 100%;
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

.chart-container {
  height: 300px;
}

.chart-container.large {
  height: 350px;
}

.rank-table {
  --el-table-border-color: rgba(148, 163, 184, 0.1);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #fff;
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  color: #fff;
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #fff;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 22px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .chart-container.large {
    height: 280px;
  }
}
</style>

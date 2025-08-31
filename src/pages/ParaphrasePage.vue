<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900 flex flex-col">
    <!-- 顶部导航栏 -->
    <header class="border-b border-gray-200 p-4 bg-white/90 backdrop-blur-sm shadow-light">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            @click="goBack"
            class="text-gray-500 hover:text-primary-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-xl font-bold text-gray-900 flex items-center">
              <Mic class="w-5 h-5 mr-2 text-primary-500" />
              复述训练
            </h1>
            <p class="text-gray-600 text-sm">{{ paragraph?.title }}</p>
          </div>
        </div>
        
        <!-- 历史记录按钮 -->
        <button
          @click="showHistory = !showHistory"
          class="px-3 py-1 text-sm bg-transparent border border-[#EAE2B7]/30 text-[#EAE2B7]/65 rounded-md hover:bg-[#EAE2B7]/5 transition-colors"
        >
          {{ showHistory ? '隐藏历史' : '查看历史' }}
        </button>
      </div>
    </header>

    <div class="flex-1 flex">
      <!-- 主内容区 -->
      <main class="flex-1 p-8">
        <div class="max-w-4xl mx-auto">
          <!-- 原文展示 -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">原文内容</h2>
            <div class="bg-white border border-gray-200 shadow-light rounded-lg p-6">
              <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {{ paragraph?.content }}
              </div>
            </div>
          </div>

          <!-- 录音区域 -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">语音复述</h2>
            <div class="bg-white border border-gray-200 shadow-light rounded-lg p-8 text-center">
              <!-- 录音状态显示 -->
              <div class="mb-6">
                <div 
                  :class="[
                    'w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center transition-all duration-300',
                    isRecording 
                      ? 'bg-red-100 border-2 border-red-500 animate-pulse' 
                      : 'bg-primary-50 border-2 border-primary-500 hover:bg-primary-100'
                  ]"
                >
                  <Mic :class="['w-8 h-8', isRecording ? 'text-red-500' : 'text-primary-500']" />
                </div>
                
                <div class="text-gray-700 mb-2">
                  {{ isRecording ? '正在录音...' : '点击开始录音' }}
                </div>
                
                <div v-if="recordingTime > 0" class="text-gray-600 text-sm">
                  录音时长: {{ formatTime(recordingTime) }}
                </div>
              </div>

              <!-- 录音控制按钮 -->
              <div class="flex items-center justify-center space-x-4">
                <button
                  v-if="!isRecording"
                  @click="startRecording"
                  :disabled="isProcessing"
                  class="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-medium"
                >
                  <Mic class="w-4 h-4" />
                  <span>开始录音</span>
                </button>
                
                <button
                  v-else
                  @click="stopRecording"
                  class="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors font-medium flex items-center space-x-2 shadow-medium"
                >
                  <Square class="w-4 h-4" />
                  <span>停止录音</span>
                </button>
                
                <button
                  v-if="audioBlob && !isRecording"
                  @click="playRecording"
                  :disabled="isPlaying"
                  class="px-4 py-3 bg-white border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50 shadow-light"
                >
                  <Play v-if="!isPlaying" class="w-4 h-4" />
                  <Pause v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 转录文本 -->
          <div v-if="transcribedText" class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">语音转录</h2>
            <div class="bg-white border border-gray-200 shadow-light rounded-lg p-6">
              <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {{ transcribedText }}
              </div>
            </div>
          </div>

          <!-- AI评估结果 -->
          <div v-if="evaluation" class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">AI评估报告</h2>
            <div class="bg-white border border-gray-200 shadow-light rounded-lg p-6">
              <!-- 综合评分 -->
              <div class="flex items-center justify-between mb-6">
                <div class="text-3xl font-bold text-primary-600">{{ evaluation.score }}分</div>
                <div class="text-right">
                  <div class="text-primary-600 font-bold text-lg" >{{ getScoreLevel(evaluation.score) }}</div>
                  <div class="flex items-center space-x-2 mt-2">
                    <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
                        :style="{ width: `${evaluation.score}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 各维度评分 -->
              <div v-if="evaluation.accuracy_score || evaluation.completeness_score || evaluation.clarity_score || evaluation.presentation_score" class="mb-6">
                <h3 class="text-gray-900 font-medium mb-3">各维度评分</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="bg-blue-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-blue-600">{{ evaluation.accuracy_score || 0 }}</div>
                    <div class="text-xs text-gray-600">信息准确性</div>
                  </div>
                  <div class="bg-green-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-green-600">{{ evaluation.completeness_score || 0 }}</div>
                    <div class="text-xs text-gray-600">完整性</div>
                  </div>
                  <div class="bg-purple-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-purple-600">{{ evaluation.clarity_score || 0 }}</div>
                    <div class="text-xs text-gray-600">表达清晰度</div>
                  </div>
                  <div class="bg-orange-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-orange-600">{{ evaluation.presentation_score || 0 }}</div>
                    <div class="text-xs text-gray-600">讲解技巧</div>
                  </div>
                </div>
              </div>

              <!-- 优点 -->
              <div v-if="evaluation.strengths && evaluation.strengths.length > 0" class="mb-4">
                <h3 class="text-success-600 font-medium mb-3 flex items-center">
                  <CheckCircle class="w-5 h-5 mr-2" />
                  优点亮点
                </h3>
                <div class="space-y-2">
                  <div 
                    v-for="(strength, index) in evaluation.strengths" 
                    :key="index" 
                    class="bg-success-50 border-l-4 border-success-500 rounded-r-lg p-3"
                  >
                    <div class="text-success-700 font-medium text-sm">{{ strength }}</div>
                  </div>
                </div>
              </div>

              <!-- 改进建议 -->
              <div v-if="evaluation.improvements && evaluation.improvements.length > 0" class="mb-4">
                <h3 class="text-warning-600 font-medium mb-3 flex items-center">
                  <AlertTriangle class="w-5 h-5 mr-2" />
                  改进建议
                </h3>
                <div class="space-y-3">
                  <div 
                    v-for="(item, index) in evaluation.improvements" 
                    :key="index" 
                    class="bg-warning-50 border-l-4 border-warning-500 rounded-r-lg p-3"
                  >
                    <div v-if="typeof item === 'object' && item.issue" class="text-warning-700 font-medium text-sm mb-1">{{ item.issue }}</div>
                    <div v-if="typeof item === 'object' && item.suggestion" class="text-gray-600 text-xs">{{ item.suggestion }}</div>
                    <div v-else-if="typeof item === 'string'" class="text-gray-600 text-sm">{{ item }}</div>
                  </div>
                </div>
              </div>

              <!-- 关键词汇建议 -->
              <div v-if="evaluation.key_terms && evaluation.key_terms.length > 0" class="mb-4">
                <h3 class="text-gray-900 font-medium mb-2 flex items-center">
                  <BookOpen class="w-4 h-4 mr-2" />
                  关键词汇建议
                </h3>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="term in evaluation.key_terms" 
                    :key="term" 
                    class="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-full border border-primary-200"
                  >{{ term }}</span>
                </div>
              </div>

              <!-- 讲解技巧建议 -->
              <div v-if="evaluation.presentation_tips && evaluation.presentation_tips.length > 0" class="mb-4">
                <h3 class="text-gray-900 font-medium mb-2 flex items-center">
                  <Mic class="w-4 h-4 mr-2" />
                  讲解技巧建议
                </h3>
                <div class="space-y-2">
                  <div 
                    v-for="(tip, index) in evaluation.presentation_tips" 
                    :key="index" 
                    class="text-gray-600 text-sm bg-gray-50 rounded-lg p-2"
                  >{{ tip }}</div>
                </div>
              </div>

              <!-- 总体反馈 -->
              <div class="border-t border-gray-200 pt-4">
                <h3 class="text-gray-900 font-medium mb-2">总体评价</h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  {{ evaluation.overall_feedback }}
                </p>
              </div>
            </div>
          </div>

          <!-- 语音识别状态 -->
          <div v-if="!isSpeechRecognitionSupported" class="mb-4">
            <div class="bg-error-50 border border-error-200 rounded-lg p-4">
              <div class="flex items-center">
                <AlertTriangle class="w-5 h-5 text-error-500 mr-2" />
                <div>
                  <h3 class="text-error-600 font-medium">语音识别不可用</h3>
                  <p class="text-error-600 text-sm">{{ recognitionStatus }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="recognitionStatus" class="mb-4">
            <div class="bg-success-50 border border-success-200 rounded-lg p-3">
              <div class="flex items-center">
                <CheckCircle class="w-4 h-4 text-success-500 mr-2" />
                <span class="text-success-600 text-sm">{{ recognitionStatus }}</span>
              </div>
            </div>
          </div>

          <!-- 处理状态 -->
          <div v-if="isProcessing" class="text-center py-8">
            <Loader2 class="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
            <div class="text-gray-600 mb-4">{{ processingStatus }}</div>
            
            <!-- AI思考过程显示 -->
            <div v-if="aiThinkingSteps.length > 0" class="max-w-2xl mx-auto">
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                <h3 class="text-primary-600 font-medium mb-2">AI思考过程：</h3>
                <div class="space-y-2">
                  <div 
                    v-for="(step, index) in aiThinkingSteps" 
                    :key="index"
                    class="text-gray-700 text-sm flex items-start"
                  >
                    <span 
                      :class="[
                        'w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0',
                        step.status === 'processing' ? 'bg-primary-500 animate-pulse' :
                        step.status === 'completed' ? 'bg-success-500' :
                        'bg-gray-300'
                      ]"
                    ></span>
                    <span>{{ step.text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 历史记录侧边栏 -->
      <aside v-if="showHistory" class="w-80 border-l border-[#EAE2B7]/20 p-4 overflow-y-auto">
        <h2 class="text-lg font-semibold text-[#EAE2B7] mb-4">历史记录</h2>
        <div class="space-y-3">
          <div 
            v-for="record in historyRecords" 
            :key="record.id"
            class="bg-[#EAE2B7]/5 border border-[#EAE2B7]/20 rounded-lg p-3 cursor-pointer hover:bg-[#EAE2B7]/10 transition-colors"
            @click="loadHistoryRecord(record)"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-[#F77F00] font-medium">{{ record.score }}分</span>
              <span class="text-[#EAE2B7]/50 text-xs">{{ formatDate(record.created_at) }}</span>
            </div>
            <p class="text-[#EAE2B7]/80 text-sm line-clamp-2">
              {{ record.paraphrased_text.substring(0, 50) }}...
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, Mic, Square, Play, Pause, CheckCircle, AlertTriangle, Loader2, BookOpen
} from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { siliconFlowAPI } from '@/lib/siliconflow'
import { speechRecognizer, checkSpeechRecognitionCompatibility } from '@/lib/speechRecognition'
import type { Paragraph, UserParaphraseEvaluation } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const paragraph = ref<Paragraph | null>(null)
const isRecording = ref(false)
const isPlaying = ref(false)
const isProcessing = ref(false)
const processingStatus = ref('')
const recordingTime = ref(0)
const audioBlob = ref<Blob | null>(null)
const transcribedText = ref('')
const evaluation = ref<{
  score: number
  accuracy_score?: number
  completeness_score?: number
  clarity_score?: number
  presentation_score?: number
  strengths: string[]
  improvements: (string | { issue: string; suggestion: string })[]
  key_terms?: string[]
  presentation_tips?: string[]
  overall_feedback: string
} | null>(null)
const showHistory = ref(false)
const historyRecords = ref<UserParaphraseEvaluation[]>([])
const aiThinkingSteps = ref<Array<{
  text: string
  status: 'pending' | 'processing' | 'completed'
}>>([])

// 录音相关
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let recordingInterval: number | null = null
let audioElement: HTMLAudioElement | null = null
const isSpeechRecognitionSupported = ref(false)
const recognitionStatus = ref('')
const usingIFlytek = ref(false)

// 方法
const goBack = () => {
  router.push('/study')
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getScoreLevel = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '需要改进'
}

// TypeScript接口定义
interface QualityAnalysis {
  isEmpty: boolean
  isTooShort: boolean
  isRepeated: boolean
  isDisproportionate: boolean
  wordCount: number
  charCount: number
  qualityScore: number
  issues: string[]
}

interface EvaluationResult {
  score: number
  accuracy_score: number
  completeness_score: number
  clarity_score: number
  presentation_score: number
  strengths: string[]
  improvements: Array<{issue: string, suggestion: string} | string>
  key_terms: string[]
  presentation_tips: string[]
  overall_feedback: string
}

// 注意：本地评估函数已移除，严格使用AI评估

// 改进的Jaccard相似度算法
const calculateJaccardSimilarity = (text1: string, text2: string): number => {
  if (!text1 || !text2) return 0
  
  // 文本预处理：转小写，分词，去除标点
  const processText = (text: string): Set<string> => {
    return new Set(
      text.toLowerCase()
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 保留中文、英文、数字和空格
        .split(/\s+/)
        .filter(word => word.length > 0)
    )
  }
  
  const set1 = processText(text1)
  const set2 = processText(text2)
  
  if (set1.size === 0 || set2.size === 0) return 0
  
  // 计算交集
  const intersection = new Set([...set1].filter(word => set2.has(word)))
  
  // 计算并集
  const union = new Set([...set1, ...set2])
  
  // Jaccard相似度 = |交集| / |并集|
  return intersection.size / union.size
}

// 兼容旧版本的相似度函数
const calculateSimilarity = (text1: string, text2: string): number => {
  return calculateJaccardSimilarity(text1, text2)
}

// 文本相似度计算（使用Jaccard算法）
const calculateTextSimilarity = (text1: string, text2: string): number => {
  return calculateJaccardSimilarity(text1, text2)
}

// 本地评估函数已移除，严格使用AI评估

// 智能评估函数已移除，严格使用AI评估

// 所有本地评估辅助函数已移除，严格使用AI评估

const checkSpeechRecognitionSupport = () => {
  const compatibility = checkSpeechRecognitionCompatibility()
  isSpeechRecognitionSupported.value = compatibility.supported
  usingIFlytek.value = compatibility.currentService === 'iflytek'
  
  if (!compatibility.supported) {
    recognitionStatus.value = compatibility.reason || '语音识别不可用'
  } else {
    recognitionStatus.value = compatibility.currentService === 'iflytek' 
      ? '使用科大讯飞语音识别' 
      : '使用浏览器原生语音识别'
  }
}

const startRecording = async () => {
  try {
    // 检查语音识别支持
    checkSpeechRecognitionSupport()
    
    if (!isSpeechRecognitionSupported.value) {
      alert(`${recognitionStatus.value}\n\n如果您使用的是Chrome浏览器，请：\n1. 点击地址栏左侧的锁形图标\n2. 允许麦克风权限\n3. 刷新页面后重试\n\n或者尝试使用HTTPS访问：https://localhost:5174`)
      return
    }
    
    // 清理之前的录音状态
    if (audioBlob.value) {
      audioBlob.value = null
    }
    if (transcribedText.value) {
      transcribedText.value = ''
    }
    if (evaluation.value) {
      evaluation.value = null
    }
    
    isRecording.value = true
    recordingTime.value = 0
    
    // 开始计时
    recordingInterval = window.setInterval(() => {
      recordingTime.value++
    }, 1000)
    
    console.log('开始语音识别...', recognitionStatus.value)
    
    // 使用新的语音识别服务
    await speechRecognizer.startRecognition(
      (text) => {
        console.log('语音识别结果:', text)
        transcribedText.value = text
        processWithTranscribedText(text)
      },
      (error) => {
        console.error('语音识别错误:', error)
        alert(`语音识别失败: ${error}`)
        stopRecording()
      }
    )
    
  } catch (error) {
    console.error('启动语音识别失败:', error)
    alert(`启动失败: ${error.message || '未知错误'}`)
    stopRecording()
  }
}

const stopRecording = async () => {
  try {
    // 停止语音识别
    speechRecognizer.stopRecognition()
    
    isRecording.value = false
    
    if (recordingInterval) {
      clearInterval(recordingInterval)
      recordingInterval = null
    }
    
    // 停止旧的MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop())
      }
    }
    
    console.log('语音识别已停止')
    
    // 如果有转录文本，开始AI评估
    if (transcribedText.value && transcribedText.value.trim().length > 0) {
      await processRecording()
    }
    
  } catch (error) {
    console.error('停止语音识别失败:', error)
  }
}

// 使用转录文本进行处理
const processWithTranscribedText = async (text: string) => {
  if (!text || !paragraph.value) return
  
  // 不要自动停止录音，让用户手动控制
  // 只更新转录文本，继续录音
  console.log('语音识别实时结果:', text)
}

const playRecording = () => {
  if (!audioBlob.value) return
  
  if (audioElement) {
    audioElement.pause()
    audioElement = null
  }
  
  audioElement = new Audio(URL.createObjectURL(audioBlob.value))
  audioElement.onplay = () => { isPlaying.value = true }
  audioElement.onpause = () => { isPlaying.value = false }
  audioElement.onended = () => { isPlaying.value = false }
  
  audioElement.play()
}

const processRecording = async () => {
  if (!transcribedText.value || !paragraph.value) return
  
  isProcessing.value = true
  processingStatus.value = '正在进行AI评估...'
  
  // 初始化AI思考步骤
  aiThinkingSteps.value = [
    { text: '语音内容分析完成', status: 'completed' },
    { text: '正在评估复述准确性...', status: 'processing' },
    { text: '正在生成改进建议...', status: 'pending' },
    { text: '正在总结评估结果...', status: 'pending' }
  ]
  
  try {
    // 严格使用AI评估，不进行任何本地质量检查或备用评估
    console.log('开始AI评估，原文长度:', paragraph.value.content.length, '复述长度:', transcribedText.value.length)
    
    let aiResponse = ''
    
    // 调用AI评估API
    await siliconFlowAPI.evaluateParaphrase(
      paragraph.value.content,
      transcribedText.value,
      (partialContent) => {
        aiResponse = partialContent
        
        // 根据响应长度更新思考步骤状态
        if (aiResponse.length > 50) {
          aiThinkingSteps.value[1] = { text: '复述准确性评估完成', status: 'completed' }
          aiThinkingSteps.value[2] = { text: '正在生成改进建议...', status: 'processing' }
        }
        
        if (aiResponse.length > 200) {
          aiThinkingSteps.value[2] = { text: '改进建议生成完成', status: 'completed' }
          aiThinkingSteps.value[3] = { text: '正在总结评估结果...', status: 'processing' }
        }
      }
    )
    
    // 验证AI响应
    if (!aiResponse || aiResponse.trim().length === 0) {
      throw new Error('AI评估返回空响应')
    }
    
    console.log('AI评估原始响应:', aiResponse)
    
    // 解析AI评估结果
    let evaluationData
    try {
      // 尝试直接解析JSON
      evaluationData = JSON.parse(aiResponse)
    } catch (parseError) {
      console.log('直接JSON解析失败，尝试提取JSON部分')
      // 尝试从响应中提取JSON部分
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        evaluationData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('无法从AI响应中提取有效的JSON数据')
      }
    }
    
    // 验证评估数据结构
    if (!evaluationData || typeof evaluationData.score !== 'number') {
      throw new Error('AI评估数据格式不正确')
    }
    
    console.log('AI评估解析成功:', evaluationData)
    
    evaluation.value = evaluationData
    
    // 更新最后一步为完成状态
    aiThinkingSteps.value[3] = { text: '评估结果总结完成', status: 'completed' }
    
    await saveEvaluation(transcribedText.value, evaluationData)
    
  } catch (error) {
    console.error('AI评估失败:', error)
    
    // 显示错误信息给用户
    alert(`AI评估失败: ${error.message}\n\n请检查：\n1. 网络连接是否正常\n2. AI服务是否可用\n3. API密钥是否正确配置\n\n请稍后重试。`)
    
    // 重置思考步骤显示错误状态
    aiThinkingSteps.value = [
      { text: 'AI评估失败', status: 'completed' },
      { text: '请检查网络连接和API配置', status: 'completed' },
      { text: '建议稍后重试', status: 'completed' }
    ]
    
  } finally {
    isProcessing.value = false
    processingStatus.value = ''
    // 清空思考步骤
    setTimeout(() => {
      aiThinkingSteps.value = []
    }, 3000)
  }
}

const saveEvaluation = async (paraphrasedText: string, evaluationResult: any) => {
  if (!authStore.user || !paragraph.value) return
  
  try {
    const { error } = await supabase
      .from('user_paraphrase_evaluations')
      .insert({
        user_id: authStore.user.id,
        paragraph_id: paragraph.value.id,
        paraphrased_text: paraphrasedText,
        evaluation_result: evaluationResult,
        score: evaluationResult.score
      })
    
    if (error) throw error
    
    // 刷新历史记录
    await loadHistoryRecords()
    
  } catch (error) {
    console.error('保存评估结果失败:', error)
  }
}

const loadHistoryRecord = (record: UserParaphraseEvaluation) => {
  transcribedText.value = record.paraphrased_text
  evaluation.value = record.evaluation_result
}

const loadParagraph = async () => {
  const paragraphId = route.params.id as string
  if (!paragraphId) {
    console.error('缺少段落ID参数')
    router.push('/')
    return
  }
  
  try {
    const { data, error } = await supabase
      .from('paragraphs')
      .select('*')
      .eq('custom_id', paragraphId)
      .single()
    
    if (error) {
      console.error('数据库查询错误:', error)
      throw error
    }
    
    if (!data) {
      console.error('未找到段落:', paragraphId)
      throw new Error('段落不存在')
    }
    
    paragraph.value = data
    console.log('段落加载成功:', data.title)
  } catch (error) {
    console.error('加载段落失败:', error)
    // 不要立即跳转，给用户提示
    alert(`加载段落失败: ${error.message || '未知错误'}\n段落ID: ${paragraphId}`)
    router.push('/')
  }
}

const loadHistoryRecords = async () => {
  if (!authStore.user || !paragraph.value) return
  
  try {
    const { data, error } = await supabase
      .from('user_paraphrase_evaluations')
      .select('*')
      .eq('user_id', authStore.user.id)
      .eq('paragraph_id', paragraph.value.id) // 使用UUID主键
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('历史记录查询错误:', error)
      throw error
    }
    
    historyRecords.value = data || []
    console.log(`加载了 ${data?.length || 0} 条历史记录`)
  } catch (error) {
    console.error('加载历史记录失败:', error)
    // 历史记录加载失败不影响主要功能，只记录错误
  }
}

// 组件挂载和卸载
onMounted(async () => {
  await loadParagraph()
  await loadHistoryRecords()
  checkSpeechRecognitionSupport()
})

onUnmounted(() => {
  if (isRecording.value) {
    stopRecording()
  }
  if (recordingInterval) {
    clearInterval(recordingInterval)
  }
  if (audioElement) {
    audioElement.pause()
  }
})
</script>
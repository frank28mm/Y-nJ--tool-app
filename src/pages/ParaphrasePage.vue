<template>
  <div class="min-h-screen bg-[#003049] flex flex-col">
    <!-- 顶部导航栏 -->
    <header class="border-b border-[#EAE2B7]/20 p-4">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            @click="goBack"
            class="text-[#EAE2B7]/65 hover:text-[#F77F00] transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-xl font-bold text-[#EAE2B7] flex items-center">
              <Mic class="w-5 h-5 mr-2 text-[#F77F00]" />
              复述训练
            </h1>
            <p class="text-[#EAE2B7]/65 text-sm">{{ paragraph?.title }}</p>
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
            <h2 class="text-lg font-semibold text-[#EAE2B7] mb-4">原文内容</h2>
            <div class="bg-[#EAE2B7]/5 border border-[#EAE2B7]/20 rounded-lg p-6">
              <div class="text-[#EAE2B7] leading-relaxed whitespace-pre-wrap">
                {{ paragraph?.content }}
              </div>
            </div>
          </div>

          <!-- 录音区域 -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-[#EAE2B7] mb-4">语音复述</h2>
            <div class="bg-[#003049] border border-[#EAE2B7]/20 rounded-lg p-8 text-center">
              <!-- 录音状态显示 -->
              <div class="mb-6">
                <div 
                  :class="[
                    'w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center transition-all duration-300',
                    isRecording 
                      ? 'bg-[#D62828]/20 border-2 border-[#D62828] animate-pulse' 
                      : 'bg-[#F77F00]/10 border-2 border-[#F77F00] hover:bg-[#F77F00]/20'
                  ]"
                >
                  <Mic :class="['w-8 h-8', isRecording ? 'text-[#D62828]' : 'text-[#F77F00]']" />
                </div>
                
                <div class="text-[#EAE2B7] mb-2">
                  {{ isRecording ? '正在录音...' : '点击开始录音' }}
                </div>
                
                <div v-if="recordingTime > 0" class="text-[#EAE2B7]/65 text-sm">
                  录音时长: {{ formatTime(recordingTime) }}
                </div>
              </div>

              <!-- 录音控制按钮 -->
              <div class="flex items-center justify-center space-x-4">
                <button
                  v-if="!isRecording"
                  @click="startRecording"
                  :disabled="isProcessing"
                  class="px-6 py-3 bg-[#F77F00] text-[#003049] rounded-lg hover:bg-[#F77F00]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Mic class="w-4 h-4" />
                  <span>开始录音</span>
                </button>
                
                <button
                  v-else
                  @click="stopRecording"
                  class="px-6 py-3 bg-[#D62828] text-white rounded-lg hover:bg-[#D62828]/90 transition-colors font-medium flex items-center space-x-2"
                >
                  <Square class="w-4 h-4" />
                  <span>停止录音</span>
                </button>
                
                <button
                  v-if="audioBlob && !isRecording"
                  @click="playRecording"
                  :disabled="isPlaying"
                  class="px-4 py-3 bg-transparent border border-[#F77F00] text-[#F77F00] rounded-lg hover:bg-[#F77F00]/10 transition-colors disabled:opacity-50"
                >
                  <Play v-if="!isPlaying" class="w-4 h-4" />
                  <Pause v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 转录文本 -->
          <div v-if="transcribedText" class="mb-8">
            <h2 class="text-lg font-semibold text-[#EAE2B7] mb-4">语音转录</h2>
            <div class="bg-[#EAE2B7]/5 border border-[#EAE2B7]/20 rounded-lg p-6">
              <div class="text-[#EAE2B7] leading-relaxed whitespace-pre-wrap">
                {{ transcribedText }}
              </div>
            </div>
          </div>

          <!-- AI评估结果 -->
          <div v-if="evaluation" class="mb-8">
            <h2 class="text-lg font-semibold text-[#EAE2B7] mb-4">AI评估报告</h2>
            <div class="bg-[#003049] border border-[#EAE2B7]/20 rounded-lg p-6">
              <!-- 综合评分 -->
              <div class="flex items-center justify-between mb-6">
                <div class="text-3xl font-bold text-[#F77F00]">{{ evaluation.score }}分</div>
                <div class="text-right">
                  <div class="text-[#F77F00] font-bold text-lg" >{{ getScoreLevel(evaluation.score) }}</div>
                  <div class="flex items-center space-x-2 mt-2">
                    <div class="w-32 h-2 bg-[#EAE2B7]/20 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-gradient-to-r from-[#D62828] via-[#FCBF49] to-[#F77F00] transition-all duration-500"
                        :style="{ width: `${evaluation.score}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 各维度评分 -->
              <div v-if="evaluation.accuracy_score || evaluation.completeness_score || evaluation.clarity_score || evaluation.presentation_score" class="mb-6">
                <h3 class="text-[#EAE2B7] font-medium mb-3">各维度评分</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="bg-[#EAE2B7]/5 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-[#F77F00]">{{ evaluation.accuracy_score || 0 }}</div>
                    <div class="text-xs text-[#EAE2B7]/65">信息准确性</div>
                  </div>
                  <div class="bg-[#EAE2B7]/5 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-[#F77F00]">{{ evaluation.completeness_score || 0 }}</div>
                    <div class="text-xs text-[#EAE2B7]/65">完整性</div>
                  </div>
                  <div class="bg-[#EAE2B7]/5 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-[#F77F00]">{{ evaluation.clarity_score || 0 }}</div>
                    <div class="text-xs text-[#EAE2B7]/65">表达清晰度</div>
                  </div>
                  <div class="bg-[#EAE2B7]/5 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-[#F77F00]">{{ evaluation.presentation_score || 0 }}</div>
                    <div class="text-xs text-[#EAE2B7]/65">讲解技巧</div>
                  </div>
                </div>
              </div>

              <!-- 优点 -->
              <div v-if="evaluation.strengths && evaluation.strengths.length > 0" class="mb-4">
                <h3 class="text-[#F77F00] font-medium mb-3 flex items-center">
                  <CheckCircle class="w-5 h-5 mr-2" />
                  优点亮点
                </h3>
                <div class="space-y-2">
                  <div 
                    v-for="(strength, index) in evaluation.strengths" 
                    :key="index" 
                    class="bg-[#F77F00]/10 border-l-4 border-[#F77F00] rounded-r-lg p-3"
                  >
                    <div class="text-[#F77F00] font-medium text-sm">{{ strength }}</div>
                  </div>
                </div>
              </div>

              <!-- 改进建议 -->
              <div v-if="evaluation.improvements && evaluation.improvements.length > 0" class="mb-4">
                <h3 class="text-[#FCBF49] font-medium mb-3 flex items-center">
                  <AlertTriangle class="w-5 h-5 mr-2" />
                  改进建议
                </h3>
                <div class="space-y-3">
                  <div 
                    v-for="(item, index) in evaluation.improvements" 
                    :key="index" 
                    class="bg-[#FCBF49]/10 border-l-4 border-[#FCBF49] rounded-r-lg p-3"
                  >
                    <div v-if="typeof item === 'object' && item.issue" class="text-[#FCBF49] font-medium text-sm mb-1">{{ item.issue }}</div>
                    <div v-if="typeof item === 'object' && item.suggestion" class="text-[#EAE2B7]/80 text-xs">{{ item.suggestion }}</div>
                    <div v-else-if="typeof item === 'string'" class="text-[#EAE2B7]/80 text-sm">{{ item }}</div>
                  </div>
                </div>
              </div>

              <!-- 关键词汇建议 -->
              <div v-if="evaluation.key_terms && evaluation.key_terms.length > 0" class="mb-4">
                <h3 class="text-[#EAE2B7] font-medium mb-2 flex items-center">
                  <BookOpen class="w-4 h-4 mr-2" />
                  关键词汇建议
                </h3>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="term in evaluation.key_terms" 
                    :key="term" 
                    class="px-2 py-1 bg-[#EAE2B7]/20 text-[#EAE2B7] text-xs rounded-full"
                  >{{ term }}</span>
                </div>
              </div>

              <!-- 讲解技巧建议 -->
              <div v-if="evaluation.presentation_tips && evaluation.presentation_tips.length > 0" class="mb-4">
                <h3 class="text-[#EAE2B7] font-medium mb-2 flex items-center">
                  <Mic class="w-4 h-4 mr-2" />
                  讲解技巧建议
                </h3>
                <div class="space-y-2">
                  <div 
                    v-for="(tip, index) in evaluation.presentation_tips" 
                    :key="index" 
                    class="text-[#EAE2B7]/80 text-sm bg-[#EAE2B7]/5 rounded-lg p-2"
                  >{{ tip }}</div>
                </div>
              </div>

              <!-- 总体反馈 -->
              <div class="border-t border-[#EAE2B7]/20 pt-4">
                <h3 class="text-[#EAE2B7] font-medium mb-2">总体评价</h3>
                <p class="text-[#EAE2B7]/80 text-sm leading-relaxed">
                  {{ evaluation.overall_feedback }}
                </p>
              </div>
            </div>
          </div>

          <!-- 语音识别状态 -->
          <div v-if="!isSpeechRecognitionSupported" class="mb-4">
            <div class="bg-[#D62828]/10 border border-[#D62828]/20 rounded-lg p-4">
              <div class="flex items-center">
                <AlertTriangle class="w-5 h-5 text-[#D62828] mr-2" />
                <div>
                  <h3 class="text-[#D62828] font-medium">语音识别不可用</h3>
                  <p class="text-[#D62828]/80 text-sm">{{ recognitionStatus }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="recognitionStatus" class="mb-4">
            <div class="bg-[#F77F00]/10 border border-[#F77F00]/20 rounded-lg p-3">
              <div class="flex items-center">
                <CheckCircle class="w-4 h-4 text-[#F77F00] mr-2" />
                <span class="text-[#F77F00] text-sm">{{ recognitionStatus }}</span>
              </div>
            </div>
          </div>

          <!-- 处理状态 -->
          <div v-if="isProcessing" class="text-center py-8">
            <Loader2 class="w-8 h-8 text-[#F77F00] animate-spin mx-auto mb-4" />
            <div class="text-[#EAE2B7]/65 mb-4">{{ processingStatus }}</div>
            
            <!-- AI思考过程显示 -->
            <div v-if="aiThinkingSteps.length > 0" class="max-w-2xl mx-auto">
              <div class="bg-[#EAE2B7]/5 border border-[#EAE2B7]/20 rounded-lg p-4 text-left">
                <h3 class="text-[#F77F00] font-medium mb-2">AI思考过程：</h3>
                <div class="space-y-2">
                  <div 
                    v-for="(step, index) in aiThinkingSteps" 
                    :key="index"
                    class="text-[#EAE2B7]/70 text-sm flex items-start"
                  >
                    <span 
                      :class="[
                        'w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0',
                        step.status === 'processing' ? 'bg-[#F77F00] animate-pulse' :
                        step.status === 'completed' ? 'bg-[#008000]' :
                        'bg-[#EAE2B7]/30'
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

// 计算文本相似度的简单函数
const calculateTextSimilarity = (text1: string, text2: string): number => {
  if (!text1 || !text2) return 0
  
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  // 计算共同词汇的比例
  const commonWords = words1.filter(word => words2.includes(word))
  const similarity = commonWords.length / Math.max(words1.length, words2.length)
  
  return Math.min(similarity, 0.7) // 最高相似度限制为0.7
}

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
      alert(recognitionStatus.value)
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
    
    // 使用流式AI评估
    let aiResponse = ''
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
    
    // 解析AI评估结果
    try {
      const evaluationData = JSON.parse(aiResponse)
      evaluation.value = evaluationData
      
      // 更新最后一步为完成状态
      aiThinkingSteps.value[3] = { text: '评估结果总结完成', status: 'completed' }
      
      // 保存评估结果
      await saveEvaluation(transcribedText.value, evaluationData)
      
    } catch (parseError) {
      console.error('解析AI评估结果失败:', parseError)
      console.log('原始AI响应:', aiResponse)
      
      // 检查转录文本的质量
      const transcriptLength = transcribedText.value.trim().length
      const wordCount = transcribedText.value.trim().split(/\s+/).length
      
      // 如果转录文本过短或质量太差，给出合理的低分评估
      if (transcriptLength < 10 || wordCount < 3) {
        const lowQualityEvaluation = {
          score: 20,
          accuracy_score: 5,
          completeness_score: 5,
          clarity_score: 5,
          presentation_score: 5,
          strengths: [],
          improvements: [
            {
              issue: '录音内容过短或不清晰',
              suggestion: '请确保录音环境安静，说话清晰，并尽量完整复述原文内容'
            },
            {
              issue: '复述内容与原文相关性不足',
              suggestion: '请仔细阅读原文，理解核心内容后再进行复述'
            }
          ],
          key_terms: [],
          presentation_tips: [
            '建议先熟读原文，理解核心概念',
            '录音时保持清晰的发音和适中的语速',
            '确保录音环境安静，避免背景噪音'
          ],
          overall_feedback: '本次复述内容过短或不够清晰，建议重新录制。请先仔细阅读原文，理解核心内容后再进行完整的复述练习。'
        }
        
        evaluation.value = lowQualityEvaluation
        await saveEvaluation(transcribedText.value, lowQualityEvaluation)
      } else {
        // 如果转录文本长度合理但解析失败，尝试重新请求AI评估
        try {
          // 使用更简单的提示词重新请求
          const simplePrompt = `请评估以下复述内容（满分100分）：\n\n原文：${paragraph.value.content}\n\n复述：${transcribedText.value}\n\n请给出0-100的分数，并简要说明优缺点。以JSON格式返回：{"score": 分数, "strengths": ["优点1"], "improvements": ["改进建议1"], "overall_feedback": "总体评价"}`
          
          const retryResponse = await siliconFlowAPI.chat([
            { role: 'user', content: simplePrompt }
          ])
          
          const retryEvaluation = JSON.parse(retryResponse)
          evaluation.value = retryEvaluation
          await saveEvaluation(transcribedText.value, retryEvaluation)
          
        } catch (retryError) {
          console.error('重试AI评估也失败:', retryError)
          
          // 最后的备用评估，基于文本长度给出合理分数
          const textSimilarity = calculateTextSimilarity(paragraph.value.content, transcribedText.value)
          const baseScore = Math.max(30, Math.min(70, textSimilarity * 100))
          
          const fallbackEvaluation = {
            score: Math.round(baseScore),
            accuracy_score: Math.round(baseScore * 0.4),
            completeness_score: Math.round(baseScore * 0.25),
            clarity_score: Math.round(baseScore * 0.2),
            presentation_score: Math.round(baseScore * 0.15),
            strengths: baseScore > 50 ? ['复述内容基本完整'] : [],
            improvements: [
              {
                issue: 'AI评估系统暂时不可用',
                suggestion: '建议稍后重试，或联系管理员检查系统状态'
              }
            ],
            key_terms: [],
            presentation_tips: ['建议重新进行复述练习'],
            overall_feedback: `系统评估暂时不可用，基于文本分析给出参考分数：${Math.round(baseScore)}分。建议稍后重试获得详细评估。`
          }
          
          evaluation.value = fallbackEvaluation
          await saveEvaluation(transcribedText.value, fallbackEvaluation)
        }
      }
    }
    
  } catch (error) {
    console.error('处理录音失败:', error)
    alert('处理录音失败，请稍后重试')
  } finally {
    isProcessing.value = false
    processingStatus.value = ''
    // 清空思考步骤
    setTimeout(() => {
      aiThinkingSteps.value = []
    }, 2000)
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
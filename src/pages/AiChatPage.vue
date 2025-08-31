<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- 顶部导航栏 -->
    <header class="border-b border-gray-200 p-3 md:p-4 bg-white shadow-light">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-2 md:mb-0">
          <div class="flex items-center space-x-3 md:space-x-4">
            <button
              @click="goBack"
              class="text-gray-500 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div>
              <h1 class="text-lg md:text-xl font-bold text-gray-900 flex items-center">
                <Bot class="w-4 md:w-5 h-4 md:h-5 mr-2 text-primary-500" />
                天文馆AI讲解员
              </h1>
              <p class="text-gray-600 text-xs md:text-sm hidden md:block">{{ paragraph?.title }}</p>
            </div>
          </div>
          
          <!-- 移动端清空对话按钮 -->
          <button
            @click="clearChat"
            v-if="messages.length > 0"
            class="md:hidden px-2 py-1 text-xs bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors shadow-light"
          >
            清空
          </button>
        </div>
        
        <!-- 移动端第二行：模型选择器和桌面端清空按钮 -->
        <div class="flex items-center justify-between md:justify-end space-x-3 md:space-x-4">
          <div class="flex items-center space-x-2 flex-1 md:flex-none">
            <label class="text-gray-600 text-xs md:text-sm hidden md:inline">AI模型:</label>
            <select
              v-model="selectedModel"
              class="px-2 md:px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs md:text-sm rounded-md focus:outline-none focus:border-primary-500 transition-colors flex-1 md:flex-none shadow-light"
            >
              <option
                v-for="(config, modelKey) in SILICONFLOW_MODELS"
                :key="modelKey"
                :value="modelKey"
              >
                {{ config.name }}
              </option>
            </select>
          </div>
        
          <!-- 桌面端清空对话按钮 -->
          <button
            @click="clearChat"
            v-if="messages.length > 0"
            class="hidden md:block px-3 py-1 text-sm bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors shadow-light"
          >
            清空对话
          </button>
        </div>
      </div>
    </header>

    <!-- 聊天区域 -->
    <main class="flex-1 flex flex-col">
      <div class="flex-1 overflow-y-auto p-4">
        <div class="max-w-4xl mx-auto space-y-4">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="text-center py-12">
            <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-200">
              <Bot class="w-8 h-8 text-primary-500" />
            </div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">天文馆AI讲解员为您服务</h2>
            <p class="text-gray-600 mb-2">我是您的专业天文讲解助手，可以为您详细解答天文相关问题，提供深入的知识讲解。</p>
            <div class="flex items-center justify-center space-x-2 mb-4">
              <span class="text-gray-500 text-sm">当前使用模型:</span>
              <span class="text-primary-600 text-sm font-medium">{{ SILICONFLOW_MODELS[selectedModel].name }}</span>
              <span class="text-gray-400 text-xs">{{ SILICONFLOW_MODELS[selectedModel].description }}</span>
            </div>
            
            <!-- API状态指示器 -->
             <div class="flex items-center justify-center space-x-4 mb-6">
               <div class="flex items-center space-x-1">
                 <div 
                   class="w-2 h-2 rounded-full transition-colors"
                   :class="{
                     'bg-success-500': apiHealthy === true,
                     'bg-error-500': apiHealthy === false,
                     'bg-warning-500 animate-pulse': apiHealthy === null
                   }"
                 ></div>
                 <span class="text-gray-500 text-xs">
                   {{ apiHealthy === true ? 'AI服务正常' : apiHealthy === false ? 'AI服务异常' : '检查中...' }}
                 </span>
               </div>
               
               <!-- 重新检查按钮 -->
               <button
                 v-if="apiHealthy === false"
                 @click="recheckApiHealth"
                 :disabled="isRecheckingApi"
                 class="px-2 py-1 text-xs bg-primary-50 border border-primary-300 text-primary-600 rounded hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 shadow-light"
               >
                 <Loader2 v-if="isRecheckingApi" class="w-3 h-3 animate-spin" />
                 <span>{{ isRecheckingApi ? '检查中...' : '重新检查' }}</span>
               </button>
             </div>
            
            <!-- 建议问题 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <button
                v-for="suggestion in suggestions"
                :key="suggestion"
                @click="askSuggestion(suggestion)"
                class="p-3 text-left bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-primary-300 transition-colors shadow-light"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div v-for="(message, index) in messages" :key="index" class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
            <!-- AI消息 -->
            <div v-if="message.role === 'assistant'" class="flex items-start space-x-2 md:space-x-3 max-w-[85%] md:max-w-3xl">
              <div class="w-6 md:w-8 h-6 md:h-8 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0 border border-primary-200">
                <Bot class="w-3 md:w-4 h-3 md:h-4 text-primary-500" />
              </div>
              <div class="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-light">
                <div class="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {{ message.content }}
                </div>
                
                <!-- AI消息功能按键 -->
                <div class="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-200">
                  <button
                    @click="copyMessage(message.content)"
                    class="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    title="复制回答"
                  >
                    <Copy class="w-3 h-3" />
                    <span class="hidden md:inline">复制</span>
                  </button>
                  <button
                    @click="regenerateResponse(index)"
                    class="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    title="重新生成"
                  >
                    <RotateCcw class="w-3 h-3" />
                    <span class="hidden md:inline">重新生成</span>
                  </button>
                </div>
                
                <div class="text-xs text-gray-500 mt-2">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>

            <!-- 用户消息 -->
            <div v-else class="flex items-start space-x-2 md:space-x-3 max-w-[85%] md:max-w-3xl">
              <div class="bg-primary-50 border border-primary-200 rounded-lg p-3 md:p-4 shadow-light">
                <div class="text-gray-700 whitespace-pre-wrap text-sm md:text-base">
                  {{ message.content }}
                </div>
                <div class="text-xs text-gray-500 mt-2 text-right">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
              <div class="w-6 md:w-8 h-6 md:h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 border border-primary-300">
                <User class="w-3 md:w-4 h-3 md:h-4 text-primary-600" />
              </div>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="flex justify-start">
            <div class="flex items-start space-x-2 md:space-x-3 max-w-[85%] md:max-w-3xl">
              <div class="w-6 md:w-8 h-6 md:h-8 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0 border border-primary-200">
                <Bot class="w-3 md:w-4 h-3 md:h-4 text-primary-500" />
              </div>
              <div class="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-light">
                <div class="flex items-center space-x-2 text-gray-600 text-sm md:text-base">
                  <Loader2 class="w-4 h-4 animate-spin text-primary-500" />
                  <span>天文馆AI讲解员正在思考...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="border-t border-gray-200 p-3 md:p-4 bg-white">
        <div class="max-w-4xl mx-auto">
          <form @submit.prevent="sendMessage" class="flex space-x-2 md:space-x-4">
            <div class="flex-1">
              <textarea
                v-model="currentMessage"
                @keydown.enter.exact.prevent="sendMessage"
                @keydown.enter.shift.exact="() => {}"
                :disabled="isLoading"
                placeholder="输入您的问题... (Enter发送，Shift+Enter换行)"
                rows="2"
                class="w-full px-3 md:px-4 py-2 md:py-3 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none disabled:opacity-50 text-sm md:text-base shadow-light"
              ></textarea>
            </div>
            <button
              type="submit"
              :disabled="!currentMessage.trim() || isLoading"
              class="px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 md:space-x-2 text-sm md:text-base shadow-medium"
            >
              <Send class="w-4 h-4" />
              <span class="hidden md:inline">发送</span>
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, Bot, User, Send, Loader2, Copy, RotateCcw
} from 'lucide-vue-next'
import { onViewportChange, getViewportHeight, isMobileDevice, preventDoubleClickZoom } from '@/utils/touch'
// 移除Supabase相关导入，改用本地JSON数据
// import { supabase } from '@/lib/supabase'
// import type { Paragraph } from '@/lib/supabase'

// 定义本地段落数据类型
interface Paragraph {
  id: string
  section: string
  module: string
  title: string
  content: string
  keywords: string[]
  fill_blanks: string
  fill_blanks_answers: string[]
  voice_check_phrases: string
}
import { 
  callSiliconFlowAPI, 
  getAstronomyGuidePrompt, 
  getDefaultModel,
  SILICONFLOW_MODELS,
  getFallbackResponse,
  type SiliconFlowModel 
} from '@/utils/siliconflow'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const route = useRoute()
const router = useRouter()

// 响应式数据
const paragraph = ref<Paragraph | null>(null)
const messages = ref<Message[]>([])
const currentMessage = ref('')
const isLoading = ref(false)
const selectedModel = ref<SiliconFlowModel>(getDefaultModel())
const apiHealthy = ref<boolean | null>(null) // null: 未检查, true: 健康, false: 不健康
const isRecheckingApi = ref(false) // 是否正在重新检查API

// 建议问题
const suggestions = computed(() => {
  if (!paragraph.value) return []
  
  return [
    `请详细解释一下"${paragraph.value.title}"的主要内容`,
    '这段内容中有哪些重要的知识点？',
    '能否用更简单的话来解释这个概念？',
    '这个内容在实际中有什么应用？'
  ]
})

// 方法
const goBack = () => {
  router.push('/study')
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const askSuggestion = (suggestion: string) => {
  currentMessage.value = suggestion
  sendMessage()
}

const clearChat = () => {
  messages.value = []
}

// 复制消息到剪贴板
const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    console.log('✅ [DEBUG] Message copied to clipboard')
    // 这里可以添加一个简单的提示，比如临时改变按钮文本
  } catch (error) {
    console.error('❌ [ERROR] Failed to copy message:', error)
    // 降级方案：使用传统的复制方法
    const textArea = document.createElement('textarea')
    textArea.value = content
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

// 重新生成响应
const regenerateResponse = async (messageIndex: number) => {
  console.log('🔄 [DEBUG] Regenerating response for message index:', messageIndex)
  
  if (isLoading.value) {
    console.warn('⚠️ [DEBUG] Already loading, skipping regenerate')
    return
  }
  
  // 找到对应的用户消息
  let userMessageIndex = -1
  for (let i = messageIndex - 1; i >= 0; i--) {
    if (messages.value[i].role === 'user') {
      userMessageIndex = i
      break
    }
  }
  
  if (userMessageIndex === -1) {
    console.error('❌ [ERROR] Could not find corresponding user message')
    return
  }
  
  const userMessage = messages.value[userMessageIndex].content
  console.log('📝 [DEBUG] Found user message to regenerate:', userMessage)
  
  // 删除从AI消息开始的所有后续消息
  messages.value = messages.value.slice(0, messageIndex)
  
  // 重新发送用户消息
  isLoading.value = true
  
  try {
    console.log('🤖 [DEBUG] Regenerating AI response for:', userMessage)
    
    if (!paragraph.value) {
      throw new Error('段落数据不可用')
    }
    
    // 调用AI API
    const response = await callAiApi(userMessage, paragraph.value)
    
    console.log('✅ [DEBUG] Regenerated AI response received:', {
      responseLength: response?.length || 0,
      responsePreview: response?.substring(0, 100) + '...'
    })
    
    // 添加新的AI响应
    messages.value.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    })
    
    console.log('📝 [DEBUG] Regenerated AI response added, total messages:', messages.value.length)
  } catch (error) {
    console.error('❌ [ERROR] Failed to regenerate response:', error)
    
    // 添加错误消息
    let errorMessage = '抱歉，重新生成失败。请稍后再试。'
    
    if (error?.message?.includes('API Key') || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      errorMessage = '🔑 重新生成失败：API密钥配置错误\n\n请检查API密钥配置是否正确。'
    } else if (error?.message?.includes('超时') || error?.message?.includes('timeout')) {
      errorMessage = '⏰ 重新生成失败：服务响应超时\n\n请稍后重试，或尝试使用更简短的问题。'
    } else if (error?.message?.includes('网络') || error?.message?.includes('fetch') || error?.name === 'TypeError') {
      errorMessage = '🌐 重新生成失败：网络连接异常\n\n请检查网络连接后重试。'
    } else if (error?.message?.includes('429')) {
      errorMessage = '🚦 重新生成失败：请求过于频繁\n\n请稍等片刻后重试。'
    } else if (error?.message) {
      errorMessage = `❌ 重新生成失败\n\n错误详情：${error.message}`
    }
    
    messages.value.push({
      role: 'assistant',
      content: errorMessage,
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
    console.log('🏁 [DEBUG] Regenerate completed, isLoading set to false')
    
    // 滚动到底部
    await nextTick()
    const chatContainer = document.querySelector('.overflow-y-auto')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
      console.log('📜 [DEBUG] Scrolled to bottom after regenerate')
    }
  }
}

const sendMessage = async () => {
  const message = currentMessage.value.trim()
  console.log('🚀 [DEBUG] sendMessage called with:', { message, isLoading: isLoading.value, hasParagraph: !!paragraph.value })
  
  if (!message || isLoading.value || !paragraph.value) {
    console.warn('⚠️ [DEBUG] sendMessage early return:', { 
      noMessage: !message, 
      isLoading: isLoading.value, 
      noParagraph: !paragraph.value 
    })
    return
  }
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  })
  
  console.log('📝 [DEBUG] User message added, total messages:', messages.value.length)
  
  currentMessage.value = ''
  isLoading.value = true
  
  try {
    console.log('🤖 [DEBUG] Calling AI API with:', {
      message,
      paragraphTitle: paragraph.value.title,
      selectedModel: selectedModel.value
    })
    
    // 调用AI API
    const response = await callAiApi(message, paragraph.value)
    
    console.log('✅ [DEBUG] AI API response received:', {
      responseLength: response?.length || 0,
      responsePreview: response?.substring(0, 100) + '...'
    })
    
    // 添加AI响应
    messages.value.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    })
    
    console.log('📝 [DEBUG] AI response added, total messages:', messages.value.length)
  } catch (error) {
    console.error('❌ [ERROR] AI响应失败:', error)
    console.error('❌ [ERROR] Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    })
    
    // 改进错误处理 - 区分不同类型的错误
    let errorMessage = '抱歉，AI服务暂时不可用。请稍后再试。'
    let errorType = 'unknown'
    
    if (error?.message?.includes('API Key') || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      errorMessage = '🔑 AI服务配置错误\n\n请检查API密钥配置是否正确。'
      errorType = 'auth'
    } else if (error?.message?.includes('超时') || error?.message?.includes('timeout')) {
      errorMessage = '⏰ AI服务响应超时\n\n服务器响应时间过长，已自动重试但仍未成功。请稍后重试。'
      errorType = 'timeout'
    } else if (error?.message?.includes('网络') || error?.message?.includes('fetch') || error?.name === 'TypeError') {
      errorMessage = '🌐 网络连接异常\n\n请检查网络连接状态，确保能正常访问互联网。'
      errorType = 'network'
    } else if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
      errorMessage = '🚦 请求过于频繁\n\n服务器限制了请求频率，请稍等片刻后重试。'
      errorType = 'rate_limit'
    } else if (error?.message?.includes('500') || error?.message?.includes('502') || error?.message?.includes('503')) {
      errorMessage = '🔧 服务器内部错误\n\n硅基流动服务器暂时出现问题，请稍后重试。'
      errorType = 'server_error'
    } else if (error?.message) {
      errorMessage = `❌ AI服务出现问题\n\n错误详情：${error.message}`
      errorType = 'api_error'
    }
    
    // 根据错误类型添加针对性建议
    const suggestions = {
      auth: '• 检查.env文件中的VITE_SILICONFLOW_API_KEY配置\n• 确认API密钥有效且未过期\n• 联系管理员获取正确的API密钥',
      timeout: '• 检查网络连接稳定性\n• 尝试切换到其他网络环境\n• 稍后重试，服务器可能正在处理大量请求',
      network: '• 检查网络连接是否正常\n• 尝试刷新页面\n• 检查防火墙或代理设置',
      rate_limit: '• 等待1-2分钟后重试\n• 避免频繁发送请求\n• 如需大量使用，请联系服务提供商',
      server_error: '• 稍后重试，通常几分钟内会恢复\n• 检查硅基流动服务状态\n• 如问题持续，请联系技术支持',
      api_error: '• 检查请求参数是否正确\n• 尝试重新发送消息\n• 如问题持续，请联系管理员',
      unknown: '• 检查网络连接\n• 稍后重试\n• 如问题持续，请联系管理员'
    }
    
    errorMessage += `\n\n💡 解决建议：\n${suggestions[errorType] || suggestions.unknown}`
    
    messages.value.push({
      role: 'assistant',
      content: errorMessage,
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
    console.log('🏁 [DEBUG] sendMessage completed, isLoading set to false')
    
    // 滚动到底部
    await nextTick()
    const chatContainer = document.querySelector('.overflow-y-auto')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
      console.log('📜 [DEBUG] Scrolled to bottom')
    }
  }
}

// 调用硅基流动AI API（带重试机制）
const callAiApi = async (query: string, paragraph: Paragraph, retryCount = 0): Promise<string> => {
  console.log('🔧 [DEBUG] callAiApi started with:', {
    queryLength: query.length,
    paragraphId: paragraph.id,
    paragraphTitle: paragraph.title,
    selectedModel: selectedModel.value
  })
  
  try {
    // 构建对话历史（排除当前问题）
    const conversationHistory = messages.value
      .slice(0, -1) // 排除刚添加的用户消息
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    
    console.log('📚 [DEBUG] Conversation history:', {
      historyLength: conversationHistory.length,
      history: conversationHistory.map(msg => ({ role: msg.role, contentLength: msg.content.length }))
    })
    
    // 构建完整的消息列表
    const systemPrompt = getAstronomyGuidePrompt(`标题：${paragraph.title}\n\n内容：${paragraph.content}`)
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: query }
    ]
    
    console.log('📋 [DEBUG] Full messages for API:', {
      totalMessages: fullMessages.length,
      systemPromptLength: systemPrompt.length,
      messages: fullMessages.map(msg => ({ role: msg.role, contentLength: msg.content.length }))
    })
    
    // 检查网络连接
    if (!navigator.onLine) {
      throw new Error('网络连接不可用，请检查网络连接')
    }
    
    console.log('🌐 [DEBUG] Network status: online, calling SiliconFlow API...')
    
    // 添加详细的请求前检查
    console.log('🔍 [DEBUG] Pre-request check:', {
      hasApiKey: !!import.meta.env.VITE_SILICONFLOW_API_KEY,
      apiKeyPrefix: import.meta.env.VITE_SILICONFLOW_API_KEY?.substring(0, 10) + '...',
      baseUrl: import.meta.env.VITE_SILICONFLOW_BASE_URL,
      selectedModel: selectedModel.value,
      messagesCount: fullMessages.length
    })
    
    // 添加超时控制 - 增加到60秒
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API调用超时，请稍后重试')), 60000) // 60秒超时
    })
    
    // 调用硅基流动API
    const apiPromise = callSiliconFlowAPI(fullMessages, selectedModel.value)
    const response = await Promise.race([apiPromise, timeoutPromise]) as string
    
    console.log('✅ [DEBUG] SiliconFlow API call successful:', {
      responseType: typeof response,
      responseLength: response?.length || 0,
      responseStart: response?.substring(0, 50) + '...'
    })
    
    if (!response || typeof response !== 'string') {
      throw new Error('API返回了无效的响应格式')
    }
    
    return response
  } catch (error) {
    console.error('❌ [ERROR] 硅基流动API调用失败:', error)
    console.error('❌ [ERROR] Error type:', typeof error)
    console.error('❌ [ERROR] Error constructor:', error?.constructor?.name)
    
    // 优化重试机制 - 支持超时和网络错误重试，最多重试2次
    if (retryCount < 2 && (
      error?.message?.includes('fetch') || 
      error?.message?.includes('网络') || 
      error?.message?.includes('timeout') ||
      error?.message?.includes('超时') ||
      error?.name === 'TypeError' || // 网络错误通常是TypeError
      error?.name === 'AbortError' // 请求被中止
    )) {
      console.log(`🔄 [DEBUG] Retrying API call (attempt ${retryCount + 1}/2) due to error:`, error?.message)
      
      // 根据重试次数增加等待时间：第1次重试等待2秒，第2次重试等待5秒
      const waitTime = retryCount === 0 ? 2000 : 5000
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      return callAiApi(query, paragraph, retryCount + 1)
    }
    
    // 如果重试失败或不符合重试条件，使用备用回复机制
    console.log('🔄 [DEBUG] All retries failed, using fallback response')
    const fallbackResponse = getFallbackResponse(query)
    console.log('✅ [DEBUG] Fallback response generated:', fallbackResponse.substring(0, 100) + '...')
    
    return fallbackResponse
  }
}

const loadParagraph = async () => {
  const paragraphId = route.params.id as string
  if (!paragraphId) {
    router.push('/')
    return
  }
  
  try {
    // 从本地JSON文件加载数据
    const response = await fetch('/shanghai_astronomy_museum.json')
    if (!response.ok) {
      throw new Error('无法加载数据文件')
    }
    
    const data: Paragraph[] = await response.json()
    
    // 查找对应ID的段落
    const foundParagraph = data.find(p => p.id === paragraphId)
    
    if (!foundParagraph) {
      throw new Error(`未找到ID为 ${paragraphId} 的段落`)
    }
    
    paragraph.value = foundParagraph
  } catch (error) {
    console.error('加载段落失败:', error)
    // 不要立即跳转，给用户一个错误提示
    paragraph.value = {
      id: paragraphId,
      section: '错误',
      module: '数据加载',
      title: '数据加载失败',
      content: '抱歉，无法加载该段落的内容。请返回主页重新选择。',
      keywords: [],
      fill_blanks: '',
      fill_blanks_answers: [],
      voice_check_phrases: ''
    }
  }
}

// API健康检查
const checkApiHealth = async () => {
  try {
    console.log('🏥 [DEBUG] Checking API health...')
    
    // 首先检查网络连接
    if (!navigator.onLine) {
      console.warn('⚠️ [WARNING] Device is offline')
      apiHealthy.value = false
      return false
    }
    
    const testMessages = [
      { role: 'user', content: 'ping' }
    ]
    
    // 添加超时控制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API健康检查超时')), 10000) // 10秒超时
    })
    
    const apiPromise = callSiliconFlowAPI(testMessages, selectedModel.value)
    const response = await Promise.race([apiPromise, timeoutPromise])
    
    console.log('✅ [DEBUG] API health check passed')
    apiHealthy.value = true
    return true
  } catch (error) {
    console.warn('⚠️ [WARNING] API health check failed:', error)
    
    // 根据错误类型设置不同的健康状态
    if (error?.name === 'NetworkError' || error?.message?.includes('网络')) {
      console.warn('🌐 [WARNING] Network-related API health check failure')
    } else if (error?.message?.includes('超时')) {
      console.warn('⏰ [WARNING] Timeout-related API health check failure')
    } else {
      console.warn('❓ [WARNING] Unknown API health check failure')
    }
    
    apiHealthy.value = false
    return false
  }
}

// 重新检查API健康状态（增强版）
const recheckApiHealth = async () => {
  isRecheckingApi.value = true
  
  // 先进行网络连通性测试
  console.log('🔍 [DEBUG] Starting network connectivity test...')
  
  try {
    // 测试基本网络连接
    const networkTest = await fetch('https://httpbin.org/get', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    })
    
    if (networkTest.ok) {
      console.log('✅ [DEBUG] Basic network connectivity: OK')
    } else {
      console.warn('⚠️ [WARNING] Basic network test failed with status:', networkTest.status)
    }
  } catch (networkError) {
    console.error('❌ [ERROR] Basic network connectivity test failed:', networkError)
  }
  
  // 测试硅基流动服务器连通性
  try {
    const siliconFlowTest = await fetch('https://api.siliconflow.cn', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    })
    console.log('🔍 [DEBUG] SiliconFlow server connectivity test:', siliconFlowTest.status)
  } catch (siliconFlowError) {
    console.error('❌ [ERROR] SiliconFlow server connectivity test failed:', siliconFlowError)
  }
  
  const isHealthy = await checkApiHealth()
  isRecheckingApi.value = false
  
  if (isHealthy) {
    console.log('✅ [DEBUG] API recheck successful')
  } else {
    console.log('❌ [DEBUG] API recheck still failing')
  }
}

// 移动端优化
let viewportCleanup: (() => void) | null = null

// 初始化移动端优化
const initMobileOptimizations = () => {
  if (isMobileDevice()) {
    // 防止双击缩放
    preventDoubleClickZoom(document.body)
    
    // 监听视口变化（键盘弹出/收起）
    viewportCleanup = onViewportChange((height) => {
      // 当键盘弹出时，调整聊天区域高度
      const chatContainer = document.querySelector('.overflow-y-auto')
      if (chatContainer) {
        const headerHeight = 120 // 大概的头部高度
        const inputHeight = 80 // 大概的输入区域高度
        const availableHeight = height - headerHeight - inputHeight
        ;(chatContainer as HTMLElement).style.maxHeight = `${availableHeight}px`
      }
    })
  }
}

// 组件挂载
onMounted(async () => {
  await loadParagraph()
  initMobileOptimizations()
  
  // 在后台检查API健康状态
  setTimeout(() => {
    checkApiHealth()
  }, 2000)
})

// 组件卸载
onUnmounted(() => {
  if (viewportCleanup) {
    viewportCleanup()
  }
})
</script>
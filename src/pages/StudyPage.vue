<template>
  <div class="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900 relative">
    <!-- 移动端菜单按钮 -->
    <button
      @click="toggleMobileMenu"
      class="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md text-gray-700 hover:text-primary-600 transition-colors shadow-light"
    >
      <Menu v-if="!showMobileMenu" class="w-5 h-5" />
      <X v-else class="w-5 h-5" />
    </button>

    <!-- 左侧导航面板 -->
    <div :class="[
      'bg-white/90 backdrop-blur-sm border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out shadow-light',
      'md:w-80 md:relative md:translate-x-0',
      'fixed inset-y-0 left-0 w-80 z-40',
      showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]">
      <!-- 用户信息区域 -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <User class="w-4 h-4 text-white" />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ userEmail }}</p>
              <p class="text-xs text-gray-600">讲解员</p>
            </div>
          </div>
          <div class="flex items-center space-x-1">
            <button 
              @click="goToWelcome" 
              class="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="返回欢迎页"
            >
              <Home class="w-4 h-4 text-gray-500" />
            </button>
            <button 
              @click="handleSignOut" 
              class="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="退出登录"
            >
              <LogOut class="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <!-- 导航内容 -->
      <div class="flex-1 overflow-y-auto p-4">
        <nav class="space-y-2">
          <div v-for="section in sections" :key="section.name" class="mb-4">
            <!-- 展区标题 -->
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-gray-900 font-medium text-sm uppercase tracking-wide">
                {{ section.name }}
              </h3>
              <ChevronDown 
                :class="['w-4 h-4 text-gray-500 transition-transform cursor-pointer', 
                         section.expanded ? 'rotate-180' : '']"
                @click="toggleSection(section)"
              />
            </div>
            
            <!-- 模块和段落列表 -->
            <div v-show="section.expanded" class="space-y-1 ml-2">
              <div v-for="module in section.modules" :key="module.name" class="mb-3">
                <!-- 模块标题 -->
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-gray-700 font-medium text-xs uppercase tracking-wide px-2">
                    {{ module.name }}
                  </h4>
                  <ChevronDown 
                    :class="['w-3 h-3 text-gray-400 transition-transform cursor-pointer', 
                             module.expanded ? 'rotate-180' : '']"
                    @click="toggleModule(module)"
                  />
                </div>
                
                <!-- 段落列表 -->
                <div v-show="module.expanded" class="space-y-1 ml-3">
                  <button
                    v-for="paragraph in module.paragraphs"
                    :key="paragraph.id"
                    @click="selectParagraph(paragraph)"
                    :class="[
                      'w-full text-left px-3 py-2 rounded-md text-sm transition-all',
                      'border-l-3 border-transparent',
                      selectedParagraph?.id === paragraph.id
                        ? 'text-primary-600 bg-primary-50 border-l-primary-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    ]"
                  >
                    {{ paragraph.title }}
                    <!-- 进度指示器 -->
                    <div class="mt-1 flex items-center space-x-1">
                      <div class="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-primary-500 transition-all duration-300"
                          :style="{ width: `${getProgress(paragraph.id)}%` }"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-400">{{ getProgress(paragraph.id) }}%</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>

    <!-- 移动端遮罩层 -->
    <div 
      v-if="showMobileMenu" 
      @click="showMobileMenu = false"
      class="md:hidden fixed inset-0 bg-black/50 z-30"
    ></div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col relative md:ml-0" :class="{ 'ml-0': !showMobileMenu }">
      <!-- 内容展示区 -->
      <div class="flex-1 overflow-y-auto p-4 md:p-8 mt-16 md:mt-0" :style="{ paddingBottom: selectedParagraph ? '120px' : '32px' }">
        <div v-if="selectedParagraph" class="max-w-4xl mx-auto">
          <!-- 标题和元信息 -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              {{ selectedParagraph.title }}
            </h1>
            <div class="flex items-center space-x-4 text-sm text-gray-600">
              <span>练习次数: {{ getPracticeCount(selectedParagraph.id) }}</span>
              <span>掌握度: {{ getProgress(selectedParagraph.id) }}%</span>
            </div>
          </div>

          <!-- 内容展示 -->
          <div class="bg-white rounded-lg p-6 mb-8 shadow-light border border-gray-200">
            <div class="prose max-w-none">
              <div class="text-gray-900 leading-relaxed whitespace-pre-wrap">{{ selectedParagraph.content }}</div>
            </div>
          </div>


        </div>
        
        <!-- 空状态 -->
        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center">
            <BookOpen class="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500 text-lg">请选择一个段落开始学习</p>
          </div>
        </div>
      </div>

      <!-- 固定底部操作按钮 -->
      <div v-if="selectedParagraph" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-white/95 backdrop-blur-sm border-t border-gray-200 p-4 md:p-6 shadow-heavy">
        <div class="max-w-4xl mx-auto">
          <div class="flex flex-col md:flex-row items-center justify-center space-y-3 md:space-y-0 md:space-x-4">
            <!-- 天文馆AI讲解员按钮 -->
            <button
              @click="openAiChat"
              class="w-full md:w-auto px-4 md:px-6 py-3 bg-white border border-primary-500 text-primary-600 rounded-md hover:bg-primary-50 transition-colors font-medium text-sm md:text-base flex items-center justify-center gap-2 shadow-light"
            >
              <MessageCircle class="w-4 h-4 md:w-5 md:h-5" />
              天文馆AI讲解员
            </button>
            
            <!-- 开始填空训练按钮 -->
            <button
              @click="startFillBlankTraining"
              class="w-full md:w-auto px-4 md:px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-md font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-medium hover:shadow-heavy transform hover:-translate-y-1 flex items-center justify-center gap-2 text-sm md:text-base"
            >开始填空训练</button>
            
            <!-- 复述训练功能 -->
            <button
              @click="startParaphraseTraining"
              class="w-full md:w-auto px-4 md:px-6 py-3 bg-white border border-primary-500 text-primary-600 rounded-md hover:bg-primary-50 transition-colors font-medium text-sm md:text-base flex items-center justify-center gap-2 shadow-light"
            >
              <Mic class="w-4 h-4" />
              复述训练
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  User, LogOut, ChevronDown, BookOpen, MessageCircle, Menu, X, Home, Mic
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import type { Paragraph } from '@/lib/supabase'
import { TouchGestureHandler, preventDoubleClickZoom, addSafeAreaSupport, isMobileDevice } from '@/utils/touch'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const sections = ref<Array<{
  name: string;
  expanded: boolean;
  modules: Array<{
    name: string;
    expanded: boolean;
    paragraphs: Paragraph[];
  }>;
}>>([])
const selectedParagraph = ref<Paragraph | null>(null)
const userProgress = ref<Record<string, { mastery_level: number; practice_count: number }>>({})
const showMobileMenu = ref(false)

// 计算属性
const userEmail = computed(() => {
  return authStore.user?.email || '未知用户'
})

// 方法
const toggleSection = (section: any) => {
  section.expanded = !section.expanded
}

const toggleModule = (module: any) => {
  module.expanded = !module.expanded
}

const selectParagraph = (paragraph: Paragraph) => {
  selectedParagraph.value = paragraph
}

const getProgress = (paragraphId: string): number => {
  return userProgress.value[paragraphId]?.mastery_level || 0
}

const getPracticeCount = (paragraphId: string): number => {
  return userProgress.value[paragraphId]?.practice_count || 0
}

const startFillBlankTraining = () => {
  if (selectedParagraph.value) {
    router.push(`/training/${selectedParagraph.value.id}`)
  }
}

const startParaphraseTraining = () => {
  if (selectedParagraph.value) {
    router.push(`/paraphrase/${selectedParagraph.value.id}`)
  }
}

const openAiChat = () => {
  if (selectedParagraph.value) {
    router.push(`/ai-chat/${selectedParagraph.value.id}`)
  }
}

const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/login')
}

const goToWelcome = () => {
  router.push('/')
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

// 触摸手势处理
let touchHandler: TouchGestureHandler | null = null

// 初始化移动端优化
const initMobileOptimizations = () => {
  if (isMobileDevice()) {
    // 添加安全区域支持
    addSafeAreaSupport()
    
    // 防止双击缩放
    preventDoubleClickZoom(document.body)
    
    // 添加触摸手势支持
    touchHandler = new TouchGestureHandler(document.body, {
      threshold: 80,
      onSwipeRight: () => {
        if (!showMobileMenu.value) {
          showMobileMenu.value = true
        }
      },
      onSwipeLeft: () => {
        if (showMobileMenu.value) {
          showMobileMenu.value = false
        }
      }
    })
  }
}

// 加载数据
const loadParagraphs = async () => {
  try {
    // 从本地JSON文件加载数据
    const response = await fetch('/shanghai_astronomy_museum.json')
    const paragraphsData = await response.json()
    
    // 从Markdown文件加载原文内容
    const markdownResponse = await fetch('/讲解逐字稿.md')
    const markdownContent = await markdownResponse.text()
    
    // 解析Markdown内容，创建段落映射
    const markdownSections = parseMarkdownContent(markdownContent)
    
    // 按展区和模块分组并合并原文内容
    const groupedData = paragraphsData.reduce((acc: Record<string, Record<string, any[]>>, paragraph: any) => {
      if (!acc[paragraph.section]) {
        acc[paragraph.section] = {}
      }
      if (!acc[paragraph.section][paragraph.module]) {
        acc[paragraph.section][paragraph.module] = []
      }
      
      // 查找对应的原文内容
      const originalContent = findOriginalContent(markdownSections, paragraph.section, paragraph.title)
      
      acc[paragraph.section][paragraph.module].push({
        ...paragraph,
        content: originalContent || paragraph.content // 优先使用原文，否则使用JSON中的内容
      })
      return acc
    }, {})

    // 转换为sections格式
    sections.value = Object.entries(groupedData).map(([sectionName, modules]) => ({
      name: sectionName,
      expanded: true,
      modules: Object.entries(modules).map(([moduleName, paragraphs]) => ({
        name: moduleName,
        expanded: true,
        paragraphs
      }))
    }))

    // 默认选择第一个段落
    if (sections.value.length > 0 && sections.value[0].modules.length > 0 && sections.value[0].modules[0].paragraphs.length > 0) {
      selectedParagraph.value = sections.value[0].modules[0].paragraphs[0]
    }
  } catch (error) {
    console.error('加载段落数据失败:', error)
  }
}

const loadUserProgress = async () => {
  if (!authStore.user) return

  try {
    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('paragraph_id, mastery_level, practice_count')
      .eq('user_id', authStore.user.id)

    if (error) throw error

    // 转换为字典格式
    userProgress.value = progress?.reduce((acc, item) => {
      acc[item.paragraph_id] = {
        mastery_level: item.mastery_level,
        practice_count: item.practice_count
      }
      return acc
    }, {} as Record<string, { mastery_level: number; practice_count: number }>) || {}
  } catch (error) {
    console.error('加载用户进度失败:', error)
  }
}

// 解析Markdown内容
const parseMarkdownContent = (content: string) => {
  const sections: Record<string, Record<string, string>> = {}
  const lines = content.split('\n')
  let currentSection = ''
  let currentSubtitle = ''
  let currentContent = ''
  
  for (const line of lines) {
    if (line.trim() === '') {
      if (currentContent.trim()) {
        currentContent += '\n'
      }
      continue
    }
    
    // 检查是否是主标题（展区）
    if (line.match(/^[^#\s].*展区$/) || line === '上海天文馆简介') {
      // 保存之前的内容
      if (currentSection && currentSubtitle && currentContent.trim()) {
        if (!sections[currentSection]) sections[currentSection] = {}
        sections[currentSection][currentSubtitle] = currentContent.trim()
      }
      
      currentSection = line.trim()
      currentSubtitle = ''
      currentContent = ''
    }
    // 检查是否是子标题
    else if (line.match(/^[^\s]/) && !line.includes('：') && currentSection) {
      // 保存之前的内容
      if (currentSubtitle && currentContent.trim()) {
        if (!sections[currentSection]) sections[currentSection] = {}
        sections[currentSection][currentSubtitle] = currentContent.trim()
      }
      
      currentSubtitle = line.trim()
      currentContent = ''
    }
    // 内容行
    else if (currentSection) {
      currentContent += line + '\n'
    }
  }
  
  // 保存最后一段内容
  if (currentSection && currentSubtitle && currentContent.trim()) {
    if (!sections[currentSection]) sections[currentSection] = {}
    sections[currentSection][currentSubtitle] = currentContent.trim()
  }
  
  return sections
}

// 查找原文内容
const findOriginalContent = (markdownSections: Record<string, Record<string, string>>, section: string, title: string) => {
  if (!markdownSections[section]) return null
  
  // 尝试直接匹配标题
  if (markdownSections[section][title]) {
    return markdownSections[section][title]
  }
  
  // 尝试模糊匹配
  for (const [key, content] of Object.entries(markdownSections[section])) {
    if (key.includes(title) || title.includes(key)) {
      return content
    }
  }
  
  return null
}

// 组件挂载
onMounted(async () => {
  await loadParagraphs()
  await loadUserProgress()
  initMobileOptimizations()
})

// 组件卸载
onUnmounted(() => {
  if (touchHandler) {
    touchHandler.destroy(document.body)
  }
})
</script>

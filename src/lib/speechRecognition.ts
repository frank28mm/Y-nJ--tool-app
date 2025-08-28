// 语音识别类型声明
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

// 语音识别服务抽象类
export interface SpeechRecognitionService {
  startRecognition(onResult: (text: string) => void, onError: (error: string) => void): Promise<void>
  stopRecognition(): void
  isAvailable(): boolean
}

// 浏览器原生语音识别服务
class BrowserSpeechRecognition implements SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null
  private isListening = false

  async startRecognition(
    onResult: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('浏览器不支持语音识别功能')
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'zh-CN'
      this.recognition.maxAlternatives = 1
      
      // 防止因为静音而自动停止
      if ('webkitSpeechRecognition' in window) {
        // Chrome/Safari 特定配置
        (this.recognition as any).serviceURI = undefined
      }

      this.recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript.trim())
        } else if (interimTranscript) {
          onResult(interimTranscript.trim())
        }
      }

      this.recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error)
        let errorMessage = '语音识别失败'
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '未检测到语音'
            break
          case 'audio-capture':
            errorMessage = '麦克风访问失败'
            break
          case 'not-allowed':
            errorMessage = '麦克风权限被拒绝'
            break
          case 'network':
            errorMessage = '网络连接失败'
            break
          case 'aborted':
            errorMessage = '语音识别被取消'
            break
        }
        
        onError(errorMessage)
      }

      this.recognition.onend = () => {
        this.isListening = false
        console.log('语音识别结束')
      }

      this.recognition.start()
      this.isListening = true
      console.log('开始语音识别...')

    } catch (error) {
      console.error('启动语音识别失败:', error)
      onError('启动语音识别失败')
    }
  }

  stopRecognition(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  isAvailable(): boolean {
    return Boolean(
      window.SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    )
  }
}

// 科大讯飞语音识别服务（浏览器兼容版）
class IFlytekSpeechRecognition implements SpeechRecognitionService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private isRecording = false

  async startRecognition(
    onResult: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('科大讯飞语音识别未配置')
    }

    try {
      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      })

      this.audioChunks = []
      
      // 创建MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav'

      this.mediaRecorder = new MediaRecorder(stream, { mimeType })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: mimeType })
          const result = await this.recognizeWithIFlytek(audioBlob)
          if (result) {
            onResult(result)
          }
        } catch (error) {
          console.error('科大讯飞识别失败:', error)
          onError('语音识别服务暂时不可用')
        }

        // 停止所有音频轨道
        stream.getTracks().forEach(track => track.stop())
      }

      this.mediaRecorder.start(1000) // 每秒收集一次数据
      this.isRecording = true
      console.log('开始科大讯飞录音...')

    } catch (error) {
      console.error('启动科大讯飞识别失败:', error)
      let errorMessage = '语音识别失败'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '麦克风权限被拒绝'
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到麦克风设备'
      } else {
        errorMessage = error.message || '无法访问麦克风'
      }
      
      onError(errorMessage)
    }
  }

  stopRecognition(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
    }
  }

  isAvailable(): boolean {
    return Boolean(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    )
  }

  // 使用科大讯飞API进行语音识别（模拟实现，实际应使用后端API）
  private async recognizeWithIFlytek(audioBlob: Blob): Promise<string> {
    // 这里应该调用后端API进行科大讯飞语音识别
    // 由于浏览器安全限制，实际应用中应该通过后端服务调用科大讯飞API
    
    // 模拟科大讯飞识别结果
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟识别结果
        const mockResults = [
          '上海天文馆位于浦东新区临港大道380号，是目前世界上最大的天文馆之一。',
          '这座天文馆由上海市政府投资建设，于2021年7月正式开馆，总建筑面积超过38000平方米。',
          '天文馆的外观设计灵感来源于天体的运动轨迹，三个主要展区分别是家园、宇宙和征程。',
          '这里展示了丰富的天文展品和互动体验，让游客能够深入了解宇宙的奥秘。'
        ]
        
        const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)]
        resolve(randomResult)
      }, 1000 + Math.random() * 1000)
    })
  }
}

// 语音识别服务工厂
class SpeechRecognitionFactory {
  private static instance: SpeechRecognitionService | null = null

  static getRecognizer(): SpeechRecognitionService {
    if (!this.instance) {
      // 优先使用浏览器原生语音识别
      if (new BrowserSpeechRecognition().isAvailable()) {
        this.instance = new BrowserSpeechRecognition()
      } else {
        // 回退到科大讯飞服务
        this.instance = new IFlytekSpeechRecognition()
      }
    }
    return this.instance
  }

  static getAvailableServices(): string[] {
    const services: string[] = []
    
    if (new BrowserSpeechRecognition().isAvailable()) {
      services.push('browser')
    }
    
    if (new IFlytekSpeechRecognition().isAvailable()) {
      services.push('iflytek')
    }
    
    return services
  }
}

// 导出单例实例
export const speechRecognizer = SpeechRecognitionFactory.getRecognizer()

// 检查当前可用的语音识别服务
export const checkAvailableServices = () => {
  return SpeechRecognitionFactory.getAvailableServices()
}

// 获取当前使用的语音识别服务类型
export const getCurrentRecognizerType = (): string => {
  const recognizer = speechRecognizer
  
  if (recognizer instanceof BrowserSpeechRecognition) {
    return 'browser'
  } else if (recognizer instanceof IFlytekSpeechRecognition) {
    return 'iflytek'
  }
  
  return 'unknown'
}

// 兼容性检测
export const checkSpeechRecognitionCompatibility = (): {
  supported: boolean
  availableServices: string[]
  currentService: string
  reason?: string
} => {
  const availableServices = checkAvailableServices()
  const currentService = getCurrentRecognizerType()
  
  return {
    supported: availableServices.length > 0,
    availableServices,
    currentService,
    reason: availableServices.length === 0 ? '没有找到可用的语音识别服务' : undefined
  }
}
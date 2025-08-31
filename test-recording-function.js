// 录音功能测试脚本
// 在浏览器控制台中运行此脚本来测试录音功能

console.log('🎤 开始录音功能测试...');

// 测试1: 检查浏览器支持
function testBrowserSupport() {
  console.log('\n📋 测试1: 浏览器支持检查');
  
  const hasWebSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasMediaRecorder = !!window.MediaRecorder;
  
  console.log('- Web Speech API:', hasWebSpeech ? '✅ 支持' : '❌ 不支持');
  console.log('- MediaDevices API:', hasMediaDevices ? '✅ 支持' : '❌ 不支持');
  console.log('- MediaRecorder API:', hasMediaRecorder ? '✅ 支持' : '❌ 不支持');
  
  return hasWebSpeech && hasMediaDevices && hasMediaRecorder;
}

// 测试2: 检查麦克风权限
async function testMicrophonePermission() {
  console.log('\n🎙️ 测试2: 麦克风权限检查');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('✅ 麦克风权限已授予');
    
    // 停止音频轨道
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.log('❌ 麦克风权限被拒绝:', error.message);
    
    if (error.name === 'NotAllowedError') {
      console.log('💡 解决方案: 点击地址栏的锁形图标，允许麦克风权限');
    } else if (error.name === 'NotFoundError') {
      console.log('💡 解决方案: 检查麦克风设备是否正常连接');
    }
    
    return false;
  }
}

// 测试3: 测试语音识别
function testSpeechRecognition() {
  console.log('\n🗣️ 测试3: 语音识别功能');
  
  return new Promise((resolve) => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'zh-CN';
      
      recognition.onstart = () => {
        console.log('✅ 语音识别已启动，请说话...');
      };
      
      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        console.log('✅ 识别结果:', result);
        resolve(true);
      };
      
      recognition.onerror = (event) => {
        console.log('❌ 语音识别错误:', event.error);
        resolve(false);
      };
      
      recognition.onend = () => {
        console.log('🔚 语音识别结束');
      };
      
      recognition.start();
      
      // 10秒后自动停止
      setTimeout(() => {
        recognition.stop();
        console.log('⏰ 测试超时，自动停止');
        resolve(false);
      }, 10000);
      
    } catch (error) {
      console.log('❌ 语音识别初始化失败:', error.message);
      resolve(false);
    }
  });
}

// 测试4: 检查HTTPS环境
function testHTTPS() {
  console.log('\n🔒 测试4: HTTPS环境检查');
  
  const isHTTPS = location.protocol === 'https:';
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  
  console.log('- 当前协议:', location.protocol);
  console.log('- 当前域名:', location.hostname);
  
  if (isHTTPS || isLocalhost) {
    console.log('✅ 环境安全，支持麦克风访问');
    return true;
  } else {
    console.log('❌ 非安全环境，可能无法访问麦克风');
    console.log('💡 解决方案: 使用HTTPS或localhost访问');
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始完整的录音功能测试\n');
  
  const results = {
    browserSupport: testBrowserSupport(),
    httpsEnvironment: testHTTPS(),
    microphonePermission: await testMicrophonePermission(),
    speechRecognition: false
  };
  
  if (results.browserSupport && results.microphonePermission) {
    console.log('\n🎯 基础测试通过，开始语音识别测试...');
    console.log('请在接下来的10秒内对着麦克风说话');
    results.speechRecognition = await testSpeechRecognition();
  }
  
  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  console.log('- 浏览器支持:', results.browserSupport ? '✅' : '❌');
  console.log('- HTTPS环境:', results.httpsEnvironment ? '✅' : '❌');
  console.log('- 麦克风权限:', results.microphonePermission ? '✅' : '❌');
  console.log('- 语音识别:', results.speechRecognition ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 所有测试通过！录音功能应该正常工作。');
  } else {
    console.log('\n⚠️ 部分测试失败，录音功能可能存在问题。');
    console.log('请根据上述测试结果进行相应的修复。');
  }
  
  return results;
}

// 导出测试函数
if (typeof window !== 'undefined') {
  window.testRecordingFunction = runAllTests;
  console.log('\n💡 使用方法: 在控制台输入 testRecordingFunction() 开始测试');
} else {
  // Node.js环境
  module.exports = { runAllTests, testBrowserSupport, testMicrophonePermission, testSpeechRecognition, testHTTPS };
}
// AI评估功能测试脚本
// 测试修复后的智能评估逻辑

// 模拟测试数据
const testCases = [
  {
    name: '空内容测试',
    originalText: '这是一段关于天文学的介绍文本，包含了丰富的科学知识和专业术语。',
    transcribedText: '',
    expectedQuality: 'low'
  },
  {
    name: '过短内容测试',
    originalText: '这是一段关于天文学的介绍文本，包含了丰富的科学知识和专业术语。',
    transcribedText: '天文学',
    expectedQuality: 'low'
  },
  {
    name: '重复内容测试',
    originalText: '这是一段关于天文学的介绍文本，包含了丰富的科学知识和专业术语。',
    transcribedText: '天文学 天文学 天文学 天文学 天文学 天文学',
    expectedQuality: 'low'
  },
  {
    name: '正常质量测试',
    originalText: '这是一段关于天文学的介绍文本，包含了丰富的科学知识和专业术语。',
    transcribedText: '这是关于天文学的内容，里面有很多科学知识和术语。',
    expectedQuality: 'good'
  },
  {
    name: '高质量测试',
    originalText: '这是一段关于天文学的介绍文本，包含了丰富的科学知识和专业术语。',
    transcribedText: '这是一段关于天文学的介绍文本，包含了丰富的科学知识和专业术语。',
    expectedQuality: 'excellent'
  }
];

// 从ParaphrasePage.vue复制的评估函数（简化版本用于测试）
function analyzeTranscriptionQuality(text) {
  const trimmedText = text.trim();
  const wordCount = trimmedText.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = trimmedText.length;
  
  const analysis = {
    isEmpty: charCount === 0,
    isTooShort: charCount < 10 || wordCount < 3,
    isRepeated: false,
    isDisproportionate: false,
    wordCount,
    charCount,
    qualityScore: 0,
    issues: []
  };
  
  // 检查是否为空
  if (analysis.isEmpty) {
    analysis.issues.push('转录内容为空');
    return analysis;
  }
  
  // 检查是否过短
  if (analysis.isTooShort) {
    analysis.issues.push('转录内容过短，可能录音不完整或识别失败');
  }
  
  // 检查重复内容
  const words = trimmedText.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 5 && uniqueWords.size / words.length < 0.5) {
    analysis.isRepeated = true;
    analysis.issues.push('内容存在大量重复，可能是识别错误');
  }
  
  // 计算质量分数
  let qualityScore = 100;
  if (analysis.isEmpty) qualityScore = 0;
  else if (analysis.isTooShort) qualityScore = Math.max(20, qualityScore - 60);
  if (analysis.isRepeated) qualityScore = Math.max(10, qualityScore - 40);
  
  analysis.qualityScore = qualityScore;
  
  return analysis;
}

function calculateJaccardSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  // 文本预处理：转小写，分词，去除标点
  const processText = (text) => {
    return new Set(
      text.toLowerCase()
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 保留中文、英文、数字和空格
        .split(/\s+/)
        .filter(word => word.length > 0)
    );
  };
  
  const set1 = processText(text1);
  const set2 = processText(text2);
  
  if (set1.size === 0 || set2.size === 0) return 0;
  
  // 计算交集
  const intersection = new Set([...set1].filter(word => set2.has(word)));
  
  // 计算并集
  const union = new Set([...set1, ...set2]);
  
  // Jaccard相似度 = |交集| / |并集|
  return intersection.size / union.size;
}

function generateIntelligentEvaluation(originalText, transcribedText) {
  const similarity = calculateJaccardSimilarity(originalText, transcribedText);
  const qualityAnalysis = analyzeTranscriptionQuality(transcribedText);
  
  // 基于相似度和质量分析计算各维度分数
  let accuracyScore = Math.round(similarity * 100);
  let completenessScore = Math.round(Math.min(95, (transcribedText.length / originalText.length) * 80 + similarity * 20));
  let clarityScore = Math.round(qualityAnalysis.qualityScore * 0.8 + similarity * 20);
  let presentationScore = Math.round(qualityAnalysis.qualityScore * 0.6 + similarity * 40);
  
  // 应用质量惩罚
  const qualityPenalty = (100 - qualityAnalysis.qualityScore) * 0.01;
  accuracyScore = Math.max(0, Math.round(accuracyScore * (1 - qualityPenalty)));
  completenessScore = Math.max(0, Math.round(completenessScore * (1 - qualityPenalty)));
  clarityScore = Math.max(0, Math.round(clarityScore * (1 - qualityPenalty)));
  presentationScore = Math.max(0, Math.round(presentationScore * (1 - qualityPenalty)));
  
  // 计算综合分数
  const overallScore = Math.round(
    accuracyScore * 0.4 + 
    completenessScore * 0.25 + 
    clarityScore * 0.2 + 
    presentationScore * 0.15
  );
  
  return {
    score: overallScore,
    accuracy_score: accuracyScore,
    completeness_score: completenessScore,
    clarity_score: clarityScore,
    presentation_score: presentationScore,
    similarity: similarity,
    qualityAnalysis: qualityAnalysis
  };
}

// 运行测试
console.log('=== AI评估功能测试开始 ===\n');

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}: ${testCase.name}`);
  console.log(`原文: ${testCase.originalText}`);
  console.log(`转录: "${testCase.transcribedText}"`);
  
  const evaluation = generateIntelligentEvaluation(testCase.originalText, testCase.transcribedText);
  
  console.log(`结果:`);
  console.log(`  综合分数: ${evaluation.score}`);
  console.log(`  准确性: ${evaluation.accuracy_score}`);
  console.log(`  完整性: ${evaluation.completeness_score}`);
  console.log(`  清晰度: ${evaluation.clarity_score}`);
  console.log(`  表达: ${evaluation.presentation_score}`);
  console.log(`  相似度: ${(evaluation.similarity * 100).toFixed(2)}%`);
  console.log(`  质量分数: ${evaluation.qualityAnalysis.qualityScore}`);
  console.log(`  质量问题: ${evaluation.qualityAnalysis.issues.
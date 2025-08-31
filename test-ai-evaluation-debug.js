// AI评估功能调试测试脚本

const API_KEY = 'sk-kxbohharbychjlfrsyjyssjaqljnavahltwgjodthywuixzx';
const BASE_URL = 'https://api.siliconflow.cn/v1';
const MODEL = 'Pro/moonshotai/Kimi-K2-Instruct';

// 测试AI评估API调用
async function testAIEvaluation() {
  console.log('🔍 开始测试AI评估API调用...');
  
  const originalContent = `上海天文馆是世界上最大的天文馆之一，位于上海市浦东新区临港新城。该馆于2021年7月正式开馆，建筑面积约3.8万平方米。天文馆的设计灵感来源于天体运行轨道，整个建筑没有直角，体现了宇宙的无限和流动。`;
  
  const paraphrasedContent = `测试内容`; // 故意使用质量很差的复述
  
  const prompt = `请作为专业的天文馆讲解员评估员，对以下复述内容进行专业评估。

原文内容：
${originalContent}

复述内容：
${paraphrasedContent}

## 评估标准

请从以下维度进行专业评估：

### 1. 信息准确性 (40分)
- 关键事实的正确性
- 数据准确性
- 概念理解的正确性
- 时间顺序的准确性

### 2. 完整性 (25分)
- 核心信息的涵盖程度
- 重要细节的保留
- 逻辑结构的完整性
- 关键概念的完整性

### 3. 表达清晰度 (20分)
- 语言流畅性
- 逻辑连贯性
- 专业术语使用恰当性
- 观众理解度

### 4. 讲解技巧 (15分)
- 引人入胜的程度
- 互动性元素
- 情感表达
- 记忆点设计

## 评估要求

请提供详细的评估报告，包括：

1. **综合评分** (0-100分)
2. **各维度评分** (信息准确性、完整性、表达清晰度、讲解技巧)
3. **复述的主要优点** (至少3条)
4. **具体改进建议** (针对每个不足提供具体改进方案)
5. **关键词汇建议** (建议使用的天文专业术语)
6. **讲解技巧建议** (如何更好地吸引观众)
7. **总体评价** (总结性评价)

## 严格评分标准

**重要提醒：请严格按照以下标准评分，不要过于宽松！**

- 90-100分：优秀，几乎完美复述，信息准确完整，表达流畅专业
- 80-89分：良好，基本准确但有小瑕疵，整体质量较高
- 70-79分：中等，有明显不足但基本可用，需要改进
- 60-69分：及格，存在较多问题，勉强达标
- 40-59分：不及格，严重缺陷，需要重新学习
- 0-39分：极差，完全不符合要求或无意义内容

**特别注意：**
- 如果复述内容与原文严重不符，应给予40分以下
- 如果复述内容过短、不完整或无意义，应给予30分以下
- 如果复述内容完全错误或空洞，应给予20分以下
- 只有真正高质量的复述才能获得80分以上

请以JSON格式返回，严格按照实际质量评分：
{
  "score": 实际评分(请根据复述质量严格评分),
  "accuracy_score": 信息准确性得分,
  "completeness_score": 完整性得分,
  "clarity_score": 表达清晰度得分,
  "presentation_score": 讲解技巧得分,
  "strengths": [
    "列出真实存在的优点，如果没有明显优点请如实说明"
  ],
  "improvements": [
    {
      "issue": "具体指出的问题",
      "suggestion": "针对性的改进建议"
    }
  ],
  "key_terms": ["相关的专业术语"],
  "presentation_tips": [
    "实用的讲解技巧建议"
  ],
  "overall_feedback": "基于实际表现的客观评价，不要过于鼓励性"
}`;

  try {
    console.log('📤 发送API请求...');
    console.log('原文内容:', originalContent);
    console.log('复述内容:', paraphrasedContent);
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一个严格的天文馆讲解员培训专家，具有以下特点：

1. **专业背景**：拥有天文学教育背景和多年讲解员培训经验
2. **评估标准**：严格执行讲解员复述评估标准，绝不放水
3. **客观公正**：基于实际表现给分，不受情感因素影响
4. **严格要求**：对质量差的复述毫不留情，该给低分就给低分
5. **专业判断**：能够准确识别复述内容的质量差异

**评估原则：**
- 严格按照评分标准执行，不要过于宽松
- 质量差的复述必须给予相应的低分（40分以下）
- 不完整、错误或无意义的复述应给予30分以下
- 只有真正优秀的复述才能获得80分以上
- 客观评价，不要过度鼓励

请严格按照专业标准进行评估，确保评分准确反映复述质量。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    console.log('📥 AI原始响应:');
    console.log(aiResponse);
    
    // 尝试解析JSON
    let evaluationData;
    try {
      evaluationData = JSON.parse(aiResponse);
      console.log('✅ JSON解析成功:');
      console.log('评分:', evaluationData.score);
      console.log('各维度评分:', {
        accuracy: evaluationData.accuracy_score,
        completeness: evaluationData.completeness_score,
        clarity: evaluationData.clarity_score,
        presentation: evaluationData.presentation_score
      });
      console.log('优点:', evaluationData.strengths);
      console.log('改进建议:', evaluationData.improvements);
      console.log('总体反馈:', evaluationData.overall_feedback);
    } catch (parseError) {
      console.log('❌ JSON解析失败，尝试提取JSON部分');
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          evaluationData = JSON.parse(jsonMatch[0]);
          console.log('✅ 提取JSON成功:');
          console.log('评分:', evaluationData.score);
        } catch (e) {
          console.error('❌ 提取的JSON也无法解析:', e);
          return;
        }
      } else {
        console.error('❌ 无法从响应中找到JSON数据');
        return;
      }
    }
    
    // 验证评分是否合理
    if (evaluationData.score > 40) {
      console.log('⚠️  警告: 对于质量很差的复述（"测试内容"），评分', evaluationData.score, '分可能过高！');
      console.log('💡 期望评分应该在30分以下，因为复述内容完全无意义');
    } else {
      console.log('✅ 评分合理: 对于质量很差的复述，给出了', evaluationData.score, '分的低分');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.message.includes('API请求失败')) {
      console.log('🔧 可能的解决方案:');
      console.log('1. 检查API密钥是否正确');
      console.log('2. 检查网络连接');
      console.log('3. 检查API服务是否可用');
    }
  }
}

// 运行测试
testAIEvaluation();
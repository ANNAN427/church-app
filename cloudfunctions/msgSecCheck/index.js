// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数 - 文字内容安全检测
exports.main = async (event, context) => {
  const { content } = event;
  
  try {
    // 调用微信内容安全 API
    const result = await cloud.openapi.security.msgSecCheck({
      content: content,
      version: '2'
    });
    
    return {
      errCode: result.errCode,
      pass: result.errCode === 0,
      detail: result.detail || []
    };
  } catch (err) {
    console.error('内容安全检测失败:', err);
    // 检测服务异常时默认通过，不影响用户体验
    return {
      errCode: -1,
      errMsg: err.message,
      pass: true
    };
  }
};

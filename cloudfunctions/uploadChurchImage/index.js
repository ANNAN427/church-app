// 图片上传云函数
const cloud = require('wx-server-sdk');

// 管理员账号密码
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'YOUR_ADMIN_PASSWORD_HERE';

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  
  const { username, password, fileID } = event;
  
  console.log('收到图片上传请求:', JSON.stringify({ username, fileID }));
  
  // 验证管理员账号
  if (!username || !password || username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return {
      code: 401,
      msg: '账号或密码错误'
    };
  }
  
  try {
    // 图片 URL 就是 fileID
    return {
      code: 200,
      msg: '上传成功',
      data: {
        image_url: fileID
      }
    };
    
  } catch (err) {
    console.error('图片上传失败:', err);
    return {
      code: 500,
      msg: '上传失败：' + err.message,
      error: err
    };
  }
};

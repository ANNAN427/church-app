// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 云函数入口函数 - 图片内容安全检测
exports.main = async (event, context) => {
  const { fileID } = event;
  
  try {
    // 从云存储下载图片
    const downloadRes = await cloud.downloadFile({ fileID: fileID });
    const fileContent = downloadRes.fileContent;
    
    // 调用微信图片内容安全 API
    const result = await cloud.openapi.security.imgSecCheck({
      media: {
        contentType: 'image/png',
        value: fileContent
      }
    });
    
    // 删除云端临时文件
    try {
      await cloud.deleteFile({ fileList: [fileID] });
    } catch (e) {
      console.error('删除临时文件失败:', e);
    }
    
    return { errCode: result.errCode, pass: result.errCode === 0 };
  } catch (err) {
    console.error('imgSecCheck error:', err);
    // 删除云端临时文件
    if (fileID) {
      try {
        await cloud.deleteFile({ fileList: [fileID] });
      } catch (e) {}
    }
    // 检测服务异常时默认通过，不影响用户体验
    return { errCode: -1, errMsg: err.message, pass: true };
  }
};

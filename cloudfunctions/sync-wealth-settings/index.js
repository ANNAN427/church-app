// 云函数入口文件
// 同步日进斗金设置到数据库
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  console.log('同步财富设置:', openid);
  console.log('event:', JSON.stringify(event));
  
  try {
    const settingsData = {
      notifyEnabled: event.notifyEnabled,
      timeType: event.timeType,
      fixedTime: event.fixedTime,
      dailyAmount: event.dailyAmount,
      // 显式存储 openid，不依赖 _openid 自动填充
      openid: openid,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };
    
    // 检查是否已有记录
    const { data: existingRecords } = await db.collection('wealthSettings')
      .where({ openid: openid })
      .get();
    
    let result;
    if (existingRecords.length > 0) {
      // 更新现有记录
      result = await db.collection('wealthSettings')
        .doc(existingRecords[0]._id)
        .update({
          data: settingsData
        });
      console.log('更新成功:', existingRecords[0]._id);
    } else {
      // 创建新记录
      result = await db.collection('wealthSettings').add({
        data: settingsData
      });
      console.log('创建成功:', result._id);
    }
    
    return {
      success: true,
      message: '设置同步成功',
      result: result
    };
    
  } catch (err) {
    console.error('同步设置失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

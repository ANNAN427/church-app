// 云函数入口文件
// 日进斗金订阅消息推送 - 定时触发
// 由微信云开发定时触发器每分钟调用一次
// v160 - 修复订阅推送问题：时区修复 + 长期订阅支持
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 订阅消息模板ID
// 一次性模板：每次推送需要用户授权
// 如需长期订阅，需在微信后台申请对应的长期订阅模板
const TEMPLATE_ID = '13GmlwKYXuJoL1mNzd2TOFDUxq0AoeurzuAARkMar1k';

// 云函数入口函数 - 定时触发器调用
exports.main = async (event, context) => {
  console.log('=== wealth-notification triggered ===');
  console.log('event:', JSON.stringify(event));
  
  // 修复时区问题：云函数默认UTC，需+8转为北京时间
  const now = new Date();
  const bjOffset = 8 * 60 * 60 * 1000;
  const bjNow = new Date(now.getTime() + bjOffset);
  const currentHour = bjNow.getUTCHours();
  const currentMinute = bjNow.getUTCMinutes();
  const currentTimeStr = padZero(currentHour) + ':' + padZero(currentMinute);
  const todayStr = bjNow.getUTCFullYear() + '-' + padZero(bjNow.getUTCMonth() + 1) + '-' + padZero(bjNow.getUTCDate());
  
  console.log('当前时间(北京):', currentTimeStr, '日期:', todayStr);
  console.log('UTC时间:', padZero(now.getUTCHours()) + ':' + padZero(now.getUTCMinutes()));
  
  try {
    // 查询所有开启了推送的用户设置
    const { data: settingsList } = await db.collection('wealthSettings')
      .where({
        notifyEnabled: true
      })
      .get();
    
    console.log('找到', settingsList.length, '个开启推送的用户');
    
    if (settingsList.length === 0) {
      return { success: true, message: '没有用户需要推送', count: 0 };
    }
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (const setting of settingsList) {
      try {
        const result = await checkAndSend(setting, currentTimeStr, todayStr);
        if (result.sent) {
          sentCount++;
        }
      } catch (err) {
        console.error('用户', setting._openid, '推送失败:', err);
        failedCount++;
      }
    }
    
    return {
      success: true,
      message: '推送完成',
      sentCount: sentCount,
      failedCount: failedCount,
      totalUsers: settingsList.length
    };
    
  } catch (err) {
    console.error('云函数执行失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

// 检查并发送推送
async function checkAndSend(setting, currentTimeStr, todayStr) {
  const openid = setting._openid;
  const timeType = setting.timeType || 'random';
  const fixedTime = setting.fixedTime || '19:00';
  const lastNotifyDate = setting.lastNotifyDate || '';
  const dailyAmount = setting.dailyAmount || '6663';
  
  // 检查 openid 是否有效
  if (!openid || typeof openid !== 'string' || openid.length < 10) {
    console.log('用户 openid 无效:', openid, '，删除该记录');
    await db.collection('wealthSettings').doc(setting._id).remove();
    return { sent: false, reason: 'invalid_openid' };
  }
  
  // 今天已经推送过，跳过
  if (lastNotifyDate === todayStr) {
    console.log('用户', openid, '今天已推送过，跳过');
    return { sent: false, reason: 'already_sent' };
  }
  
  let targetTime = null;
  
  if (timeType === 'fixed') {
    // 固定时间模式 - 检查当前时间是否到达固定时间
    if (currentTimeStr >= fixedTime) {
      targetTime = fixedTime;
    }
  } else {
    // 随机时间模式 - 检查是否有今天的随机时间且已到达
    if (setting.todayRandomTime && setting.todayRandomDate === todayStr) {
      if (currentTimeStr >= setting.todayRandomTime) {
        targetTime = setting.todayRandomTime;
      }
    } else {
      // 还没有生成今天的随机时间，生成一个
      const newRandomTime = generateRandomTime();
      // 更新数据库中的随机时间
      await db.collection('wealthSettings').doc(setting._id).update({
        data: {
          todayRandomTime: newRandomTime,
          todayRandomDate: todayStr
        }
      });
      console.log('用户', openid, '生成今日随机时间:', newRandomTime);
      
      // 如果当前时间已经超过随机时间，立即发送
      if (currentTimeStr >= newRandomTime) {
        targetTime = newRandomTime;
      }
    }
  }
  
  if (!targetTime) {
    return { sent: false, reason: 'time_not_reached' };
  }
  
  // 发送订阅消息
  try {
    await cloud.openapi.subscribeMessage.send({
      touser: openid,
      page: '/subpkg-tools/pages/wealth/wealth',
      data: {
        amount1: {
          value: '¥' + dailyAmount
        },
        time6: {
          value: targetTime
        },
        thing2: {
          value: '日进斗金'
        }
      },
      templateId: TEMPLATE_ID,
      miniprogramState: 'trial'
    });
    
    // 更新最后推送日期
    await db.collection('wealthSettings').doc(setting._id).update({
      data: {
        lastNotifyDate: todayStr,
        lastNotifyTime: targetTime
      }
    });
    
    console.log('用户', openid, '推送成功，时间:', targetTime);
    return { sent: true, openid: openid, time: targetTime };
    
  } catch (err) {
    console.error('发送订阅消息失败:', err);
    console.log('错误码:', err.errCode, 'openid:', openid);
    // 40003 = invalid openid，说明该 openid 不属于当前小程序，删除该记录
    if (err.errCode === 40003) {
      console.log('openid 无效 (40003)，删除记录:', openid);
      try {
        await db.collection('wealthSettings').doc(setting._id).remove();
        console.log('已删除无效记录');
      } catch (delErr) {
        console.error('删除记录失败:', delErr);
      }
      return { sent: false, reason: 'invalid_openid_40003' };
    }
    // 43101 = 用户拒绝，47003 = 无订阅额度
    if (err.errCode === 43101 || err.errCode === 47003) {
      console.log('用户', openid, '未授权或额度不足 (errCode:', err.errCode, ')');
    }
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}

// 生成随机时间 7:00-21:00（北京时间）
function generateRandomTime() {
  const randomMinutes = Math.floor(Math.random() * (1260 - 420 + 1)) + 420;
  const hours = Math.floor(randomMinutes / 60);
  const minutes = randomMinutes % 60;
  return padZero(hours) + ':' + padZero(minutes);
}

function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

// pages/wealth/wealth.js
// v160 - 修复日进斗金到账通知问题
// 1. 声音文件改为 dao-zhang.mp3（之前错误使用 beads.mp3）
// 2. 启动时调用 app.js 全局检查，确保到账通知触发
// 3. 保留页面级定时器作为补充检查
Page({
  data: {
    balance: '100000.00',
    targetAmount: '1000000',
    initAmount: '100000',
    dailyAmount: '6663',
    todayAmount: '0',
    todayTime: '',
    showSettings: false,
    showRitualModal: false,
    timeType: 'random', // fixed 或 random
    fixedTime: '19:00'
  },

  onLoad: function () {
    this.loadWealthData();
    this.startAutoGrowth();
    
    // 每次打开页面时请求订阅授权，积累推送额度（一次性模板每次授权=1次推送机会）
    this.requestSubscribeQuota();
  },

  onUnload: function () {
    // 页面卸载时清除定时器
    if (this.autoGrowthTimer) {
      clearInterval(this.autoGrowthTimer);
    }
  },

  // 启动自动增长检查
  startAutoGrowth: function () {
    // 调用 app.js 全局检查（确保即使不在 wealth 页面也能触发）
    var app = getApp();
    if (app && app.checkWealthNotification) {
      console.log('[Wealth] 调用全局到账检查');
      app.checkWealthNotification();
    }
    
    var that = this;
    
    // 每分钟检查一次（补充检查）
    this.autoGrowthTimer = setInterval(function () {
      that.checkAutoGrowth();
    }, 60000);
  },

  // 检查自动增长
  checkAutoGrowth: function () {
    var wealthData = wx.getStorageSync('wealthData') || {};
    var lastGrowthTime = wealthData.lastGrowthTime || 0;
    var now = new Date();
    var currentTime = now.getTime();
    
    // 检查是否已经增长过今天
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    var hasGrownToday = lastGrowthTime >= todayStart.getTime();
    
    // 如果今天已经增长过，跳过
    if (hasGrownToday) {
      return;
    }
    
    // 检查是否需要增长
    var shouldGrowth = false;
    var growthTime = null;
    
    if (wealthData.timeType === 'fixed') {
      // 固定时间模式 - 到达时间即触发（不再用严格容差）
      var fixedTime = wealthData.fixedTime || '19:00';
      var parts = fixedTime.split(':');
      var targetHour = parseInt(parts[0]);
      var targetMinute = parseInt(parts[1]);
      
      var today = new Date();
      today.setHours(targetHour, targetMinute, 0, 0);
      
      // 如果当前时间已经达到或超过固定时间，即触发
      if (currentTime >= today.getTime()) {
        shouldGrowth = true;
        growthTime = today;
      }
    } else {
      // 随机时间模式 - 每天早上 7:00 到晚上 21:00 之间随机
      var lastGrowthDate = new Date(lastGrowthTime);
      
      // 检查是否已经是新的一天（或者从未增长过）
      var isNewDay = lastGrowthTime === 0 || lastGrowthDate.getDate() !== now.getDate() || 
                     lastGrowthDate.getMonth() !== now.getMonth() || lastGrowthDate.getFullYear() !== now.getFullYear();
      
      if (isNewDay) {
        // 检查是否已经有今天生成的随机时间
        var todayRandomTime = wealthData.todayRandomTime || 0;
        var todayRandomDate = new Date(todayRandomTime);
        
        // 如果今天的随机时间还没生成，或者生成的是昨天的时间
        if (todayRandomTime === 0 || todayRandomDate.getDate() !== now.getDate()) {
          // 生成今天随机时间（7:00-21:00）
          var randomHour = 7 + Math.floor(Math.random() * 14); // 7-20 点
          var randomMinute = Math.floor(Math.random() * 60);
          var todayRandom = new Date();
          todayRandom.setHours(randomHour, randomMinute, 0, 0);
          
          // 保存今天的随机时间
          wealthData.todayRandomTime = todayRandom.getTime();
          wx.setStorageSync('wealthData', wealthData);
          
          // 如果当前时间已经超过随机时间，则立即触发
          if (currentTime >= todayRandom.getTime()) {
            shouldGrowth = true;
            growthTime = todayRandom;
          }
        } else {
          // 使用已保存的今天随机时间
          if (currentTime >= todayRandomTime) {
            shouldGrowth = true;
            growthTime = todayRandomDate;
          }
        }
      }
    }
    
    if (shouldGrowth) {
      this.autoGrowth(growthTime);
    }
  },

  // 自动增长
  autoGrowth: function (growthTime) {
    var dailyAmount = parseFloat(this.data.dailyAmount);
    var currentBalance = parseFloat(this.data.balance);
    var newBalance = currentBalance + dailyAmount;
    
    var now = new Date();
    var timeStr = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    
    // 如果传入了 growthTime，使用它的时间
    if (growthTime) {
      timeStr = growthTime.getHours() + ':' + (growthTime.getMinutes() < 10 ? '0' : '') + growthTime.getMinutes();
    }
    
    this.setData({
      balance: newBalance.toFixed(2),
      todayAmount: dailyAmount.toFixed(0),
      todayTime: timeStr
    });
    
    var wealthData = wx.getStorageSync('wealthData') || {};
    wealthData.balance = newBalance.toFixed(2);
    wealthData.todayAmount = dailyAmount.toFixed(0);
    wealthData.todayTime = timeStr;
    wealthData.lastGrowthTime = now.getTime();
    wx.setStorageSync('wealthData', wealthData);
    
    // 播放提示音
    this.playMoneySound();
    
    // 显示美化的到账通知
    wx.showModal({
      title: '💰 财富到账通知',
      content: '✨ 您的显化账户已入账\n¥ ' + dailyAmount.toFixed(0) + ' 元\n\n💰 当前余额：¥ ' + newBalance.toFixed(2) + ' 元\n\n🌟 继续保持良好的财富能量！',
      showCancel: false,
      confirmText: '收下财富',
      confirmColor: '#d4a017'
    });
  },

  // 加载财富数据
  loadWealthData: function () {
    var wealthData = wx.getStorageSync('wealthData') || {};
    this.setData({
      balance: wealthData.balance || '100000.00',
      targetAmount: wealthData.targetAmount || '1000000',
      initAmount: wealthData.initAmount || '100000',
      dailyAmount: wealthData.dailyAmount || '6663',
      todayAmount: wealthData.todayAmount || '0',
      todayTime: wealthData.todayTime || '',
      timeType: wealthData.timeType || 'random',
      fixedTime: wealthData.fixedTime || '19:00'
    });
  },

  // 保存财富数据
  saveWealthData: function () {
    var wealthData = {
      balance: this.data.balance,
      targetAmount: this.data.targetAmount,
      initAmount: this.data.initAmount,
      dailyAmount: this.data.dailyAmount,
      todayAmount: this.data.todayAmount,
      todayTime: this.data.todayTime,
      timeType: this.data.timeType,
      fixedTime: this.data.fixedTime
    };
    wx.setStorageSync('wealthData', wealthData);
  },



  // 修改计划
  editPlan: function () {
    this.setData({
      showSettings: true
    });
  },

  // 返回主页
  backToMain: function () {
    this.setData({
      showSettings: false
    });
  },

  // 设置目标金额
  onTargetInput: function (e) {
    this.setData({
      targetAmount: e.detail.value
    });
  },

  // 设置初始金额
  onInitInput: function (e) {
    this.setData({
      initAmount: e.detail.value
    });
  },

  // 设置每日入账
  onDailyInput: function (e) {
    this.setData({
      dailyAmount: e.detail.value
    });
  },

  // 设置时间类型
  setTimeType: function (e) {
    var type = e.currentTarget.dataset.type;
    this.setData({
      timeType: type
    });
  },

  // 设置固定时间
  onTimeChange: function (e) {
    this.setData({
      fixedTime: e.detail.value
    });
  },

  // 请求订阅授权 - 每次打开页面调用，积累推送额度
  // 说明：微信一次性订阅模板每次用户点击"允许"=1次推送机会
  // 用户打开页面即授权，可以积累额度，云函数就能推送
  requestSubscribeQuota: function () {
    var templateId = '13GmlwKYXuJoL1mNzd2TOFDUxq0AoeurzuAARkMar1k';
    if (wx.requestSubscribeMessage) {
      wx.requestSubscribeMessage({
        tmplIds: [templateId],
        success: function(res) {
          console.log('[Wealth] 静默订阅授权结果:', JSON.stringify(res));
          if (res[templateId] === 'accept') {
            console.log('[Wealth] 已获取1次推送额度');
          } else if (res[templateId] === 'reject') {
            console.log('[Wealth] 用户拒绝订阅');
          } else {
            console.log('[Wealth] 订阅状态:', res[templateId]);
          }
        },
        fail: function(err) {
          // 静默失败，不影响页面加载
          console.log('[Wealth] 静默订阅授权失败:', err.errCode);
        }
      });
    }
  },

  // 开启推送通知
  enablePushNotify: function () {
    var that = this;
    var templateId = '13GmlwKYXuJoL1mNzd2TOFDUxq0AoeurzuAARkMar1k';
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: function(res) {
        console.log('[Wealth] 推送授权结果:', JSON.stringify(res));
        if (res[templateId] === 'accept') {
          console.log('[Wealth] 用户已授权推送');
          if (wx.cloud) {
            var db = wx.cloud.database();
            db.collection('wealthSettings').where({}).get()
              .then(function(r) {
                var data = { notifyEnabled: true, updatedAt: db.serverDate() };
                if (r.data.length > 0) {
                  return db.collection('wealthSettings').doc(r.data[0]._id).update({ data: data });
                } else {
                  return db.collection('wealthSettings').add({ data: data });
                }
              })
              .then(function() {
                wx.showToast({ title: '🔔 推送已开启', icon: 'success' });
              })
              .catch(function(err) {
                console.error('[Wealth] 云端同步失败:', err);
                wx.showToast({ title: '推送已授权', icon: 'success' });
              });
          } else {
            wx.showToast({ title: '🔔 推送已开启', icon: 'success' });
          }
        } else if (res[templateId] === 'reject') {
          wx.showToast({ title: '您拒绝了推送授权', icon: 'none' });
        } else {
          wx.showToast({ title: '推送授权状态：' + res[templateId], icon: 'none' });
        }
      },
      fail: function(err) {
        console.log('[Wealth] 推送授权失败:', err);
        wx.showToast({ title: '授权失败，请重试', icon: 'none' });
      }
    });
  },

  // 保存设置
  saveSettings: function () {
    var that = this;
    
    // 保存时再次请求订阅授权，确保有推送额度
    if (wx.requestSubscribeMessage) {
      var templateId = '13GmlwKYXuJoL1mNzd2TOFDUxq0AoeurzuAARkMar1k';
      wx.requestSubscribeMessage({
        tmplIds: [templateId],
        success: function(res) {
          console.log('[Wealth] 保存时订阅授权结果:', JSON.stringify(res));
          if (res[templateId] === 'accept') {
            console.log('[Wealth] 已获取1次推送额度');
          }
        },
        fail: function(err) {
          console.log('[Wealth] 保存时订阅授权失败:', err.errCode);
        }
      });
    }
    
    // 保存数据
    that._doSaveAndSync();
  },

  // 实际保存逻辑
  _doSaveAndSync: function() {
    this.saveWealthData();
    this._syncToCloud();
    this.setData({
      showSettings: false
    });
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 同步到云端
  _syncToCloud: function() {
    if (!wx.cloud) return;
    var db = wx.cloud.database();
    var data = {
      timeType: this.data.timeType,
      fixedTime: this.data.fixedTime,
      dailyAmount: this.data.dailyAmount,
      notifyEnabled: true,
      updatedAt: db.serverDate()
    };
    db.collection('wealthSettings').where({}).get()
      .then(function(res) {
        if (res.data.length > 0) {
          return db.collection('wealthSettings').doc(res.data[0]._id).update({ data: data });
        } else {
          return db.collection('wealthSettings').add({ data: data });
        }
      })
      .then(function() { console.log('[Wealth] 云端同步成功'); })
      .catch(function(err) { console.error('[Wealth] 云端同步失败:', err); });
  },

  // 显示今日仪式
  showRitualModal: function () {
    this.setData({
      showRitualModal: true
    });
  },

  // 隐藏今日仪式
  hideRitual: function () {
    this.setData({
      showRitualModal: false
    });
  },

  // 提交来财订单
  submitRitual: function () {
    var that = this;
    
    // 播放钱到账声音
    this.playMoneySound();
    
    // 模拟每日入账
    var dailyAmount = parseFloat(this.data.dailyAmount);
    var currentBalance = parseFloat(this.data.balance);
    var newBalance = currentBalance + dailyAmount;
    
    // 计算明天时间
    var timeStr = '';
    if (this.data.timeType === 'fixed') {
      // 固定时间 - 使用预设的固定时间
      timeStr = this.data.fixedTime;
    } else {
      // 随机时间 - 使用当前时间
      var now = new Date();
      timeStr = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    }
    
    this.setData({
      showRitualModal: false,
      balance: newBalance.toFixed(2),
      todayAmount: dailyAmount.toFixed(0),
      todayTime: timeStr
    });
    
    this.saveWealthData();
    
    // 显示提示
    wx.showModal({
      title: '显化已开始',
      content: '明天 ' + timeStr + '，入账 ' + dailyAmount.toFixed(0) + ' 元\n记得回来看看哦~',
      showCancel: false,
      confirmText: '好的',
      success: function () {
        // 关闭弹窗后返回主页
      }
    });
  },

  // 播放钱到账声音（修复：使用 dao-zhang.mp3，之前错误使用 beads.mp3）
  playMoneySound: function () {
    var audio = wx.createInnerAudioContext();
    audio.src = 'https://1689.1r1zhux.com/audio/zen/dao-zhang.mp3';
    audio.autoplay = true;
    audio.play();
  },

  // 阻止事件冒泡
  stopPropagation: function () {
  },

  // 分享 - 页面级别生命周期函数
  onShareAppMessage: function () {
    return {
      title: '💰 日进斗金 - 每天自动入账的来财小仪式',
      path: '/subpkg-tools/pages/wealth/wealth',
      imageUrl: ''
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '💰 日进斗金 - 让想要的钱每天靠近一点',
      query: ''
    };
  }
});

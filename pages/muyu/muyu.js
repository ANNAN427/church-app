Page({
  data: {
    count: 0,
    totalMerit: 0,
    isAnimating: false,
    showMeritPopup: false
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '功德木鱼' });
    this.loadState();
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.src = 'https://1689.1r1zhux.com/audio/zen/muyu.mp3';
    this.audioContext.autoplay = false;
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy();
    }
  },

  loadState() {
    try {
      const totalMerit = wx.getStorageSync('totalMerit') || 0;
      this.setData({ totalMerit });
    } catch (e) {
      console.error(e);
    }
  },

  saveTotalMerit(merit) {
    try {
      wx.setStorageSync('totalMerit', merit);
    } catch (e) {
      console.error(e);
    }
  },

  saveIndividualMerit(key, merit) {
    try {
      wx.setStorageSync(key, merit);
    } catch (e) {
      console.error(e);
    }
  },
  
  saveMeritRecord(change) {
    try {
      const meritRecords = wx.getStorageSync('meritRecords') || [];
      const today = new Date().toISOString().split('T')[0];
      meritRecords.push({
        date: today,
        action: 'muyu',
        change: change
      });
      wx.setStorageSync('meritRecords', meritRecords);
    } catch (e) {
      console.error('保存木鱼功德记录失败:', e);
    }
  },

  addMeritLog(action, change) {
    try {
      var logs = [];
      try {
        logs = JSON.parse(wx.getStorageSync('meritLog') || '[]');
      } catch(e) {}

      // v35: 直接读取 totalMerit 存储值（已包含消耗）
      var totalMerit = wx.getStorageSync('totalMerit') || 0;

      var now = new Date();
      var month = now.getMonth() + 1;
      var day = now.getDate();
      if (month < 10) month = '0' + month;
      if (day < 10) day = '0' + day;
      var dateStr = now.getFullYear() + '.' + month + '.' + day;

      logs.push({
        time: dateStr,
        action: action,
        change: change,
        balance: totalMerit
      });

      if (logs.length > 200) {
        logs = logs.slice(logs.length - 200);
      }

      wx.setStorageSync('meritLog', JSON.stringify(logs));
    } catch(e) {}
  },

  playSound() {
    if (this.audioContext) {
      this.audioContext.seek(0);
      this.audioContext.play();
    }
    wx.vibrateShort({ type: 'light' });
  },

  tapMuyu() {
    if (this.data.isAnimating) return;

    const newTotalMerit = this.data.totalMerit + 1;
    this.setData({
      totalMerit: newTotalMerit,
      isAnimating: true,
      showMeritPopup: true
    });

    this.playSound();
    this.saveTotalMerit(newTotalMerit);
    this.saveIndividualMerit('muyu_meritCount', newTotalMerit);
    this.saveMeritRecord(1);
    this.addMeritLog('功德木鱼', '+1');
    
    // 150ms 后隐藏木槌动画
    setTimeout(() => {
      this.setData({ isAnimating: false });
    }, 150);
    
    // 800ms 后隐藏浮动提示
    setTimeout(() => {
      this.setData({ showMeritPopup: false });
    }, 800);
  },

  onShareAppMessage() {
    return {
      title: '禅修静心 - 积累功德，净化心灵',
      path: '/pages/muyu/muyu',
      imageUrl: ''
    };
  },
  
  onShareTimeline() {
    return {
      title: '禅修静心 - 积累功德，净化心灵',
      query: '',
      imageUrl: ''
    };
  }
});

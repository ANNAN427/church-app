Page({
  data: {
    hitCount: 0,
    merit: 0,
    totalMerit: 0,
    blessingText: '',
    showBlessing: false,
    isAnimating: false
  },

  blessings: [
    '', '一敲·平安喜乐', '二敲·身心康宁', '三敲·诸事顺遂', '四敲·福禄双全',
    '五敲·福德圆满', '六敲·六时吉祥', '七敲·七星朗照', '八敲·八方缘聚',
    '九敲·长乐未央', '十敲·静听钵鸣'
  ],

  onLoad() {
    wx.setNavigationBarTitle({ title: '解压颂钵' });
    this.loadState();
    this.loadTotalMerit();
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.src = 'https://1689.1r1zhux.com/audio/zen/bowl.mp3';
    this.audioContext.autoplay = false;
    
    console.log('[Bowl] onLoad - 木槌图片路径：https://1689.1r1zhux.com/beads/bowl-mallet.png');
  },

  onShow() {
    this.resetBowlCount();
  },

  onUnload() {
    this.stopSound();
    if (this.audioContext) {
      this.audioContext.destroy();
    }
  },

  onHide() {
    this.resetBowlCount();
    this.stopSound();
  },

  resetBowlCount() {
    this.setData({
      hitCount: 0,
      merit: 0,
      showBlessing: false,
      blessingText: ''
    });
    console.log('[Bowl] resetBowlCount - 颂钵功德值已重置为 0');
  },

  loadState() {
    try {
      const saved = wx.getStorageSync('bowlState');
      if (saved) {
        const state = JSON.parse(saved);
        this.setData({
          hitCount: state.hitCount || 0,
          merit: state.merit || 0
        });
      }
    } catch (e) {
      console.error(e);
    }
  },

  saveState() {
    try {
      wx.setStorageSync('bowlState', JSON.stringify({
        hitCount: this.data.hitCount,
        merit: this.data.merit
      }));
    } catch (e) {
      console.error(e);
    }
  },

  loadTotalMerit() {
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
        action: 'bowl',
        change: change
      });
      wx.setStorageSync('meritRecords', meritRecords);
    } catch (e) {
      console.error('保存颂钵功德记录失败:', e);
    }
  },

  stopSound() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.seek(0);
    }
  },

  addMeritLog(action, change) {
    try {
      var logs = [];
      try {
        logs = JSON.parse(wx.getStorageSync('meritLog') || '[]');
      } catch(e) {}

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
    this.stopSound();
    
    if (this.audioContext) {
      this.audioContext.play();
    }
    wx.vibrateShort({ type: 'light' });
  },

  onHitBowl() {
    console.log('[Bowl] onHitBowl - 木槌被点击！');
    
    const newHitCount = this.data.hitCount + 1;
    const newMerit = this.data.merit + 1;
    const newTotalMerit = this.data.totalMerit + 1;
    
    let showBlessing = false;
    let blessingText = '';
    
    if (newHitCount <= 10) {
      showBlessing = true;
      blessingText = this.blessings[newHitCount];
    }

    this.setData({ 
      hitCount: newHitCount,
      merit: newMerit,
      totalMerit: newTotalMerit,
      showBlessing,
      blessingText,
      isAnimating: true
    });

    this.playSound();
    this.saveState();
    this.saveTotalMerit(newTotalMerit);
    this.saveIndividualMerit('bowl_meritCount', newMerit);
    this.saveMeritRecord(1);
    this.addMeritLog('解压颂钵', '+1');

    setTimeout(() => {
      this.setData({ isAnimating: false, showBlessing: false });
    }, 1500);
  },

  onShareAppMessage() {
    return {
      title: '解压颂钵 - 敲击颂钵，净化心灵',
      path: '/pages/bowl/bowl',
      imageUrl: ''
    };
  },
  
  onShareTimeline() {
    return {
      title: '解压颂钵 - 敲击颂钵，净化心灵',
      query: '',
      imageUrl: ''
    };
  }
});

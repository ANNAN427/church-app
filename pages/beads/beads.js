Page({
  data: {
    count: 0,
    totalMerit: 0,
    beads: [],
    draggingIndex: -1,
    guideLineX: 0,
    beadSpacing: 70,
    beadRadius: 35,
    totalBeads: 108,
    visibleBeads: 12,
    beadIndex: 0,
    scrollOffset: 0
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '静心念珠' });
    this.loadTotalMerit();
    this.initBeads();
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.src = 'https://1689.1r1zhux.com/audio/zen/beads.mp3';
    this.audioContext.autoplay = false;
    
    wx.createSelectorQuery()
      .select('#guideTrack')
      .fields({ size: true, scrollOffset: true })
      .exec((res) => {
        if (res[0]) {
          this.guideLineX = res[0].left + res[0].width / 2;
          this.guideHeight = res[0].height;
        }
      });
  },

  onShow() {
    this.setData({ count: 0 });
  },

  onHide() {
    if (this.audioContext) {
      this.audioContext.pause();
    }
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy();
    }
  },

  initBeads() {
    const beads = [];
    const startY = -this.data.beadSpacing * (this.data.visibleBeads / 2 - 0.5);
    
    for (let i = 0; i < this.data.visibleBeads; i++) {
      const beadIdx = (this.data.beadIndex + i) % 108;
      beads.push({
        id: i,
        src: `https://1689.1r1zhux.com/beads/bead-${beadIdx % 8}.png`,
        offset: startY + i * this.data.beadSpacing,
        baseY: startY + i * this.data.beadSpacing
      });
    }
    this.setData({ beads, scrollOffset: 0 });
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
        action: 'beads',
        change: change
      });
      wx.setStorageSync('meritRecords', meritRecords);
    } catch (e) {
      console.error('保存念珠功德记录失败:', e);
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
    if (this.audioContext) {
      this.audioContext.seek(0);
      this.audioContext.play();
    }
    wx.vibrateShort({ type: 'light' });
  },

  onBeadTouchStart(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ draggingIndex: index });
    this.touchStartY = e.touches[0].pageY;
    this.lastMoveY = this.touchStartY;
    this.accumulatedDelta = 0;
    this.hasCounted = false;
  },

  onBeadTouchMove(e) {
    if (this.data.draggingIndex < 0) return;
    
    const touchY = e.touches[0].pageY;
    const delta = touchY - this.lastMoveY;
    this.accumulatedDelta += delta;
    this.lastMoveY = touchY;
    
    const beads = this.data.beads.map(b => ({
      ...b,
      offset: b.baseY + this.accumulatedDelta
    }));
    this.setData({ beads });
  },

  onBeadTouchEnd(e) {
    if (this.data.draggingIndex < 0) return;
    
    const totalDelta = this.accumulatedDelta;
    const beadSpacing = this.data.beadSpacing;
    
    if (Math.abs(totalDelta) >= beadSpacing * 0.5) {
      const direction = totalDelta > 0 ? 1 : -1;
      this.countBead(direction);
    } else {
      this.initBeads();
    }
    
    this.setData({ draggingIndex: -1 });
  },

  countBead(direction) {
    let newBeadIndex = this.data.beadIndex - direction;
    
    if (newBeadIndex < 0) {
      newBeadIndex = 107;
    } else if (newBeadIndex >= 108) {
      newBeadIndex = 0;
    }
    
    const newCount = direction > 0 ? this.data.count + 1 : Math.max(0, this.data.count - 1);
    const newTotalMerit = this.data.totalMerit + 1;
    
    if (newCount > 0 && newCount % 108 === 0 && direction === 1) {
      wx.showToast({ title: '功德圆满', icon: 'success', duration: 1500 });
    }
    
    const beads = [];
    const startY = -this.data.beadSpacing * (this.data.visibleBeads / 2 - 0.5);
    
    for (let i = 0; i < this.data.visibleBeads; i++) {
      const beadIdx = (newBeadIndex + i) % 108;
      beads.push({
        id: i,
        src: `https://1689.1r1zhux.com/beads/bead-${beadIdx % 8}.png`,
        offset: startY + i * this.data.beadSpacing,
        baseY: startY + i * this.data.beadSpacing
      });
    }
    
    this.setData({ 
      beadIndex: newBeadIndex,
      count: newCount,
      totalMerit: newTotalMerit,
      beads: beads,
      scrollOffset: 0
    });
    
    this.playSound();
    this.saveTotalMerit(newTotalMerit);
    this.saveIndividualMerit('beads_meritCount', newTotalMerit);
    this.saveMeritRecord(1);
    this.addMeritLog('静心念珠', '+1');
  },

  onShareAppMessage() {
    return {
      title: '静心念珠 - 拨动念珠，静心冥想',
      path: '/pages/beads/beads',
      imageUrl: ''
    };
  },
  
  onShareTimeline() {
    return {
      title: '静心念珠 - 拨动念珠，静心冥想',
      query: '',
      imageUrl: ''
    };
  }
});

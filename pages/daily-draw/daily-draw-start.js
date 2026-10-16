// pages/daily-draw/daily-draw-start.js
Page({
  data: {
    tens: '0',
    ones: '0',
    isDrawing: false,
    timer: null
  },

  onLoad: function() {
    try{wx.showShareMenu({menus:['shareAppMessage','shareTimeline']})}catch(e){}
    // 创建音频上下文
    this.audioCtx = wx.createInnerAudioContext();
    this.audioCtx.src = 'https://1689.1r1zhux.com/audio/zen/miaozhen.wav';
    this.audioCtx.autoplay = false;
    this.audioCtx.loop = true;
    this.audioCtx.obeyMuteSwitch = false;
  },

  startDraw: function() {
    var that = this;
    if (this.data.isDrawing) return;
    
    this.setData({ isDrawing: true });
    
    // 播放滚动音效
    if (this.audioCtx) {
      this.audioCtx.seek(0);
      this.audioCtx.play();
    }
    
    var finalNumber = Math.floor(Math.random() * 100) + 1; // 1-100
    var spinCount = 0;
    var timer = setInterval(function() {
      var n = Math.floor(Math.random() * 100) + 1;
      that.setData({
        tens: String(Math.floor(n / 10)),
        ones: String(n % 10)
      });
      spinCount++;
      // Haptic feedback every 3 ticks (every 180ms)
      if (spinCount % 3 === 0) {
        wx.vibrateShort({ type: 'light' });
      }
    }, 60);
    
    this.setData({ timer: timer });
    
    setTimeout(function() {
      clearInterval(timer);
      that.setData({
        tens: String(Math.floor(finalNumber / 10)),
        ones: String(finalNumber % 10),
        isDrawing: false
      });
      
      // 停止滚动音效
      if (that.audioCtx) {
        that.audioCtx.pause();
      }
      
      // Strong haptic feedback when result appears
      wx.vibrateShort({ type: 'heavy' });
      
      // Save the draw index for the result page
      wx.setStorageSync('drawIndex', finalNumber - 1);
      
      // Navigate to result page
      wx.navigateTo({
        url: '/subpkg-tools/pages/daily-draw/daily-draw'
      });
    }, 2200);
  },

  onUnload: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    // 销毁音频上下文
    if (this.audioCtx) {
      this.audioCtx.stop();
      this.audioCtx.destroy();
    }
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '每日心语 - 抽签开始',
      path: '/subpkg-tools/pages/daily-draw/daily-draw-start'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '每日心语 - 抽签开始',
      query: ''
    };
  }

});
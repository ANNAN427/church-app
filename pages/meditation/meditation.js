Page({
  data: {
    isPlaying: false,
    currentIndex: 0,
    musicList: [
      { name: '清晨冥想', duration: '3:00', src: 'https://1689.1r1zhux.com/audio/zen/meditation/清晨冥想.aac' },
      { name: '午后净心', duration: '3:00', src: 'https://1689.1r1zhux.com/audio/zen/meditation/午后净心.aac' },
      { name: '夜间归藏', duration: '3:00', src: 'https://1689.1r1zhux.com/audio/zen/meditation/夜间归藏.aac' }
    ]
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '冥想音乐' });
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.autoplay = false;
    this.loadMusic(0);
    
    // 监听音频结束
    this.audioContext.onEnded(() => {
      this.setData({ isPlaying: false });
    });
    
    // 监听音频错误
    this.audioContext.onError((res) => {
      console.error('音频播放错误:', res);
      this.setData({ isPlaying: false });
      wx.showToast({ title: '音频加载失败', icon: 'none' });
    });
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
    }
  },

  onHide() {
    // 页面隐藏时停止音乐
    if (this.audioContext) {
      this.audioContext.pause();
      this.setData({ isPlaying: false });
    }
  },

  loadMusic(index) {
    if (this.audioContext) {
      this.audioContext.stop();
    }
    this.audioContext.src = this.data.musicList[index].src;
    this.setData({ currentIndex: index });
  },

  selectMusic(e) {
    const index = e.currentTarget.dataset.index;
    const music = this.data.musicList[index];
    
    this.loadMusic(index);
    // 切换音乐后自动播放
    this.audioContext.play();
    this.setData({ isPlaying: true });
  },

  togglePlay() {
    if (this.data.isPlaying) {
      this.audioContext.pause();
      this.setData({ isPlaying: false });
    } else {
      this.audioContext.play();
      this.setData({ isPlaying: true });
    }
  },

  onShareAppMessage() {
    return {
      title: '冥想音乐 - 静心冥想，净化心灵',
      path: '/pages/meditation/meditation',
      imageUrl: ''
    };
  },

  onShareTimeline() {
    return {
      title: '冥想音乐 - 静心冥想，净化心灵',
      query: '',
      imageUrl: ''
    };
  }
});

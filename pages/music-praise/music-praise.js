// pages/music-praise/music-praise.js
Page({
  data: {
    musicList: [],
    currentPlaying: null,
    currentTitle: '',
    currentUrl: '',
    isPlaying: false
  },

  onLoad: function () {
    try { wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] }) } catch (e) {}
    
    var that = this;
    
    // 从服务器动态获取列表（PHP 自动扫描文件夹生成 JSON）
    wx.request({
      url: 'https://1689.1r1zhux.com/shengyuezanm/list.php?t=' + Date.now(),
      success: function(res) {
        if (res.data && res.data.length > 0) {
          var musicList = res.data.map(function(item) {
            return {
              id: item.id,
              title: item.title,
              artist: item.artist || '圣经朗读',
              url: 'https://1689.1r1zhux.com/shengyuezanm/' + item.file,
              duration: item.duration || '--:--'
            };
          });
          that.setData({ musicList: musicList });
        }
      },
      fail: function(err) {
        console.error('获取圣乐列表失败:', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
    
    // 创建音频上下文
    this._audioCtx = wx.createInnerAudioContext();
    this._audioCtx.onEnded(function() {
      that.setData({ isPlaying: false, currentPlaying: null });
    });
    this._audioCtx.onError(function(res) {
      console.error('音频播放错误:', res);
      wx.showToast({ title: '播放失败', icon: 'none' });
      that.setData({ isPlaying: false, currentPlaying: null });
    });
  },

  onUnload: function () {
    if (this._audioCtx) {
      this._audioCtx.stop();
      this._audioCtx.destroy();
    }
  },

  playMusic: function (e) {
    var id = e.currentTarget.dataset.id;
    var url = e.currentTarget.dataset.url;
    var title = e.currentTarget.dataset.title;

    if (this.data.currentPlaying === id) {
      this.togglePlay();
      return;
    }

    if (this._audioCtx) {
      this._audioCtx.stop();
    }

    this._audioCtx.src = url;
    this._audioCtx.play();

    this.setData({
      currentPlaying: id,
      currentTitle: title,
      currentUrl: url,
      isPlaying: true
    });
  },

  togglePlay: function () {
    if (this.data.isPlaying) {
      this._audioCtx.pause();
      this.setData({ isPlaying: false });
    } else {
      this._audioCtx.play();
      this.setData({ isPlaying: true });
    }
  },

  stopPlay: function () {
    if (this._audioCtx) {
      this._audioCtx.stop();
    }
    this.setData({
      isPlaying: false,
      currentPlaying: null,
      currentTitle: '',
      currentUrl: ''
    });
  },

  onShareAppMessage: function () {
    return {
      title: '圣乐赞美 - 用音乐敬拜主',
      path: '/pages/music-praise/music-praise'
    };
  },

  onShareTimeline: function () {
    return {
      title: '圣乐赞美 - 用音乐敬拜主',
      query: ''
    };
  }
});

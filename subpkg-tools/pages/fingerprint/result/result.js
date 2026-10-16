Page({
  data: {
    navHeight: 44,
    resultData: null
  },

  onLoad: function() {
    var sysInfo = wx.getSystemInfoSync();
    var statusBarH = sysInfo.statusBarHeight || 44;
    this.setData({ navHeight: statusBarH });

    var resultData = wx.getStorageSync('fingerprint_result');
    if (resultData) {
      this.setData({ resultData: resultData });
    }
  },

  // 重新测算
  restart: function() {
    wx.navigateBack({ delta: 1 });
  },

  // 返回修改
  onBack: function() {
    wx.navigateBack({ delta: 1 });
  },

  // 分享功能
  onShareAppMessage: function() {
    var resultData = this.data.resultData;
    var title = '指纹算命 - 我的运势';
    if (resultData && resultData.type) {
      title = '我在指纹算命测出「' + resultData.type + '」，快来试试！';
    }
    return {
      title: title,
      path: '/pages/index/index'
    };
  },

  onShareTimeline: function() {
    var resultData = this.data.resultData;
    var title = '指纹算命 - 我的运势';
    if (resultData && resultData.type) {
      title = '我在指纹算命测出「' + resultData.type + '」，快来试试！';
    }
    return {
      title: title,
      query: ''
    };
  }
});

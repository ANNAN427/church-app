// pages/church-recommend/church-detail.js
Page({
  data: {
    church: {}
  },

  onLoad: function () {
    // Get church data from storage
    var church = wx.getStorageSync('currentChurch');
    if (church) {
      this.setData({ church: church });
      // Update navigation title
      wx.setNavigationBarTitle({
        title: church.name || '教堂详情'
      });
    }
  },

  shareChurch: function () {
    var church = this.data.church;
    var shareText = '✝️ ' + church.name + '\n📍 ' + (church.province || '') + ' ' + (church.address || '');
    if (church.openTime) shareText += '\n🕐 ' + church.openTime;
    if (church.ticket) shareText += '\n🎫 ' + church.ticket;
    shareText += '\n\n快来探索这座教堂吧！';

    wx.setClipboardData({
      data: shareText,
      success: function () {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  backToList: function () {
    wx.navigateBack();
  },

  onShareAppMessage: function () {
    var church = this.data.church || {};
    return {
      title: church.name ? '✝️ ' + church.name : '基督教堂详情',
      path: '/pages/church-recommend/church-detail',
      imageUrl: ''
    };
  },

  onShareTimeline: function () {
    var church = this.data.church || {};
    return {
      title: church.name ? '✝️ ' + church.name + ' - 教堂探索' : '基督教堂详情',
      query: ''
    };
  }
});

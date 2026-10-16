// pages/temple-detail/temple-detail.js
Page({
  data: {
    temple: {},
    failedImages: [],
    heroFailed: false
  },

  onLoad: function () {
    // Get temple data from storage
    var temple = wx.getStorageSync('currentTemple');
    if (temple) {
      this.setData({ temple: temple });
      // Update navigation title
      wx.setNavigationBarTitle({
        title: temple.name || '寺庙详情'
      });
    }
  },

  onImageError: function (e) {
    var index = e.currentTarget.dataset.index;
    if (index !== undefined) {
      var failed = this.data.failedImages.slice();
      failed.push(index);
      this.setData({ failedImages: failed });
    } else {
      this.setData({ heroFailed: true });
    }
  },

  previewImage: function (e) {
    var index = e.currentTarget.dataset.index;
    var urls = this.data.temple.images;
    if (urls && urls.length > 0) {
      // Filter out failed images for preview
      var validUrls = [];
      for (var i = 0; i < urls.length; i++) {
        if (this.data.failedImages.indexOf(i) === -1) {
          validUrls.push(urls[i]);
        }
      }
      var currentIndex = 0;
      for (var j = 0; j < index; j++) {
        if (this.data.failedImages.indexOf(j) === -1) {
          currentIndex++;
        }
      }
      if (validUrls.length > 0) {
        wx.previewImage({
          current: validUrls[currentIndex],
          urls: validUrls
        });
      }
    }
  },

  shareTemple: function () {
    var temple = this.data.temple;
    var shareText = '🏛️ ' + temple.name + '\n📍 ' + (temple.province || '') + ' ' + (temple.address || '');
    if (temple.openTime) shareText += '\n🕐 ' + temple.openTime;
    if (temple.ticket) shareText += '\n🎫 ' + temple.ticket;
    shareText += '\n\n快来探索这座古刹吧！';

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
    var temple = this.data.temple || {};
    return {
      title: temple.name ? '🏛️ ' + temple.name : '佛教寺庙详情',
      path: '/subpkg-tools/pages/temple-detail/temple-detail?id=' + (temple.id || ''),
      imageUrl: ''
    };
  },

  onShareTimeline: function () {
    var temple = this.data.temple || {};
    return {
      title: temple.name ? '🏛️ ' + temple.name + ' - 古刹探索' : '佛教寺庙详情',
      query: 'id=' + (temple.id || '')
    };
  }
});

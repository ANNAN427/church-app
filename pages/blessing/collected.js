/**
 * 已收集福卡列表页面
 * 路径：pages/blessing/collected.js
 */
Page({
  data: {
    collectedCards: []
  },

  onLoad: function(options) {
    this.loadCollectedCards();
  },

  onShow: function() {
    this.loadCollectedCards();
  },

  loadCollectedCards: function() {
    var collectedCards = wx.getStorageSync('collectedCards') || [];
    
    // 为每张卡添加收集日期显示
    for (var i = 0; i < collectedCards.length; i++) {
      if (!collectedCards[i].collect_date) {
        collectedCards[i].collect_date = '已收藏';
      }
    }
    
    this.setData({ collectedCards: collectedCards });
  },

  onViewCard: function(e) {
    var index = e.currentTarget.dataset.index;
    var card = this.data.collectedCards[index];
    wx.navigateTo({
      url: '/pages/blessing/detail?cardId=' + card.card_id + '&cardUrl=' + encodeURIComponent(card.card_url) + '&cardName=' + encodeURIComponent(card.blessing_text || '福卡')
    });
  },

  onShareAppMessage: function() {
    // 分享第一张卡片的链接，确保接收方看到正确的福卡
    var cards = this.data.collectedCards;
    if (cards && cards.length > 0) {
      var card = cards[0];
      var sharePath = '/pages/blessing/index?sharedCardId=' + encodeURIComponent(card.card_id) +
                      '&sharedCardUrl=' + encodeURIComponent(card.card_url) +
                      '&sharedCardName=' + encodeURIComponent(card.blessing_text || '福卡');
      return {
        title: card.blessing_text || '来看看我收集的福卡',
        path: sharePath
      };
    }
    return {
      title: '来看看我收集的福卡',
      path: '/pages/blessing/index'
    };
  }
});

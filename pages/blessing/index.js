/**
 * 每日福卡页面 - 本地模式（无后端依赖）
 * 路径：pages/blessing/index.js
 */

Page({
  data: {
    config: {
      buddhism: {
        navTitle: '每日福卡',
        title: '每日佛缘，心诚则灵',
        subtitle1: '合十静候，福由心生',
        subtitle2: '今日福卡已备好，静待有缘人',
        sectionTitle: '静候多时，请取今日佛缘',
        claimBtnText: '领取今日福卡',
        claimedText: '已领取'
      },
      taoism: {
        navTitle: '每日福卡',
        title: '每日道缘，心诚则灵',
        subtitle1: '拱手静候，福自道生',
        subtitle2: '今日福符已备好，静待有缘人',
        sectionTitle: '恭候多时，请取走今日道缘',
        claimBtnText: '领取今日福符',
        claimedText: '已领取'
      },
      christianity: {
        navTitle: '每日福卡',
        title: '每日恩典，心诚则见',
        subtitle1: '祈祷静候，福自天倾',
        subtitle2: '今日灵粮已备好，静待寻求者',
        sectionTitle: '恭候多时，请取走今日主恩',
        claimBtnText: '领取今日灵粮卡',
        claimedText: '已领取'
      }
    },
    currentConfig: null,
    todayCard: {
      cardId: null,
      cardDate: null,
      cardUrl: null,
      blessingText: null,
      hasClaimed: false,
      claimTime: null,
      isWaiting: true
    },
    stats: {
      todayRemaining: 1,
      collectedCount: 0,
      totalCards: 365,
    },
    loading: false
  },

  onLoad: function(options) {
    // v046: Enable share menu
    try{wx.showShareMenu({menus:['shareAppMessage','shareTimeline']})}catch(e){}
    options = options || {};
    if (options.sharedCardUrl) {
      var sharedCardUrl = decodeURIComponent(options.sharedCardUrl);
      var sharedCardName = options.sharedCardName ? decodeURIComponent(options.sharedCardName) : '好友分享的福卡';
      var sharedCardId = options.sharedCardId ? decodeURIComponent(options.sharedCardId) : '';
      wx.redirectTo({
        url: '/pages/blessing/detail?cardUrl=' + encodeURIComponent(sharedCardUrl) + '&cardId=' + encodeURIComponent(sharedCardId) + '&cardName=' + encodeURIComponent(sharedCardName)
      });
      return;
    }
    var religion = this.getReligion();
    var config = this.data.config[religion] || this.data.config.buddhism;
    this.setData({ currentConfig: config });
    wx.setNavigationBarTitle({ title: config.navTitle });
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  getReligion: function() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.extJson) {
        var ext = JSON.parse(userInfo.extJson);
        return ext.religion || 'buddhism';
      }
    } catch(e) {}
    return 'buddhism';
  },

  getUserId: function() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.id) return userInfo.id;
    } catch(e) {}
    return 'guest_' + Date.now();
  },

  loadData: function() {
    var todayStr = new Date().toISOString().split('T')[0];
    var storageKey = 'blessing_claimed_' + todayStr;
    var claimedData = wx.getStorageSync(storageKey);
    if (claimedData && claimedData.hasClaimed) {
      this.setData({
        todayCard: claimedData,
        loading: false
      });
    } else {
      this.setData({
        todayCard: {
          cardId: null,
          cardDate: todayStr,
          cardUrl: null,
          blessingText: '恭候多时，请领取今日福卡',
          hasClaimed: false,
          claimTime: null,
          isWaiting: true
        },
        loading: false
      });
    }
    this.loadStats();
  },

  loadStats: function() {
    var todayStr = new Date().toISOString().split('T')[0];
    var statsKey = 'blessing_stats_' + todayStr;
    var localStats = wx.getStorageSync(statsKey);
    if (localStats) {
      this.setData(localStats);
    } else {
      var collectedCards = wx.getStorageSync('collectedCards') || [];
      this.setData({
        'stats.collectedCount': collectedCards.length,
        'stats.totalCards': 365,
        'stats.todayRemaining': 1,
      });
    }
  },

  onClaimCard: function() {
    var todayCard = this.data.todayCard;
    if (todayCard.hasClaimed) {
      wx.showToast({ title: '今日已领取', icon: 'none' });
      return;
    }
    var userId = this.getUserId();
    var randomCard = this.getLocalTodayCard(true);
    var todayStr = new Date().toISOString().split('T')[0];
    var claimedData = {
      cardId: randomCard.cardId,
      cardDate: todayStr,
      cardUrl: randomCard.cardUrl,
      blessingText: randomCard.blessingText,
      hasClaimed: true,
      claimTime: new Date().toISOString()
    };
    wx.setStorageSync('blessing_claimed_' + todayStr, claimedData);
    var collectedCards = wx.getStorageSync('collectedCards') || [];
    var alreadyExists = false;
    for (var i = 0; i < collectedCards.length; i++) {
      if (collectedCards[i].card_id === claimedData.cardId) {
        alreadyExists = true;
        break;
      }
    }
    if (!alreadyExists) {
      collectedCards.push({
        card_id: claimedData.cardId,
        card_url: claimedData.cardUrl,
        blessing_text: claimedData.blessingText,
        user_id: userId
      });
      wx.setStorageSync('collectedCards', collectedCards);
    }
    var newCollectedCount = collectedCards.length;
    this.setData({
      todayCard: claimedData,
      'stats.collectedCount': newCollectedCount,
      'stats.todayRemaining': 0
    });
    wx.showToast({ title: '领取成功', icon: 'success' });
    try {
      wx.setStorageSync('_blessingShareData', JSON.stringify({
        imgUrl: claimedData.cardUrl,
        cardName: claimedData.blessingText || '今日福卡',
        cardId: claimedData.cardId
      }));
    } catch(e) {}
    var that = this;
    setTimeout(function() {
      wx.navigateTo({
        url: '/pages/blessing/detail?cardId=' + claimedData.cardId + '&cardUrl=' + encodeURIComponent(claimedData.cardUrl)
      });
    }, 800);
  },

  onViewCollected: function() {
    wx.navigateTo({
      url: '/pages/blessing/collected'
    });
  },

  getLocalTodayCard: function(isRandom) {
    var now = new Date();
    var startOfYear = new Date(now.getFullYear(), 0, 0);
    var diff = now - startOfYear;
    var oneDay = 1000 * 60 * 60 * 24;
    var dayOfYear = Math.floor(diff / oneDay);
    var blessingTexts = [
      '心想事成', '万事如意', '平安喜乐', '福运满堂', '财源广进',
      '身体健康', '工作顺利', '学业有成', '家庭和睦', '幸福美满',
      '笑口常开', '好运连连', '步步高升', '喜气洋洋', '吉祥如意'
    ];
    if (!isRandom) {
      return {
        cardId: null,
        cardDate: now.toISOString().split('T')[0],
        cardUrl: null,
        blessingText: '恭候多时，请领取今日福卡',
        hasClaimed: false,
        claimTime: null,
        isWaiting: true
      };
    }
    var randomIndex = Math.floor(Math.random() * blessingTexts.length);
    var cardId = dayOfYear * 1000 + randomIndex;
    return {
      cardId: cardId,
      cardDate: now.toISOString().split('T')[0],
      cardUrl: 'https://1689.1r1zhux.com/blessing-cards/card_' + String(cardId % 365).padStart(3, '0') + '.jpg',
      blessingText: '今日福运：' + blessingTexts[randomIndex],
      hasClaimed: true,
      claimTime: new Date().toISOString()
    };
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '每日福卡 - 接福纳祥',
      path: '/pages/blessing/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '每日福卡 - 接福纳祥',
      query: ''
    };
  }

});

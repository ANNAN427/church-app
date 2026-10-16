// pages/naming/detail.js
Page({
  data: {
    nameInfo: {
      name: '',
      score: 0,
      meaning: '',
      wuxing: '',
      wuxingDetail: [],
      scoreDetail: {},
      interpretation: ''
    }
  },

  onLoad: function (options) {
    if (options.name) {
      this.loadNameDetail(decodeURIComponent(options.name));
    }
  },

  loadNameDetail: function (name) {
    // 模拟详细数据（实际应从 API 获取）
    const nameData = {
      name: name,
      score: 98,
      meaning: '胸怀宽广，气宇轩昂，前程似锦',
      wuxing: '金木',
      wuxingDetail: [
        { element: '金', type: 'metal', icon: '⚔️', name: '金', percent: 80 },
        { element: '木', type: 'wood', icon: '🌳', name: '木', percent: 70 },
        { element: '水', type: 'water', icon: '💧', name: '水', percent: 60 },
        { element: '火', type: 'fire', icon: '🔥', name: '火', percent: 50 },
        { element: '土', type: 'earth', icon: '🏔️', name: '土', percent: 40 }
      ],
      scoreDetail: {
        tone: 95,
        meaning: 98,
        wuxing: 96
      },
      interpretation: '此名字音律优美，读音响亮，寓意深远。从五行来看，金木相生，有助于事业发展和人际关系。建议配合生辰八字使用效果更佳。'
    };

    this.setData({ nameInfo: nameData });
  },

  shareName: function () {
    const { name, score } = this.data.nameInfo;
    
    wx.showShareMenu({
      withShareTicket: true,
      showShareItems: ['wechatFriends', 'wechatMoment']
    });

    wx.showToast({
      title: '点击右上角分享',
      icon: 'none'
    });
  }
});

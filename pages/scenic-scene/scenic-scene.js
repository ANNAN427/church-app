// pages/scenic-scene/scenic-scene.js
Page({
  data: {
    scenes: [
      {
        id: 1,
        icon: '🏯',
        name: '普陀山',
        location: '浙江舟山',
        desc: '中国佛教四大名山之一，观音菩萨道场。海天佛国，清净庄严，是礼佛祈愿的圣地。',
        color: 'linear-gradient(135deg, #667eea, #764ba2)',
        tags: ['佛教圣地', '观音道场', '海天佛国']
      },
      {
        id: 2,
        icon: '🏔️',
        name: '峨眉山',
        location: '四川乐山',
        desc: '普贤菩萨道场，云海日出，佛光万千。山中古刹林立，是修行悟道的绝佳之地。',
        color: 'linear-gradient(135deg, #f093fb, #f5576c)',
        tags: ['佛教圣地', '普贤道场', '云海佛光']
      },
      {
        id: 3,
        icon: '⛰️',
        name: '五台山',
        location: '山西忻州',
        desc: '文殊菩萨道场，清凉圣地。寺庵错落，钟磬悠扬，感受千年佛法的智慧与慈悲。',
        color: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        tags: ['佛教圣地', '文殊道场', '清凉圣境']
      },
      {
        id: 4,
        icon: '🌄',
        name: '九华山',
        location: '安徽池州',
        desc: '地藏菩萨道场，莲花佛国。峰峦叠翠，古木参天，在清净中感悟生命的真谛。',
        color: 'linear-gradient(135deg, #43e97b, #38f9d7)',
        tags: ['佛教圣地', '地藏道场', '莲花佛国']
      },
      {
        id: 5,
        icon: '🏛️',
        name: '少林寺',
        location: '河南登封',
        desc: '禅宗祖庭，天下第一名刹。少林功夫，禅武合一，体验身心合一的修行之道。',
        color: 'linear-gradient(135deg, #fa709a, #fee140)',
        tags: ['禅宗祖庭', '少林功夫', '禅武合一']
      },
      {
        id: 6,
        icon: '🌸',
        name: '灵隐寺',
        location: '浙江杭州',
        desc: '江南禅宗五大名山之一，飞来峰下千年古刹。钟声悠扬，香火鼎盛，净化心灵。',
        color: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
        tags: ['千年古刹', '江南名寺', '飞来峰']
      },
      {
        id: 7,
        icon: '🍃',
        name: '青城山',
        location: '四川都江堰',
        desc: '道教发源地之一，天下青城。幽静秀美，道法自然，感受天人合一的宁静。',
        color: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
        tags: ['道教圣地', '天下青城', '道法自然']
      },
      {
        id: 8,
        icon: '☯️',
        name: '武当山',
        location: '湖北十堰',
        desc: '道教圣地，太极拳发源地。云海缭绕，金顶辉煌，体验太极阴阳的和谐之美。',
        color: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
        tags: ['道教圣地', '太极发源地', '仙山琼阁']
      }
    ]
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '景点介绍 - 探索名胜古迹',
      path: '/subpkg-tools/pages/scenic-scene/scenic-scene'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '景点介绍 - 探索名胜古迹',
      query: ''
    };
  }

});

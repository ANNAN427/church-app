// pages/daily-draw/daily-draw.js
var hdx = require('../../data/hdx.js');

Page({
  data: {
    cardData: {},
    poetryLines: []
  },

  onLoad: function() {
    var list = hdx.getList();
    // Use drawIndex from storage (set by start page)
    var idx = wx.getStorageSync('drawIndex');
    if (idx === undefined || idx === null || idx >= list.length) {
      idx = Math.floor(Math.random() * list.length);
    }
    var item = list[idx];

    // Parse poetry lines — 支持空格分隔（如"第一枝 龙虎逢 一旦凌霄 任君来往"）和换行分隔
    var poetryLines = [];
    if (item && item.qianshi) {
      var text = item.qianshi.trim();
      // 先用空格切分，每段一行
      var parts = text.split(' ');
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p.length > 0) {
          poetryLines.push(p);
        }
      }
      // 如果空格切分后只有1段（没有空格），尝试按固定7字/5字截断
      if (poetryLines.length <= 1 && text.length >= 4) {
        poetryLines = [];
        var len = text.length;
        // 尝试 4 行均分
        var perLine = Math.round(len / 4);
        for (var j = 0; j < 4; j++) {
          var start = j * perLine;
          var end = (j === 3) ? len : (j + 1) * perLine;
          poetryLines.push(text.substring(start, end));
        }
      }
    }

    this.setData({
      cardData: item,
      poetryLines: poetryLines
    });
  },

  restartDraw: function() {
    wx.navigateBack({ delta: 1 });
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '每日心语 - 今日灵签',
      path: '/subpkg-tools/pages/daily-draw/daily-draw'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '每日心语 - 今日灵签',
      query: ''
    };
  }

});

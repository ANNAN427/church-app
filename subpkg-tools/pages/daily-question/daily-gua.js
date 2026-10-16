// subpkg-zen/pages/daily-gua/daily-gua.js
var guaList = require('../../data/daily-gua-data.js');

Page({
  data: {
    castIndex: 0,
    casts: [null, null, null, null, null, null],
    coins: [
      { isHead: true, isFlipping: false },
      { isHead: true, isFlipping: false },
      { isHead: true, isFlipping: false }
    ],
    showResult: false,
    result: null,
    isLongPressing: false,
    progress: 0,
    pressing: false,
    shaking: false,
    _castTimer: null,
    _shakeTimer: null
  },

  onLoad: function () {
    // v046: Enable share menu
    try{wx.showShareMenu({menus:['shareAppMessage','shareTimeline']})}catch(e){}
    this._initCoins();
  },

  _initCoins: function () {
    var coins = this.data.coins;
    for (var i = 0; i < coins.length; i++) {
      coins[i].isHead = Math.random() > 0.5;
      coins[i].isFlipping = false;
    }
    this.setData({ coins: coins });
  },

  goBack: function () {
    wx.navigateBack();
  },

  _singleCast: function () {
    var coins = this.data.coins;
    var results = [];
    for (var i = 0; i < coins.length; i++) {
      results.push(Math.random() > 0.5);
    }

    var tails = 0;
    for (var i = 0; i < results.length; i++) {
      coins[i].isHead = results[i];
      if (!results[i]) tails++;
      coins[i].isFlipping = false;
    }

    var type = (tails === 0 || tails === 1) ? 'yang' : 'yin';

    var castIndex = this.data.castIndex;
    var casts = this.data.casts;
    casts[castIndex] = { position: castIndex + 1, type: type };

    wx.vibrateShort({ type: 'medium' });

    this.setData({
      coins: coins,
      castIndex: castIndex + 1,
      casts: casts
    });

    var that = this;
    setTimeout(function () {
      var c = that.data.coins;
      for (var i = 0; i < c.length; i++) {
        c[i].isFlipping = false;
      }
      that.setData({ coins: c });
    }, 400);
  },

  onTouchStart: function () {
    if (this.data.castIndex >= 6) return;

    var that = this;
    var totalCasts = 6;
    var castCount = 0;
    var interval = 200;

    this.setData({
      isLongPressing: true,
      pressing: true,
      shaking: true,
      progress: 0
    });

    // Haptic feedback on touch start
    wx.vibrateShort({ type: 'light' });

    // Start shaking after a short delay (turtle "awakening")
    setTimeout(function() {
      if (that.data.pressing) {
        wx.vibrateShort({ type: 'heavy' });
      }
    }, 150);

    var c = this.data.coins;
    for (var i = 0; i < c.length; i++) {
      c[i].isFlipping = true;
    }
    this.setData({ coins: c });

    this.data._castTimer = setInterval(function () {
      if (castCount < totalCasts && that.data.castIndex < totalCasts) {
        var c2 = that.data.coins;
        for (var i = 0; i < c2.length; i++) {
          c2[i].isFlipping = true;
        }
        that.setData({ coins: c2 });

        that._singleCast();
        castCount++;

        var prog = Math.round((castCount / totalCasts) * 100);
        that.setData({ progress: prog });

        // Progressive haptic - stronger as we near completion
        if (castCount >= 4) {
          wx.vibrateShort({ type: 'heavy' });
        }
      } else {
        clearInterval(that.data._castTimer);
        var c3 = that.data.coins;
        for (var i = 0; i < c3.length; i++) {
          c3[i].isFlipping = false;
        }
        that.setData({
          coins: c3,
          isLongPressing: false,
          pressing: false,
          shaking: false,
          progress: 100
        });
      }
    }, interval);
  },

  onTouchEnd: function () {
    if (this.data.isLongPressing) {
      if (this.data._castTimer) {
        clearInterval(this.data._castTimer);
      }

      while (this.data.castIndex < 6) {
        this._singleCast();
      }

      this.setData({
        isLongPressing: false,
        pressing: false,
        shaking: false,
        progress: 100
      });
    }

    if (this.data.castIndex >= 6) {
      this._showResult();
    }
  },

  _showResult: function () {
    var casts = this.data.casts;
    var binary = '';
    for (var i = 0; i < casts.length; i++) {
      binary += (casts[i].type === 'yang' ? '1' : '0');
    }
    var idx = parseInt(binary, 2);
    var result = guaList[idx] || guaList[0];

    // Parse 7-char poem into 4 lines: remove spaces, split every 7 chars
    var rawPoem = result.book_means || '';
    var poemLines = [];
    var cleanPoem = rawPoem.replace(/\s+/g, '');
    if (cleanPoem.length >= 28) {
      for (var j = 0; j < 4; j++) {
        poemLines.push(cleanPoem.substring(j * 7, (j + 1) * 7));
      }
    } else {
      poemLines = [rawPoem];
    }

    var guaResult = {
      guaName: result.book_name || '乾为天',
      guaNum: result.book_sort || '一',
      guaCi: rawPoem,
      guaCiLines: poemLines,
      tuanCi: result.book_result || '',
      xiangCi: result.book_all || ''
    };

    this.setData({
      showResult: true,
      result: guaResult
    });

    wx.vibrateLong();
  },

  closeResult: function () {
    this.setData({ showResult: false });
  },

  restart: function () {
    this.setData({
      castIndex: 0,
      casts: [null, null, null, null, null, null],
      showResult: false,
      result: null,
      isLongPressing: false,
      pressing: false,
      shaking: false,
      progress: 0
    });
    this._initCoins();
  },

  onUnload: function () {
    if (this.data._castTimer) {
      clearInterval(this.data._castTimer);
    }
  },

  onShareAppMessage: function () {
    var title = '每日一问 - 每日一卦，趋吉避凶';
    if (this.data.result && this.data.result.guaName) {
      title = '每日一问 - ' + this.data.result.guaName;
    }
    return {
      title: title,
      path: '/subpkg-zen/pages/daily-gua/daily-gua'
    };
  },

  onShareTimeline: function () {
    var title = '每日一问 - 每日一卦，趋吉避凶';
    if (this.data.result && this.data.result.guaName) {
      title = '每日一问 - ' + this.data.result.guaName;
    }
    return {
      title: title,
      query: ''
    };
  }
});

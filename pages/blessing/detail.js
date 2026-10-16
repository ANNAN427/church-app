/**
 * 福卡详情页 - 远程图片直链版 (v32)
 * 路径：pages/blessing/detail.js
 * 废弃 Canvas 本地生成，直接加载远程福卡图片
 */

var CARD_BASE_URL = 'https://1689.1r1zhux.com/blessing-cards/';

Page({
  data: {
    cardUrl: '',
    cardId: '',
    cardName: '今日福卡',
    blessingText: '',
    saving: false,
    imageLoaded: false,
    imageError: false
  },

  onLoad: function(options) {
    options = options || {};
    var that = this;
    var cardUrl = '';
    var cardId = '';
    var cardName = '今日福卡';
    var blessingText = '';

    // 优先从 URL 参数获取
    if (options.cardUrl) {
      cardUrl = decodeURIComponent(options.cardUrl);
    }
    if (options.cardId) {
      cardId = decodeURIComponent(options.cardId);
    }
    cardName = options.cardName ? decodeURIComponent(options.cardName) : '今日福卡';

    // 如果 cardUrl 为空但有 cardId，用 cardId 拼接远程 URL
    if (!cardUrl && cardId) {
      cardUrl = CARD_BASE_URL + cardId + '.jpg';
    }

    // 兜底：从 storage 读取分享数据
    if (!cardUrl) {
      try {
        var shareData = wx.getStorageSync('_blessingShareData');
        if (shareData) {
          var data = JSON.parse(shareData);
          cardUrl = data.imgUrl || '';
          cardId = data.cardId || '';
          if (!cardUrl && cardId) {
            cardUrl = CARD_BASE_URL + cardId + '.jpg';
          }
          cardName = data.cardName || '今日福卡';
        }
      } catch(e) {}
    }

    // 提取祝福文字
    if (cardName.indexOf('今日福运：') >= 0) {
      blessingText = cardName.replace('今日福运：', '');
    } else {
      blessingText = cardName;
    }

    // 提取 cardId（如果 URL 中有但参数里没有）
    if (!cardId && cardUrl) {
      var match = cardUrl.match(/card_(\d+\.jpg|\d+)/);
      if (match) {
        cardId = 'card_' + match[1].replace('.jpg', '');
      }
    }

    that.setData({
      cardUrl: cardUrl,
      cardId: cardId,
      cardName: cardName,
      blessingText: blessingText,
      imageLoaded: false,
      imageError: false
    });
  },

  onImageLoad: function() {
    this.setData({ imageLoaded: true, imageError: false });
  },

  onImageError: function() {
    console.error('[福卡] 远程图片加载失败:', this.data.cardUrl);
    this.setData({ imageLoaded: false, imageError: true });
  },

  // 保存图片到相册 - v36 Canvas 本地渲染版（不依赖域名配置，兼容 iOS/Android）
  onSaveImage: function() {
    var that = this;
    if (that.data.saving) return;
    that.setData({ saving: true });

    var cardUrl = that.data.cardUrl;
    if (!cardUrl) {
      wx.showToast({ title: '暂无图片', icon: 'none' });
      that.setData({ saving: false });
      return;
    }

    console.log('[福卡] 开始 Canvas 渲染保存');

    // v36: 优先使用 Canvas 本地渲染（不依赖域名配置）
    that.drawCardToCanvas(cardUrl);
  },

  // v36: Canvas 本地渲染福卡
  drawCardToCanvas: function(imageSrc) {
    var that = this;
    var ctx = wx.createCanvasContext('saveCanvas', that);

    var canvasWidth = 600;
    var canvasHeight = 1200;

    // 背景：中国红渐变
    var gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#c41e3a');
    gradient.addColorStop(0.5, '#b22222');
    gradient.addColorStop(1, '#8b0000');
    ctx.setFillStyle(gradient);
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 金色边框
    ctx.setStrokeStyle('#f0c040');
    ctx.setLineWidth(16);
    ctx.strokeRect(16, 16, canvasWidth - 32, canvasHeight - 32);

    // 内边框
    ctx.setLineWidth(2);
    ctx.strokeRect(36, 36, canvasWidth - 72, canvasHeight - 72);

    // 四个角装饰
    that.drawCornerDecoration(ctx, 50, 50, 30);
    that.drawCornerDecoration(ctx, canvasWidth - 50, 50, 30);
    that.drawCornerDecoration(ctx, 50, canvasHeight - 50, 30);
    that.drawCornerDecoration(ctx, canvasWidth - 50, canvasHeight - 50, 30);

    // 顶部标题
    ctx.setFillStyle('#f0c040');
    ctx.setFontSize(28);
    ctx.setTextAlign('center');
    ctx.fillText('e 人 e 炷香', canvasWidth / 2, 100);

    // 福卡标题
    ctx.setFillStyle('#f0c040');
    ctx.setFontSize(32);
    var cardName = that.data.cardName || '今日福卡';
    if (cardName.indexOf('今日福运：') >= 0) {
      cardName = cardName.replace('今日福运：', '');
    }
    ctx.fillText(cardName, canvasWidth / 2, 160);

    // 装饰线
    ctx.setStrokeStyle('#f0c040');
    ctx.setLineWidth(2);
    ctx.beginPath();
    ctx.moveTo(150, 190);
    ctx.lineTo(canvasWidth - 150, 190);
    ctx.stroke();

    // 尝试在 Canvas 上绘制远程图片
    if (imageSrc) {
      that.drawImageOnCanvas(ctx, imageSrc, canvasWidth, canvasHeight, function() {
        ctx.draw(true, function() {
          that.canvasToImage();
        });
      });
    } else {
      // 无图片时，用文字渲染
      ctx.setFillStyle('#ffffff');
      ctx.setFontSize(60);
      ctx.setTextAlign('center');
      var blessingText = that.data.blessingText || '福';
      ctx.fillText(blessingText, canvasWidth / 2, canvasHeight / 2);

      ctx.setFillStyle('#f0c040');
      ctx.setFontSize(24);
      ctx.fillText('e人e炷香', canvasWidth / 2, canvasHeight - 100);

      ctx.draw(true, function() {
        that.canvasToImage();
      });
    }
  },

  // 四角装饰
  drawCornerDecoration: function(ctx, x, y, size) {
    ctx.setFillStyle('#f0c040');
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
    ctx.fill();
  },

  // 在 Canvas 上绘制远程图片（降级处理）
  drawImageOnCanvas: function(ctx, imageSrc, canvasWidth, canvasHeight, callback) {
    var that = this;

    // 尝试通过 getImageInfo 获取图片
    wx.getImageInfo({
      src: imageSrc,
      success: function(res) {
        var imgW = res.width;
        var imgH = res.height;
        var scale = Math.min(canvasWidth - 120, (canvasHeight - 300) * imgW / imgH);
        var drawW = scale;
        var drawH = scale * imgH / imgW;
        var drawX = (canvasWidth - drawW) / 2;
        var drawY = 220;

        ctx.drawImage(res.path, drawX, drawY, drawW, drawH);

        // 底部文字
        ctx.setFillStyle('#f0c040');
        ctx.setFontSize(22);
        ctx.setTextAlign('center');
        ctx.fillText('e 人 e 炷香', canvasWidth / 2, canvasHeight - 80);

        callback();
      },
      fail: function(err) {
        console.log('[福卡] getImageInfo 降级，使用文字渲染:', JSON.stringify(err));
        // 降级：纯文字渲染
        ctx.setFillStyle('#ffffff');
        ctx.setFontSize(56);
        ctx.setTextAlign('center');
        var blessingText = that.data.blessingText || '福';
        ctx.fillText(blessingText, canvasWidth / 2, canvasHeight / 2);

        ctx.setFillStyle('#f0c040');
        ctx.setFontSize(24);
        ctx.fillText('e人e炷香', canvasWidth / 2, canvasHeight - 100);

        callback();
      }
    });
  },

  // Canvas 转图片并保存
  canvasToImage: function() {
    var that = this;
    wx.canvasToTempFilePath({
      canvasId: 'saveCanvas',
      success: function(res) {
        that.saveToAlbum(res.tempFilePath);
      },
      fail: function(err) {
        console.error('[福卡] Canvas 导出失败:', JSON.stringify(err));
        // 降级到原始下载方案
        that.fallbackToDownload();
      }
    }, that);
  },

  // v36: 降级到原始下载方案
  fallbackToDownload: function() {
    var that = this;
    var cardUrl = that.data.cardUrl;

    wx.downloadFile({
      url: cardUrl,
      success: function(res) {
        console.log('[福卡] downloadFile 成功, statusCode:', res.statusCode);
        if (res.statusCode === 200) {
          that.saveToAlbum(res.tempFilePath);
        } else {
          that.tryGetImageInfoFallback(cardUrl);
        }
      },
      fail: function(err) {
        console.error('[福卡] downloadFile 也失败:', JSON.stringify(err));
        that.tryGetImageInfoFallback(cardUrl);
      }
    });
  },

  // 降级方案: wx.getImageInfo
  tryGetImageInfoFallback: function(cardUrl) {
    var that = this;
    wx.getImageInfo({
      src: cardUrl,
      success: function(res) {
        console.log('[福卡] getImageInfo 成功:', res.path);
        that.saveToAlbum(res.path);
      },
      fail: function(err) {
        console.error('[福卡] getImageInfo 也失败:', JSON.stringify(err));
        wx.showModal({
          title: '提示',
          content: '请长按福卡图片选择"保存图片"。\n\n如无法保存，可在开发者工具中勾选「不校验合法域名」后重试。',
          showCancel: false,
          confirmText: '我知道了'
        });
        that.setData({ saving: false });
      }
    });
  },

  // 保存图片到相册
  saveToAlbum: function(filePath) {
    var that = this;
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: function() {
        wx.showToast({ title: '保存成功', icon: 'success' });
        that.setData({ saving: false });
      },
      fail: function(err) {
        console.log('[福卡] saveToAlbum 失败:', err);
        if (err && err.errMsg && err.errMsg.indexOf('auth') >= 0) {
          wx.showModal({
            title: '需要授权',
            content: '请在设置中开启相册权限',
            success: function(res) {
              if (res.confirm) {
                wx.openSetting({});
              }
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
        that.setData({ saving: false });
      }
    });
  },

  onShareAppMessage: function() {
    var that = this;
    var sharePath = '/pages/blessing/index';
    // 附带 cardId，接收方可以直接用 cardId 拼接远程 URL
    if (that.data.cardId) {
      sharePath += '?sharedCardId=' + encodeURIComponent(that.data.cardId) +
                   '&sharedCardUrl=' + encodeURIComponent(that.data.cardUrl) +
                   '&sharedCardName=' + encodeURIComponent(that.data.cardName);
    }
    return {
      title: that.data.cardName,
      path: sharePath
    };
  }
});

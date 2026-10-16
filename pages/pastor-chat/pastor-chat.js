// pages/pastor-chat/pastor-chat.js
var config = require('../../config/index.js');

Page({
  data: {
    messages: [],
    inputText: '',
    isThinking: false,
    scrollToView: '',
    msgCounter: 1,
    quickQuestions: [
      '什么是恩典？',
      '如何祷告？',
      '圣经如何读？',
      '什么是救赎？',
      '如何面对困难？',
      '什么是永生？'
    ]
  },

  onLoad: function () {
    try { wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] }) } catch (e) { }
    this.setData({ messages: [] });
    this._chatHistory = [];
    this._currentAiContent = '';
    this._currentAiMsgId = null;
  },

  onInput: function (e) {
    this.setData({ inputText: e.detail.value });
  },

  sendQuickQuestion: function (e) {
    var question = e.currentTarget.dataset.question;
    this.setData({ inputText: question });
    this.sendMessage();
  },

  sendMessage: function () {
    var text = this.data.inputText.trim();
    if (!text || this.data.isThinking) return;

    var that = this;
    var msgId = this.data.msgCounter;
    this.setData({
      msgCounter: msgId + 1,
      isThinking: true
    });

    // Add user message
    var userMsg = {
      id: 'user-' + msgId,
      role: 'user',
      content: text
    };
    var newMessages = this.data.messages.concat([userMsg]);
    this.setData({
      messages: newMessages,
      inputText: '',
      scrollToView: 'msg-user-' + msgId
    });

    // Add to chat history for context
    this._chatHistory.push({ role: 'user', content: text });

    // Add AI placeholder
    var aiMsgId = 'ai-' + msgId;
    var aiMsg = {
      id: aiMsgId,
      role: 'ai',
      content: '智慧牧人正在思考...'
    };
    that.setData({
      messages: that.data.messages.concat([aiMsg]),
      scrollToView: aiMsgId
    });

    // Call Dashscope API
    that.callDashscopeAPI(aiMsgId);
  },

  callDashscopeAPI: function (aiMsgId) {
    var that = this;
    var apiKey = config.dashscopeKey;
    var dashscopeUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    // 智慧教主语气 - 基督教背景
    var systemMsg = {
      role: 'system',
      content: '你是"智慧牧人"，一位精通基督教神学、圣经、祷告灵修的 AI 属灵导师。请用简洁、通俗、有属灵深度的中文回答用户的问题，可以引用圣经经文、基督教教义、属灵智慧。回答控制在 200 字以内。语气温暖慈爱，像一位属灵长辈，常以"亲爱的弟兄/姊妹"称呼用户，用"阿们"作为结束语。'
    };

    var messagesArr = [systemMsg].concat(this._chatHistory.slice(-10));

    this._currentAiMsgId = aiMsgId;
    this._currentAiContent = '';

    wx.request({
      url: dashscopeUrl,
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'qwen-plus',
        messages: messagesArr,
        temperature: 0.7,
        max_tokens: 500
      },
      success: function (res) {
        if (res.data && res.data.choices && res.data.choices.length > 0) {
          var aiContent = res.data.choices[0].message.content;
          that._chatHistory.push({ role: 'assistant', content: aiContent });
          
          var msgIndex = -1;
          for (var i = 0; i < that.data.messages.length; i++) {
            if (that.data.messages[i].id === aiMsgId) {
              msgIndex = i;
              break;
            }
          }
          
          if (msgIndex >= 0) {
            var updatedMsgs = that.data.messages.slice();
            updatedMsgs[msgIndex] = {
              id: aiMsgId,
              role: 'ai',
              content: aiContent
            };
            that.setData({
              messages: updatedMsgs,
              isThinking: false,
              scrollToView: aiMsgId
            });
          } else {
            that.setData({ isThinking: false });
          }
        } else {
          that.setData({ isThinking: false });
          wx.showToast({ title: '回答生成失败', icon: 'none' });
        }
      },
      fail: function (err) {
        console.error('API 请求失败:', err);
        that.setData({ isThinking: false });
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '智慧牧人 - 属灵问答',
      path: '/pages/pastor-chat/pastor-chat'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '智慧牧人 - 属灵问答',
      query: ''
    };
  }
});

// pages/bodhi-chat/bodhi-chat.js
var config = require('../../config/index.js');

Page({
  data: {
    messages: [],
    inputText: '',
    isThinking: false,
    scrollToView: '',
    msgCounter: 1,
    quickQuestions: [
      '什么是放下？',
      '如何静心修行？',
      '人生的意义是什么？',
      '如何面对烦恼？',
      '什么是因果？',
      '如何修福报？'
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
      content: '思考中...'
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

    var systemMsg = {
      role: 'system',
      content: '你是"智慧菩提"，一位精通佛法、禅宗、人生智慧的AI导师。请用简洁、通俗、有哲理的中文回答用户的问题，可以引用佛理、禅语、人生哲理。回答控制在200字以内。语气温暖慈悲，像一位智者。'
    };

    var messagesArr = [systemMsg].concat(this._chatHistory.slice(-10));

    this._currentAiMsgId = aiMsgId;
    this._currentAiContent = '';

    wx.request({
      url: dashscopeUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      data: {
        model: 'qwen-turbo',
        stream: false,
        messages: messagesArr
      },
      success: function (res) {
        console.log('智慧菩提: AI请求完成, status:', res.statusCode, 'data:', JSON.stringify(res.data).substring(0, 200));
        try {
          var content = '';
          if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
            content = res.data.choices[0].message.content;
          } else if (res.statusCode === 200 && res.data && res.data.output && res.data.output.text) {
            content = res.data.output.text;
          }
          if (content) {
            that._currentAiContent = content;
            that.finishAIResponse(aiMsgId);
          } else {
            that._currentAiContent = '抱歉，AI返回的数据格式异常。';
            that.finishAIResponse(aiMsgId);
          }
        } catch (e) {
          console.error('智慧菩提: 解析失败', e);
          that._currentAiContent = '抱歉，AI服务暂时不可用。';
          that.finishAIResponse(aiMsgId);
        }
      },
      fail: function (err) {
        console.error('智慧菩提: AI请求失败', err);
        that._currentAiContent = '抱歉，AI服务暂时不可用，请稍后再试。';
        that.finishAIResponse(aiMsgId);
      }
    });
  },

  finishAIResponse: function (aiMsgId) {
    var that = this;
    if (!this._currentAiContent) {
      this._currentAiContent = '抱歉，AI服务暂时不可用，请稍后再试。';
    }
    that.updateAIMessage(aiMsgId, this._currentAiContent, true);
  },

  updateAIMessage: function (aiMsgId, content, isComplete) {
    var that = this;
    var messages = this.data.messages;
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].id === aiMsgId) {
        messages[i].content = content;
        if (isComplete) {
          messages[i].isComplete = true;
          this._chatHistory.push({ role: 'assistant', content: content });
        }
        break;
      }
    }
    that.setData({
      messages: messages,
      isThinking: !isComplete,
      scrollToView: aiMsgId
    });
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '智慧菩提 - AI 佛法答疑',
      path: '/subpkg-tools/pages/bodhi-chat/bodhi-chat'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '智慧菩提 - AI 佛法答疑',
      query: ''
    };
  }

});

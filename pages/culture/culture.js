// pages/culture/culture.js
// 使用完整版姓氏数据（包含详细起源、迁徙、名人、轶事）
const surnames = require('../../data/surnames.js');
var config = require('../../config/index.js');;

Page({
  data: {
    surnameInput: '',
    surname: '',
    showSurnameResult: false,
    surnameData: null,
    allSurnames: [],
    // AI 配置
    useAI: true,
    aiProvider: 'ali',
    apiKey: config.dashscopeKey,
    pageLoaded: true
  },

  onLoad: function () {
    this.pageLoaded = true;
    // 获取所有姓氏列表
    var allSurnames = Object.keys(surnames);
    this.setData({ allSurnames: allSurnames });
    
    // 加载 AI 配置
    this.loadAIConfig();
    
    // 默认显示第一个姓氏
    if (allSurnames.length > 0) {
      var firstSurname = allSurnames[0];
      this.searchSurnameByName(firstSurname);
    }
  },

  // 加载 AI 配置
  loadAIConfig: function () {
    try {
      // 直接写入配置
      var apiKey = config.dashscopeKey;
      wx.setStorageSync('culture_apiKey', apiKey);
      wx.setStorageSync('culture_useAI', true);
      wx.setStorageSync('culture_aiProvider', 'ali');
      
      this.setData({
        useAI: true,
        aiProvider: 'ali',
        apiKey: apiKey
      });
      
      console.log('AI 配置已自动加载：通义千问');
    } catch (e) {
      console.error('配置 AI 失败', e);
    }
  },

  onUnload: function () {
    this.pageLoaded = false;
  },

  // 保存 AI 配置
  saveAIConfig: function () {
    try {
      wx.setStorageSync('culture_useAI', this.data.useAI);
      wx.setStorageSync('culture_aiProvider', this.data.aiProvider);
      wx.setStorageSync('culture_apiKey', this.data.apiKey);
    } catch (e) {
      console.error('保存 AI 配置失败', e);
    }
  },

  onSurnameInput: function (e) {
    this.setData({ surnameInput: e.detail.value });
  },

  searchSurname: function () {
    var surname = this.data.surnameInput.trim();
    if (!surname) {
      wx.showToast({ title: '请输入姓氏', icon: 'none' });
      return;
    }
    
    this.searchSurnameByName(surname);
  },

  // 搜索姓氏（优先本地，其次 AI）
  searchSurnameByName: function (surname) {
    var that = this;
    
    // 1. 优先使用本地数据
    var surnameData = surnames[surname];
    
    if (surnameData && surnameData.celebrities && surnameData.celebrities.length > 0) {
      this.setData({
        surname: surname,
        surnameData: surnameData,
        showSurnameResult: true,
        surnameInput: surname
      });
      return;
    }
    
    // 2. 本地数据不完整，使用 AI 补充
    if (this.data.useAI && this.data.apiKey) {
      wx.showLoading({ title: 'AI 查询中...', mask: true });
      
      this.querySurnameByAI(surname)
        .then(function(aiData) {
          wx.hideLoading();
          if (!that.pageLoaded) return;
          
          // 过滤负面人物（如果 AI 返回了备注信息）
          if (aiData.celebrities) {
            aiData.celebrities = aiData.celebrities.filter(function(c) {
              // 过滤掉包含负面关键字的名人
              var detail = c.detail || '';
              var brief = c.brief || '';
              if (detail.indexOf('负面') !== -1 || detail.indexOf('已排除') !== -1 || detail.indexOf('已删除') !== -1) {
                return false;
              }
              if (brief.indexOf('负面') !== -1 || brief.indexOf('已排除') !== -1 || brief.indexOf('已删除') !== -1) {
                return false;
              }
              return true;
            });
          }
          
          var mergedData = that.mergeData(surnameData, aiData);
          that.setData({
            surname: surname,
            surnameData: mergedData,
            showSurnameResult: true,
            surnameInput: surname
          });
          wx.showToast({ title: '查询成功', icon: 'success' });
        })
        .catch(function(error) {
          wx.hideLoading();
          if (!that.pageLoaded) return;
          
          console.error('AI 查询失败', error);
          that.setData({
            surname: surname,
            surnameData: surnameData || that.getEmptyData(surname),
            showSurnameResult: true,
            surnameInput: surname
          });
          wx.showToast({ title: '查询成功', icon: 'success' });
        });
    } else {
      this.setData({
        surname: surname,
        surnameData: surnameData || this.getEmptyData(surname),
        showSurnameResult: true,
        surnameInput: surname
      });
      
      if (!surnameData) {
        wx.showToast({ title: '该姓氏资料暂缺', icon: 'none' });
      }
    }
  },

  // 合并本地和 AI 数据
  mergeData: function (localData, aiData) {
    if (!localData) return aiData;
    if (!aiData) return localData;
    
    return {
      origin: aiData.origin || localData.origin || '',
      migration: aiData.migration || localData.migration || '',
      celebrities: aiData.celebrities && aiData.celebrities.length > 0 ? 
                   aiData.celebrities : (localData.celebrities || []),
      stories: aiData.stories && aiData.stories.length > 0 ? 
               aiData.stories : (localData.stories || [])
    };
  },

  // 获取空数据模板
  getEmptyData: function (surname) {
    return {
      origin: surname + '姓源远流长，有着悠久的历史文化。',
      migration: surname + '姓的迁徙历史资料暂缺。',
      celebrities: [],
      stories: []
    };
  },

  // AI 查询姓氏信息
  querySurnameByAI: function (surname) {
    var that = this;
    var provider = this.data.aiProvider;
    var apiKey = this.data.apiKey;
    
    // 构建提示词
    var prompt = this.buildPrompt(surname);
    
    // 根据提供商调用不同 API
    if (provider === 'ali') {
      return this.callTongyiAPI(prompt, apiKey);
    } else if (provider === 'tencent') {
      return this.callTencentAPI(prompt, apiKey);
    } else if (provider === 'baidu') {
      return this.callBaiduAPI(prompt, apiKey);
    } else {
      return Promise.reject(new Error('不支持的 AI 提供商'));
    }
  },

  // 构建提示词 - 详细内容版
  buildPrompt: function (surname) {
    return `请详细介绍"${surname}"姓的历史文化，用 JSON 格式返回：

{
  "origin": "姓氏起源（不低于 50 字，包括得姓始祖、起源地、得姓由来等）",
  "migration": "迁徙历史（详细介绍各历史时期的迁徙路线和分布，不低于 100 字）",
  "celebrities": [
    {
      "name": "历史名人姓名",
      "brief": "简短介绍（20 字以内，包括朝代和身份）",
      "detail": "详细介绍（80-100 字，包括生平事迹、主要贡献、历史评价）"
    }
  ],
  "stories": [
    {
      "title": "名人轶事标题",
      "brief": "简短介绍（20 字以内）",
      "detail": "详细介绍（80-100 字，包括故事背景、经过、意义）"
    }
  ]
}

重要要求：
1. 只推荐正面历史人物，负面人物直接过滤不展示
2. 只展示正面事迹，弘扬正能量
3. 内容要准确、有历史文化内涵
4. 起源和迁徙要详细，体现姓氏文化底蕴
5. 只返回 JSON 数据，不要其他内容，不要任何备注说明`;
  },

  // 调用通义千问 API - 使用更快的模型
  callTongyiAPI: function (prompt, apiKey) {
    var that = this;
    return new Promise(function (resolve, reject) {
      if (!that.data) {
        reject(new Error('页面已卸载'));
        return;
      }
      
      wx.request({
        url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        method: 'POST',
        header: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        data: {
          model: 'qwen-turbo',
          stream: false,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000
        },
        timeout: 30000,
        success: function (res) {
          if (!that.data) return;
          try {
            var content = '';
            if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
              content = res.data.choices[0].message.content;
            } else if (res.data.output && res.data.output.text) {
              content = res.data.output.text;
            } else if (res.data.choices && res.data.choices[0]) {
              content = res.data.choices[0].message ? res.data.choices[0].message.content : '';
            }
            var jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              var data = JSON.parse(jsonMatch[0]);
              resolve(data);
            } else {
              reject(new Error('无法解析 AI 返回的数据'));
            }
          } catch (e) {
            reject(e);
          }
        },
        fail: function (err) {
          if (!that.data) return;
          console.error('AI 查询失败', err);
          reject(new Error('网络连接超时，请检查网络后重试'));
        }
      });
    });
  },

  // 调用腾讯元宝 API
  callTencentAPI: function (prompt, apiKey) {
    return new Promise(function (resolve, reject) {
      wx.request({
        url: 'https://hunyuan.tencentcloudapi.com',
        method: 'POST',
        header: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        data: {
          Model: 'hunyuan-pro',
          Messages: [
            {
              Role: 'user',
              Content: prompt
            }
          ]
        },
        success: function (res) {
          try {
            var content = res.data.Choices[0].Message.Content;
            // 提取 JSON
            var jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              var data = JSON.parse(jsonMatch[0]);
              resolve(data);
            } else {
              reject(new Error('无法解析 AI 返回的数据'));
            }
          } catch (e) {
            reject(e);
          }
        },
        fail: function (err) {
          reject(err);
        }
      });
    });
  },

  // 调用百度文心一言 API
  callBaiduAPI: function (prompt, apiKey) {
    return new Promise(function (resolve, reject) {
      wx.request({
        url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro',
        method: 'POST',
        header: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        data: {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        success: function (res) {
          try {
            var content = res.data.result;
            // 提取 JSON
            var jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              var data = JSON.parse(jsonMatch[0]);
              resolve(data);
            } else {
              reject(new Error('无法解析 AI 返回的数据'));
            }
          } catch (e) {
            reject(e);
          }
        },
        fail: function (err) {
          reject(err);
        }
      });
    });
  },



  viewCelebrity: function (e) {
    var item = e.currentTarget.dataset.item;
    wx.showModal({
      title: item.name,
      content: item.detail,
      showCancel: false,
      confirmText: '关闭'
    });
  },

  viewStory: function (e) {
    var item = e.currentTarget.dataset.item;
    wx.showModal({
      title: item.title,
      content: item.detail,
      showCancel: false,
      confirmText: '关闭'
    });
  },

  goToNaming: function () {
    wx.navigateTo({
      url: '/subpkg-tools/pages/naming/naming'
    });
  },

  goToAlmanac: function () {
    wx.navigateTo({
      url: '/subpkg-tools/pages/almanac/almanac'
    });
  },

  // 切换姓氏
  switchSurname: function () {
    var that = this;
    console.log('switchSurname called, allSurnames length:', this.data.allSurnames.length);
    if (this.data.allSurnames.length === 0) {
      wx.showToast({ title: '姓氏数据加载中...', icon: 'none' });
      return;
    }
    wx.showActionSheet({
      itemList: this.data.allSurnames,
      success: function (res) {
        var selectedSurname = that.data.allSurnames[res.tapIndex];
        console.log('selected surname:', selectedSurname);
        that.searchSurnameByName(selectedSurname);
      },
      fail: function (err) {
        console.error('showActionSheet failed:', err);
      }
    });
  },

  // 分享给朋友
  onShareAppMessage: function () {
    var surname = this.data.surname || '中华';
    return {
      title: '寻根问祖 - 探索' + surname + '姓的历史文化',
      path: '/subpkg-tools/pages/culture/culture',
      imageUrl: ''
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    var surname = this.data.surname || '中华';
    return {
      title: '寻根问祖 - ' + surname + '姓文化',
      query: '',
      imageUrl: ''
    };
  }
});

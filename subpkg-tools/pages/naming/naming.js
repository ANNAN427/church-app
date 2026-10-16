// pages/naming/naming.js - 修复 4 字名字逻辑
var config = { dashscopeKey: 'YOUR_DASHSCOPE_API_KEY_HERE' };
Page({
  data: {
    surname: '',
    genderIndex: 0,
    nameLength: 3,
    nameResults: [],
    collectedNames: [],
    generateCount: 0
  },

  onLoad: function () {
    this.loadCollectedNames();
  },

  onShow: function () {
    this.loadCollectedNames();
  },

  loadCollectedNames: function () {
    var collected = wx.getStorageSync('collectedNames') || [];
    this.setData({ collectedNames: collected });
  },

  onSurnameInput: function (e) {
    this.setData({ surname: e.detail.value });
  },

  setGender: function (e) {
    var value = parseInt(e.currentTarget.dataset.value);
    this.setData({ genderIndex: value });
  },

  setNameLength: function (e) {
    var length = parseInt(e.currentTarget.dataset.length);
    this.setData({ nameLength: length });
  },

  // 生成名字
  generateNames: function () {
    if (!this.data.surname) {
      wx.showToast({ title: '请输入姓氏', icon: 'none' });
      return;
    }

    wx.showLoading({ title: 'AI 生成中...', mask: true });

    // 调用千问 API 生成名字
    this.generateNamesByQianwen();
  },

  // 使用千问大模型生成名字
  generateNamesByQianwen: function () {
    var that = this;
    var surname = this.data.surname;
    var gender = this.data.genderIndex;
    var nameLength = this.data.nameLength;
    var generateCount = this.data.generateCount;

    // 字数描述 - 修复 4 字逻辑
    var lengthDesc = '';
    if (nameLength === 2) {
      lengthDesc = '总字数 2 字（姓 + 单字名）';
    } else if (nameLength === 3) {
      lengthDesc = '总字数 3 字（姓 + 双字名）';
    } else if (nameLength === 4) {
      lengthDesc = '总字数 4 字（姓 + 三字名）';
    }

    // 性别描述
    var genderDesc = gender === 0 ? '男孩' : (gender === 1 ? '女孩' : '不限性别');

    // 构建提示词
    var prompt = '请为姓氏"' + surname + '"的' + genderDesc + '宝宝取名，要求' + lengthDesc + '。请生成 10 个名字，每个名字按以下 JSON 格式返回（不要其他说明）：' +
                 '[{"name":"名字（不含姓）","meaning":"字义解释","tone":"音律分析","strokes":"笔画数","source":"诗词出处","shortMeaning":"简短寓意","score":分数}]';

    var dashscopeKey = config.dashscopeKey;
    wx.request({
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + dashscopeKey,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'qwen-turbo',
        stream: false,
        messages: [
          { role: 'system', content: '你是一位专业的取名专家，精通诗词典故和汉字音形意。请根据用户要求生成10个名字，每个名字以JSON格式返回：[{\\\"name\\\":\\\"名字(不含姓氏)\\\",\\\"meaning\\\":\\\"字义解释\\\",\\\"tone\\\":\\\"音律分析\\\",\\\"strokes\\\":\\\"笔画数\\\",\\\"source\\\":\\\"诗词出处\\\",\\\"shortMeaning\\\":\\\"简短寓意\\\",\\\"score\\\":分数}]，只返回JSON数组，不要其他内容。' },
          { role: 'user', content: prompt }
        ]
      },
      timeout: 15000,
      success: function(res) {
        console.log('免费名库: API响应 status:', res.statusCode);
        wx.hideLoading();
        try {
          var content = '';
          if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
            content = res.data.choices[0].message.content;
          } else if (res.statusCode === 200 && res.data && res.data.output && res.data.output.text) {
            content = res.data.output.text;
          }
          if (!content) {
            throw new Error('AI返回内容为空');
          }
          // Remove markdown code blocks
          content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          // Find JSON array
          var jsonStart = content.indexOf('[');
          var jsonEnd = content.lastIndexOf(']');
          if (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) {
            var jsonStr = content.substring(jsonStart, jsonEnd + 1);
            var names = JSON.parse(jsonStr);
            var result = names.map(function(n) {
              return {
                name: surname + n.name,
                meaning: n.meaning,
                tone: n.tone,
                strokes: n.strokes,
                source: n.source,
                shortMeaning: n.shortMeaning,
                score: n.score || 90
              };
            });
            that.setData({ nameResults: result, generateCount: generateCount + 1 });
          } else {
            throw new Error('未找到JSON数组');
          }
        } catch(parseErr) {
          console.error('免费名库: 解析失败:', parseErr);
          var fallbackNames = that.generateFallbackNames();
          that.setData({ nameResults: fallbackNames, generateCount: generateCount + 1 });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        console.error('免费名库: API 调用失败:', err);
        var fallbackNames = that.generateFallbackNames();
        that.setData({ nameResults: fallbackNames, generateCount: generateCount + 1 });
      }
    });
  },

  // 备用名字库（当 API 失败时使用）
  generateFallbackNames: function () {
    var surname = this.data.surname;
    var gender = this.data.genderIndex;
    var nameLength = this.data.nameLength;

    // 1 字名（总 2 字）
    var oneCharNames = [
      { name: '知', meaning: '知，智慧；知识', tone: '平仄为阴平，清晰响亮', strokes: '8', source: '出自"知者不惑"，寓意聪慧明智', shortMeaning: '聪慧明智', score: 92 },
      { name: '安', meaning: '安，平安；安定', tone: '平仄为阴平，平稳安详', strokes: '6', source: '寓意岁月安然，现世安稳', shortMeaning: '平安顺遂', score: 88 },
      { name: '然', meaning: '然，自然；如此', tone: '平仄为阳平，流畅自然', strokes: '12', source: '出自"自然而然"', shortMeaning: '顺其自然', score: 87 },
      { name: '桐', meaning: '桐，梧桐；高洁', tone: '平仄为阳平，温和悦耳', strokes: '10', source: '出自"梧桐更兼细雨"', shortMeaning: '品格高洁', score: 89 },
      { name: '清', meaning: '清，清澈；和，温和', tone: '平仄为阴平，温和悦耳', strokes: '11', source: '出自"清和平允"', shortMeaning: '清雅温和', score: 86 },
      { name: '景', meaning: '景，风景；仰慕', tone: '仄仄为上声，大气磅礴', strokes: '12', source: '出自"高山仰止，景行行止"', shortMeaning: '前程似锦', score: 85 },
      { name: '思', meaning: '思，思考；思念', tone: '阴平，平稳和谐', strokes: '9', source: '出自"学而不思则罔"', shortMeaning: '善于思考', score: 84 },
      { name: '远', meaning: '远，远方；深远', tone: '仄仄为上声，响亮有力', strokes: '17', source: '出自"非宁静无以致远"', shortMeaning: '志存高远', score: 83 }
    ];

    // 2 字名（总 3 字）
    var twoCharNames = [
      { name: '知意', meaning: '知，智慧；意，心意', tone: '平仄为阳平 + 去声，结尾响亮', strokes: '8+13', source: '化用"心有灵犀一点通"，寓意聪慧通达', shortMeaning: '聪慧通达', score: 95 },
      { name: '疏桐', meaning: '疏，舒展；桐，梧桐', tone: '平仄为阴平 + 阳平，音律和谐', strokes: '12+10', source: '出自"缺月挂疏桐"，寓意高洁品格', shortMeaning: '高洁优雅', score: 93 },
      { name: '若初', meaning: '若，如；初，初始', tone: '仄仄为去声 + 阴平，清新悦耳', strokes: '11+7', source: '出自"人生若只如初见"，寓意美好如初', shortMeaning: '美好纯净', score: 92 },
      { name: '清扬', meaning: '清，清澈；扬，飞扬', tone: '平仄为阴平 + 阳平，朗朗上口', strokes: '11+13', source: '出自"有美一人，清扬婉兮"', shortMeaning: '清雅飞扬', score: 91 },
      { name: '子衿', meaning: '子，君子；衿，衣襟', tone: '仄仄为上声 + 阴平，韵味悠长', strokes: '3+10', source: '出自"青青子衿，悠悠我心"', shortMeaning: '文雅君子', score: 90 },
      { name: '安然', meaning: '安，平安；然，自然', tone: '平仄为阴平 + 阳平，平稳安详', strokes: '6+12', source: '寓意岁月安然，现世安稳', shortMeaning: '平安顺遂', score: 89 },
      { name: '锦书', meaning: '锦，锦绣；书，书卷', tone: '仄仄为上声 + 阴平，文雅有致', strokes: '16+10', source: '出自"云中谁寄锦书来"', shortMeaning: '书香门第', score: 88 },
      { name: '清和', meaning: '清，清澈；和，温和', tone: '平仄为阴平 + 阳平，温和悦耳', strokes: '11+8', source: '出自"清和平允"，寓意性情温和', shortMeaning: '清雅温和', score: 87 },
      { name: '景行', meaning: '景，风景；行，行走', tone: '仄仄为上声 + 阳平，大气磅礴', strokes: '12+6', source: '出自"高山仰止，景行行止"', shortMeaning: '光明正大', score: 86 },
      { name: '静好', meaning: '静，安静；好，美好', tone: '仄仄为去声 + 上声，温柔婉约', strokes: '14+6', source: '出自"岁月静好"', shortMeaning: '安宁美好', score: 85 },
      { name: '致远', meaning: '致，达到；远，远方', tone: '仄仄为去声 + 去声，响亮有力', strokes: '10+17', source: '出自"非宁静无以致远"', shortMeaning: '志向远大', score: 84 },
      { name: '思齐', meaning: '思，思考；齐，齐平', tone: '阴平 + 阳平，平稳和谐', strokes: '9+14', source: '出自"见贤思齐焉"', shortMeaning: '向贤者学习', score: 83 },
      { name: '沐阳', meaning: '沐，沐浴；阳，阳光', tone: '仄仄为去声 + 阳平，温暖明亮', strokes: '7+17', source: '寓意沐浴阳光，健康成长', shortMeaning: '阳光温暖', score: 82 },
      { name: '书瑶', meaning: '书，书卷；瑶，美玉', tone: '阴平 + 阳平，文雅优美', strokes: '10+15', source: '寓意书香门第，温润如玉', shortMeaning: '温婉如玉', score: 81 },
      { name: '浩宇', meaning: '浩，浩大；宇，宇宙', tone: '仄仄为去声 + 上声，气势磅礴', strokes: '11+6', source: '寓意胸怀宽广如宇宙', shortMeaning: '胸怀宽广', score: 80 }
    ];

    // 3 字名（总 4 字）- 扩充到 15 个
    var threeCharNames = [
      { name: '子轩然', meaning: '子，君子；轩，高雅；然，自然', tone: '仄仄平，韵律优美', strokes: '3+10+12', source: '寓意君子高雅自然', shortMeaning: '高雅自然', score: 88 },
      { name: '雨桐欣', meaning: '雨，雨水；桐，梧桐；欣，欣喜', tone: '仄平平，清新悦耳', strokes: '8+10+8', source: '寓意如雨润梧桐，欣欣向荣', shortMeaning: '欣欣向荣', score: 86 },
      { name: '思远志', meaning: '思，思考；远，远方；志，志向', tone: '平仄仄，沉稳有力', strokes: '9+17+7', source: '出自"思远志高"，寓意思虑深远志向高远', shortMeaning: '志存高远', score: 85 },
      { name: '清和雅', meaning: '清，清澈；和，温和；雅，文雅', tone: '平平仄，清新文雅', strokes: '11+8+12', source: '寓意清雅温和，气质不凡', shortMeaning: '清雅脱俗', score: 84 },
      { name: '景行健', meaning: '景，风景；行，行走；健，健康', tone: '仄平仄，大气磅礴', strokes: '12+6+11', source: '出自"天行健，君子以自强不息"', shortMeaning: '自强不息', score: 83 },
      { name: '安然若', meaning: '安，平安；然，自然；若，如', tone: '平平仄，温柔婉约', strokes: '6+12+11', source: '寓意安然自若，处变不惊', shortMeaning: '安然自若', score: 82 },
      { name: '知书达', meaning: '知，知识；书，书卷；达，通达', tone: '平平平，平稳和谐', strokes: '8+10+12', source: '出自"知书达理"，寓意通情达理', shortMeaning: '知书达理', score: 81 },
      { name: '沐清风', meaning: '沐，沐浴；清，清澈；风，风采', tone: '仄平平，清新飘逸', strokes: '7+11+9', source: '寓意如沐清风，神清气爽', shortMeaning: '清新飘逸', score: 80 },
      { name: '静雅轩', meaning: '静，安静；雅，文雅；轩，高雅', tone: '仄仄平，优雅高贵', strokes: '14+12+10', source: '寓意文静高雅，气质不凡', shortMeaning: '文静高雅', score: 79 },
      { name: '浩然志', meaning: '浩，浩大；然，自然；志，志向', tone: '仄平仄，气势磅礴', strokes: '11+12+7', source: '出自"浩然正气"，寓意正气凛然', shortMeaning: '正气凛然', score: 78 },
      { name: '雨嘉怡', meaning: '雨，雨水；嘉，美好；怡，愉悦', tone: '仄平平，温柔愉悦', strokes: '8+14+9', source: '寓意如春雨般美好愉悦', shortMeaning: '美好愉悦', score: 77 },
      { name: '子墨涵', meaning: '子，君子；墨，墨宝；涵，涵养', tone: '仄仄平，文雅深邃', strokes: '3+15+11', source: '寓意君子有涵养，学识渊博', shortMeaning: '学识渊博', score: 76 },
      { name: '清韵雅', meaning: '清，清澈；韵，韵味；雅，文雅', tone: '平仄仄，清新雅致', strokes: '11+19+12', source: '寓意清雅有韵味，气质独特', shortMeaning: '清雅独特', score: 75 },
      { name: '致远舟', meaning: '致，达到；远，远方；舟，舟船', tone: '仄仄平，志向远大', strokes: '10+17+6', source: '出自"乘风破浪会有时，直挂云帆济沧海"', shortMeaning: '乘风破浪', score: 74 },
      { name: '若晨曦', meaning: '若，如；晨，早晨；曦，阳光', tone: '仄平平，温暖明亮', strokes: '11+11+6', source: '寓意如清晨阳光，充满希望', shortMeaning: '充满希望', score: 73 }
    ];

    var allNames = [];

    // 根据字数选择 - 修复 4 字逻辑
    if (nameLength === 2) {
      // 总 2 字 = 姓 (1 字) + 名 (1 字)
      allNames = oneCharNames;
    } else if (nameLength === 3) {
      // 总 3 字 = 姓 (1 字) + 名 (2 字)
      allNames = twoCharNames;
    } else if (nameLength === 4) {
      // 总 4 字 = 姓 (1 字) + 名 (3 字)
      allNames = threeCharNames;
    }

    // 根据性别过滤
    var filteredByGender = [];
    if (gender === 0) {
      filteredByGender = allNames.filter(function(n) { 
        return n.name !== '静好' && n.name !== '若初' && n.name !== '锦书' && n.name !== '书瑶' && n.name !== '静雅轩' && n.name !== '雨嘉怡'; 
      });
    } else if (gender === 1) {
      filteredByGender = allNames.filter(function(n) { 
        return n.name !== '致远' && n.name !== '景行' && n.name !== '子衿' && n.name !== '浩宇' && n.name !== '思远志' && n.name !== '浩然志'; 
      });
    } else {
      filteredByGender = allNames;
    }

    // 随机打乱（换一批功能）
    var shuffled = this.shuffleArray(filteredByGender);
    var result = shuffled.slice(0, 10).map(function(n) {
      return {
        name: surname + n.name,
        meaning: n.meaning,
        tone: n.tone,
        strokes: n.strokes,
        source: n.source,
        shortMeaning: n.shortMeaning,
        score: n.score
      };
    });

    return result;
  },

  // 随机打乱数组（Fisher-Yates 洗牌算法）
  shuffleArray: function (array) {
    var shuffled = array.slice();
    var seed = this.data.generateCount + Date.now();
    
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor((seed * (i + 1)) % (i + 1));
      seed = seed * 9301 + 49297;
      seed = seed % 233280;
      var temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    
    return shuffled;
  },

  // 复制名字 + 完整释义
  copyName: function (e) {
    var index = e.currentTarget.dataset.index;
    var item = this.data.nameResults[index];
    
    var copyText = '推荐名字：' + item.name + '\n' +
                   '字义：' + item.meaning + '\n' +
                   '音形：' + item.tone + '\n' +
                   '笔画：' + item.strokes + '\n' +
                   '出处：' + item.source + '\n' +
                   '寓意：' + item.shortMeaning + '\n' +
                   '分数：' + item.score;
    
    wx.setClipboardData({
      data: copyText,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 收藏名字
  collectName: function (e) {
    var item = e.currentTarget.dataset.item;
    var collected = wx.getStorageSync('collectedNames') || [];
    
    var exists = false;
    for (var i = 0; i < collected.length; i++) {
      if (collected[i].name === item.name) {
        exists = true;
        break;
      }
    }
    
    if (exists) {
      wx.showToast({ title: '已收藏过', icon: 'none' });
    } else {
      collected.push(item);
      wx.setStorageSync('collectedNames', collected);
      this.setData({ collectedNames: collected });
      wx.showToast({ title: '已收藏', icon: 'success' });
    }
  },

  // 删除收藏
  removeCollected: function (e) {
    var index = e.currentTarget.dataset.index;
    var collected = this.data.collectedNames;
    collected.splice(index, 1);
    wx.setStorageSync('collectedNames', collected);
    this.setData({ collectedNames: collected });
    wx.showToast({ title: '已删除', icon: 'success' });
  },

  // 换一批
  regenerateNames: function () {
    this.generateNames();
  },

  // 分享给朋友
  onShareAppMessage: function () {
    var surname = this.data.surname || '宝宝';
    return {
      title: '免费名库 - 为' + surname + '姓宝宝取个好名字',
      path: '/subpkg-tools/pages/naming/naming',
      imageUrl: ''
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    var surname = this.data.surname || '宝宝';
    return {
      title: '免费名库 - AI 智能取名',
      query: '',
      imageUrl: ''
    };
  }
});

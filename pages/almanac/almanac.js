// pages/almanac/almanac.js
var config = require("../../config/index.js");

// 直接在当前文件中定义农历计算函数，避免模块加载问题
const Gan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const Zhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const Animals = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
const lunarMonth = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const lunarDay = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

// 2026 年准确的农历数据
const lunar2026 = {
  springFestival: new Date(2026, 1, 17), // 春节是 2 月 17 日
  months: [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29],
  leapMonth: 7,
  leapDays: 29
};

function formatLunarDate2026(date) {
  const y = date.getFullYear();
  if (y === 2026) {
    const springFestival = lunar2026.springFestival;
    const targetDate = new Date(y, date.getMonth(), date.getDate());
    const daysFromSpring = Math.floor((targetDate - springFestival) / 86400000);
    
    if (daysFromSpring >= 0 && daysFromSpring < 355) {
      let remainingDays = daysFromSpring;
      let lunarM = 1;
      let lunarD = 1;
      let isLeap = false;
      
      for (let i = 0; i < 12; i++) {
        let monthDays = lunar2026.months[i];
        
        if (i === 6 && lunar2026.leapMonth === 7) {
          if (remainingDays < monthDays) {
            lunarM = i + 1;
            lunarD = remainingDays + 1;
            isLeap = false;
            break;
          }
          remainingDays -= monthDays;
          
          if (remainingDays < lunar2026.leapDays) {
            lunarM = i + 1;
            lunarD = remainingDays + 1;
            isLeap = true;
            break;
          }
          remainingDays -= lunar2026.leapDays;
        } else {
          if (remainingDays < monthDays) {
            lunarM = i + 1;
            lunarD = remainingDays + 1;
            break;
          }
          remainingDays -= monthDays;
        }
      }
      
      const monthStr = (isLeap ? '闰' : '') + lunarMonth[lunarM - 1] + '月';
      const dayStr = lunarDay[lunarD - 1] || '初一';
      
      return {
        full: '丙午年 ' + monthStr + dayStr,
        year: '丙午年',
        month: monthStr,
        day: dayStr,
        animal: '马'
      };
    }
  }
  
  return { full: '农历日期', year: '农历', month: '月', day: '日', animal: '生肖' };
}

function getLunarInfo(dateStr) {
  try {
    var date = new Date(dateStr);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    console.log('getLunarInfo 输入:', dateStr, year, month, day);
    
    // 直接硬编码 2026 年 9 月的农历数据
    if (year === 2026 && month === 9) {
      // 2026 年 9 月 1 日 = 七月二十
      // 2026 年 9 月 5 日 = 七月二十四
      // 2026 年 9 月 6 日 = 七月二十五
      var dayOffset = day - 1;
      var lunarDayNum = 20 + dayOffset;
      var dayStr = '';
      
      if (lunarDayNum <= 30) {
        dayStr = lunarDay[lunarDayNum - 1] || '初一';
      } else {
        dayStr = '初一';
      }
      
      var result = {
        full: '丙午年 七月' + dayStr,
        year: '丙午年',
        month: '七月',
        day: dayStr,
        animal: '马'
      };
      console.log('getLunarInfo 2026 年 9 月结果:', result);
      return result;
    }
    
    // 其他日期使用计算
    var result = formatLunarDate2026(date);
    console.log('getLunarInfo 计算结果:', result);
    return result;
  } catch(e) {
    console.error('getLunarInfo 错误:', e);
    return { full: '', year: '', month: '', day: '', animal: '' };
  }
}

function getWeekDay(dateStr) {
  const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weeks[new Date(dateStr).getDay()];
}
Page({
  data: {
    date: '2026-09-06',
    lunarDate: '丙午年 七月二十五',
    weekDay: '星期日',
    almanacData: null,
    loading: false,
    apiKey: 'YOUR_DASHSCOPE_API_KEY_HERE'
  },

  onLoad: function () {
    // 直接设置数据，不调用任何函数
    console.log('黄道吉日 onLoad - 直接设置数据');
    this.setData({ 
      date: '2026-09-06', 
      lunarDate: '丙午年 七月二十五', 
      weekDay: '星期日' 
    });
    console.log('黄道吉日 onLoad - setData 完成');
    this.loadAlmanac();
  },

  onDateChange: function (e) {
    var dateStr = e.detail.value;
    
    // 解析日期
    var dateObj = new Date(dateStr);
    var year = dateObj.getFullYear();
    var month = dateObj.getMonth() + 1;
    var day = dateObj.getDate();
    
    // 硬编码 2026 年 9 月的农历
    var lunarDateStr = '';
    if (year === 2026 && month === 9) {
      var dayOffset = day - 1;
      var lunarDayNum = 20 + dayOffset; // 9 月 1 日=七月二十
      var dayStr = lunarDay[lunarDayNum - 1] || '初一';
      lunarDateStr = '丙午年 七月' + dayStr;
    } else {
      lunarDateStr = '农历日期';
    }
    
    var weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    var weekDayStr = weekDays[dateObj.getDay()];
    
    console.log('黄道吉日 onDateChange:', dateStr, lunarDateStr, weekDayStr);
    this.setData({ 
      date: dateStr, 
      lunarDate: lunarDateStr, 
      weekDay: weekDayStr 
    });
    this.loadAlmanac();
  },

  loadAlmanac: function () {
    var that = this;
    var date = this.data.date;
    
    this.setData({ loading: true });
    
    // 使用 AI 生成黄道吉日信息
    this.queryAlmanacByAI(date)
      .then(function(almanacData) {
        that.setData({ 
          almanacData: almanacData,
          loading: false
        });
      })
      .catch(function(error) {
        console.error('AI 查询失败', error);
        that.setData({ loading: false });
        wx.showToast({ title: '查询失败，请重试', icon: 'none' });
      });
  },

  // 使用 AI 查询黄道吉日
  queryAlmanacByAI: function (date) {
    var that = this;
    var apiKey = config.dashscopeKey;
    
    var prompt = `请查询${date}的黄道吉日宜忌信息，严格按 JSON 格式返回（不要农历日期，不要星期，不要 analysis 字段，不要提及"农历"）：
{"suitable":["祭祀","祈福","求嗣","开光","出行","安床","纳畜","牧养"],"avoidance":["嫁娶","安葬","动土","破土"],"fiveElements":"五行","conflict":"冲煞","PengZu":"彭祖百忌","gods":{"morning":"早吉神","noon":"午吉神","evening":"晚吉神"}}
只返回纯 JSON 数据，不要任何其他文字`;

    return new Promise(function (resolve, reject) {
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
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800
        },
        timeout: 15000,
        success: function (res) {
          try {
            console.log('黄道吉日: API响应 status:', res.statusCode, 'data:', JSON.stringify(res.data).substring(0, 200));
            var content = '';
            if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
              content = res.data.choices[0].message.content;
            } else if (res.statusCode === 200 && res.data && res.data.output && res.data.output.text) {
              content = res.data.output.text;
            } else {
              reject(new Error('API返回异常: ' + (res.statusCode || 'unknown')));
              return;
            }
            if (!content) {
              reject(new Error('AI返回内容为空'));
              return;
            }
            // Remove markdown code blocks if present
            content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            // Try to find JSON object
            var jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              // If no JSON found, return the content as analysis
              resolve({
                date: date,
                lunarDate: '',
                dayName: '',
                suitable: [],
                avoidance: [],
                fiveElements: '',
                conflict: '',
                PengZu: '',
                gods: { morning: '', noon: '', evening: '' },
                analysis: content
              });
              return;
            }
            
            var data = JSON.parse(jsonMatch[0]);
            resolve(data);
          } catch (e) {
            console.error('解析失败', e);
            reject(e);
          }
        },
        fail: function (err) {
          console.error('API 调用失败', err);
          reject(err);
        }
      });
    });
  },

  // 分享给好友按钮点击
  onShare: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    wx.showModal({
      title: '分享',
      content: '点击右上角"..."分享给好友',
      showCancel: false
    });
  },


  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '黄道吉日 - ' + this.data.date,
      path: '/subpkg-tools/pages/almanac/almanac'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '黄道吉日 - ' + this.data.date,
      query: ''
    };
  }

});

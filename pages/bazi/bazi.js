"use strict";
const e = require("../../common/vendor.js");

// 天干
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 地支
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 五行
const WUXING = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '子': '水', '丑': '土',
  '寅': '木', '卯': '木',
  '辰': '土', '巳': '火',
  '午': '火', '未': '土',
  '申': '金', '酉': '金',
  '戌': '土', '亥': '水'
};

// 千问 API Key
const QWEN_API_KEY = 'YOUR_DASHSCOPE_API_KEY_HERE';

Page({
  data: {
    showDatePicker: false,
    selectedYear: '',
    selectedMonth: '',
    selectedDay: '',
    selectedHour: '',
    pickerValue: [0, 0, 0, 0],
    analysisResult: '',
    loading: false,
    baziChars: '',
    nianZhu: '',
    yueZhu: '',
    riZhu: '',
    shiZhu: '',
    wuxing: { mu: 0, huo: 0, tu: 0, jin: 0, shui: 0 },
    years: [],
    months: [],
    days: [],
    hours: []
  },

  onLoad() {
    console.log("[生辰八字] 页面加载完成");
    // 初始化日期数据
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 100; i <= currentYear; i++) {
      years.push(i);
    }
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(i);
    }
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    const hours = [];
    for (let i = 0; i <= 23; i++) {
      hours.push(i);
    }

    this.setData({
      years,
      months,
      days,
      hours
    });
  },

  // 显示选择器
  showPicker() {
    console.log("[生辰八字] 显示选择器");
    this.setData({ showDatePicker: true });
  },

  // 隐藏选择器
  hidePicker() {
    console.log("[生辰八字] 隐藏选择器");
    this.setData({ showDatePicker: false });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止弹窗点击关闭
  },

  // 选择器值变化
  onPickerChange(ev) {
    console.log("[生辰八字] 选择器值变化:", ev);
    const value = ev.detail.value;
    this.setData({ pickerValue: value });
  },

  // 确认选择
  confirmPicker() {
    console.log("[生辰八字] 确认选择");
    const value = this.data.pickerValue;
    const selectedYear = this.data.years[value[0]];
    const selectedMonth = this.data.months[value[1]];
    const selectedDay = this.data.days[value[2]];
    const selectedHour = this.data.hours[value[3]];
    
    this.setData({
      selectedYear,
      selectedMonth,
      selectedDay,
      selectedHour,
      showDatePicker: false
    });
    console.log("[生辰八字] 已选择:", selectedYear, selectedMonth, selectedDay, selectedHour);
  },

  // 计算年柱
  calculateNianZhu(year) {
    const ganIndex = (year - 4) % 10;
    const zhiIndex = (year - 4) % 12;
    return TIANGAN[ganIndex] + DIZHI[zhiIndex];
  },

  // 计算月柱（简化版）
  calculateYueZhu(year, month) {
    const ganIndex = ((year % 10) * 2 + Math.floor((month + 1) / 2)) % 10;
    const zhiIndex = (month + 2) % 12;
    return TIANGAN[ganIndex] + DIZHI[zhiIndex];
  },

  // 计算日柱（简化版，实际应查万年历）
  calculateRiZhu(year, month, day) {
    const baseDate = new Date(1900, 0, 31); // 1900 年 1 月 31 日是甲戌日
    const targetDate = new Date(year, month - 1, day);
    const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
    const ganIndex = (diffDays % 10 + 10) % 10;
    const zhiIndex = (diffDays % 12 + 12) % 12;
    return TIANGAN[ganIndex] + DIZHI[zhiIndex];
  },

  // 计算时柱
  calculateShiZhu(year, month, day, hour) {
    const riGan = this.calculateRiZhu(year, month, day)[0];
    const riGanIndex = TIANGAN.indexOf(riGan);
    const ganIndex = (riGanIndex * 2 + Math.floor((hour + 1) / 2)) % 10;
    const zhiIndex = Math.floor((hour + 1) / 2) % 12;
    return TIANGAN[ganIndex] + DIZHI[zhiIndex];
  },

  // 计算五行
  calculateWuxing(bazi) {
    const result = { mu: 0, huo: 0, tu: 0, jin: 0, shui: 0 };
    for (let char of bazi) {
      const wx = WUXING[char];
      if (wx) {
        if (wx === '木') result.mu++;
        else if (wx === '火') result.huo++;
        else if (wx === '土') result.tu++;
        else if (wx === '金') result.jin++;
        else if (wx === '水') result.shui++;
      }
    }
    return result;
  },

  // 调用千问 AI 进行分析
  async callQwenAI(bazi, year, month, day, hour) {
    try {
      const prompt = `请根据以下生辰八字信息进行命理分析：
出生时间：${year}年${month}月${day}日${hour}时
八字：${bazi}

请从以下角度进行分析（300 字以内）：
1. 性格特点
2. 事业运势
3. 健康建议
4. 五行平衡情况

注意：这是传统文化娱乐分析，请说明仅供参考。`;

      const response = await e.index.request({
        url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: 'qwen-plus',
          input: {
            messages: [
              { role: 'system', content: '你是一位精通中国传统命理学的专家，擅长八字分析。请用通俗易懂的语言进行分析，并说明这仅供娱乐参考。' },
              { role: 'user', content: prompt }
            ]
          }
        }
      });

      if (response && response.data && response.data.output && response.data.output.text) {
        return response.data.output.text;
      }
      return 'AI 分析暂时 unavailable，请稍后重试。';
    } catch (err) {
      console.error('千问 AI 调用失败:', err);
      return 'AI 分析调用失败，请稍后重试。';
    }
  },

  // 分析八字
  async analyzeBazi() {
    if (!this.data.selectedYear) {
      e.index.showToast({ title: '请先选择出生时间', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    e.index.showLoading({ title: 'AI 分析中...' });

    try {
      // 计算八字
      const nianZhu = this.calculateNianZhu(this.data.selectedYear);
      const yueZhu = this.calculateYueZhu(this.data.selectedYear, this.data.selectedMonth);
      const riZhu = this.calculateRiZhu(this.data.selectedYear, this.data.selectedMonth, this.data.selectedDay);
      const shiZhu = this.calculateShiZhu(this.data.selectedYear, this.data.selectedMonth, this.data.selectedDay, this.data.selectedHour);
      
      const baziChars = `${nianZhu} ${yueZhu} ${riZhu} ${shiZhu}`;
      
      // 计算五行
      const bazi = nianZhu + yueZhu + riZhu + shiZhu;
      const wuxing = this.calculateWuxing(bazi);

      // 调用 AI 分析
      const result = await this.callQwenAI(bazi, this.data.selectedYear, this.data.selectedMonth, this.data.selectedDay, this.data.selectedHour);

      this.setData({
        nianZhu,
        yueZhu,
        riZhu,
        shiZhu,
        baziChars,
        wuxing,
        analysisResult: result
      });

      e.index.hideLoading();
    } catch (err) {
      console.error('分析失败:', err);
      e.index.hideLoading();
      e.index.showToast({ title: '分析失败，请重试', icon: 'none' });
    }

    this.setData({ loading: false });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '生辰八字 - AI 命理分析',
      path: '/pages/bazi/bazi',
      imageUrl: ''
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '生辰八字 - AI 命理分析',
      query: '',
      imageUrl: ''
    };
  }
});

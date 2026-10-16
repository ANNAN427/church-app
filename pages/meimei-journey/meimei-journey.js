/**
 * 美美历程 - 梦想目标追踪 (v33 多梦想+功德流水版)
 * 路径：pages/meimei-journey/meimei-journey.js
 */

Page({
  data: {
    dreams: [],
    ongoing: [],
    achieved: [],
    expired: [],
    activeTab: 'ongoing',
    totalMerit: 0,
    emptyState: true,

    // v31: 4步向导
    showWizard: false,
    currentStep: 0,
    stepData: {
      name: '',
      deadline: '',
      energy: 0
    },
    showCelebration: false,
    celebrationText: '',

    // 详情弹窗
    showDreamDetail: false,
    currentDream: null,
    deadlineHint: ''
  },

  onLoad: function (options) {
    try{wx.showShareMenu({menus:['shareAppMessage','shareTimeline']})}catch(e){}
    this.loadDreams();
    this.loadTotalMerit();
  },

  onShow: function () {
    var that = this;
    this.loadDreams();
    this.loadTotalMerit();
    // 数据加载完成后检查今天到期的梦想
    this.checkDeadlineDreams();
  },

  // 检查所有到期未确认的梦想，弹窗询问是否达成
  checkDeadlineDreams: function () {
    var dreams = this.data.dreams;
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 0; i < dreams.length; i++) {
      var d = dreams[i];
      // 状态仍为 ongoing + 已设定截止日 + 从未弹窗确认过
      if (d.status === 'ongoing' && d.deadline && !d.deadlinePrompted) {
        var deadline = new Date(d.deadline + 'T00:00:00');
        deadline.setHours(0, 0, 0, 0);
        // 截止日期 <= 今天 → 该弹窗了
        if (deadline <= today) {
          this._promptDreamDeadline(d, i);
          break; // 每次只处理一个
        }
      }
    }
  },

  _pad: function (n) {
    return n < 10 ? '0' + n : '' + n;
  },

  _getTodayStr: function () {
    var today = new Date();
    return today.getFullYear() + '-' + this._pad(today.getMonth() + 1) + '-' + this._pad(today.getDate());
  },

  _promptDreamDeadline: function (dream, index) {
    var that = this;
    wx.showModal({
      title: '🌟 梦想到期提醒',
      content: '「' + dream.name + '」的截止日期到了！\n你实现了这个梦想吗？',
      confirmText: '已达成',
      cancelText: '未达成',
      success: function (res) {
        if (res.confirm) {
          // 已实现 — 全屏庆祝动画
          var dreams2 = that.data.dreams;
          dreams2[index].status = 'achieved';
          dreams2[index].deadlinePrompted = true;
          dreams2[index].completedAt = that._getTodayStr();
          try {
            wx.setStorageSync('meimeiDreams', JSON.stringify(dreams2));
          } catch (e) {}
          that.setData({
            dreams: dreams2,
            showCelebration: true,
            celebrationText: '🎉 恭喜宝子！梦想成真！你太棒了！',
            showCelebrationCanvas: true
          });
          that.loadDreams();
          setTimeout(function () {
            that.setData({ showCelebration: false, showCelebrationCanvas: false });
          }, 3000);
        } else if (res.cancel) {
          // 未实现 — 能量返还
          var dreams2 = that.data.dreams;
          dreams2[index].status = 'expired';
          dreams2[index].deadlinePrompted = true;
          dreams2[index].completedAt = that._getTodayStr();
          that.refundEnergy(dreams2[index]);
          try {
            wx.setStorageSync('meimeiDreams', JSON.stringify(dreams2));
          } catch (e) {}
          that.setData({
            dreams: dreams2,
            showNotAchieved: true
          });
          that.loadDreams();
          setTimeout(function () {
            that.setData({ showNotAchieved: false });
          }, 4000);
        }
      }
    });
  },

  // ========== 数据加载 ==========
  loadTotalMerit: function () {
    var total = 0;
    try {
      total = wx.getStorageSync('totalMerit') || 0;
    } catch (e) { }
    this.setData({ totalMerit: total });
  },

  loadDreams: function () {
    var that = this;
    var dreams = [];
    try {
      dreams = JSON.parse(wx.getStorageSync('meimeiDreams') || '[]');
    } catch (e) {}

    // v40: 完全不做状态变更！所有状态只由弹窗确认触发
    // 计算倒计时
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    for (var i = 0; i < dreams.length; i++) {
      var d = dreams[i];
      if (d.deadline) {
        var dl = new Date(d.deadline + 'T00:00:00');
        dl.setHours(0, 0, 0, 0);
        var diff = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
        if (diff > 0) {
          d.countdownText = '还剩 ' + diff + ' 天';
        } else if (diff === 0) {
          d.countdownText = '今天到期，请及时确认';
        } else {
          d.countdownText = '已到期，待确认';
        }
      }
    }

    var ongoing = [];
    var completed = [];
    for (var j = 0; j < dreams.length; j++) {
      if (dreams[j].status === 'ongoing') ongoing.push(dreams[j]);
      else if (dreams[j].status === 'achieved' || dreams[j].status === 'expired') completed.push(dreams[j]);
    }

    that.setData({
      dreams: dreams,
      ongoing: ongoing,
      completed: completed,
      emptyState: dreams.length === 0
    });
  },

  // v33: 添加功德流水记录
  addMeritLog: function(action, change) {
    try {
      var logs = [];
      try {
        logs = JSON.parse(wx.getStorageSync('meritLog') || '[]');
      } catch(e) {}

      // v35: 直接读取 totalMerit 存储值（已包含消耗），而非三个工具值相加
      var totalMerit = wx.getStorageSync('totalMerit') || 0;

      var now = new Date();
      var month = now.getMonth() + 1;
      var day = now.getDate();
      if (month < 10) month = '0' + month;
      if (day < 10) day = '0' + day;
      var dateStr = now.getFullYear() + '.' + month + '.' + day;

      logs.push({
        time: dateStr,
        action: action,
        change: change,
        balance: totalMerit
      });

      // 最多保留 200 条
      if (logs.length > 200) {
        logs = logs.slice(logs.length - 200);
      }

      wx.setStorageSync('meritLog', JSON.stringify(logs));
    } catch(e) {}
  },

  refundEnergy: function (dream) {
    try {
      var refunded = wx.getStorageSync('meimeiRefunded') || {};
      if (refunded[dream.id]) return;
      refunded[dream.id] = true;
      wx.setStorageSync('meimeiRefunded', refunded);

      var energyUsed = dream.energyUsed || 0;
      if (energyUsed > 0) {
        var currentTotal = wx.getStorageSync('totalMerit') || 0;
        wx.setStorageSync('totalMerit', currentTotal + energyUsed);
        this.addMeritLog('美美历程返还', '+' + energyUsed);
      }
    } catch (e) { }
  },

  // ========== Tab 切换 ==========
  switchTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // ========== 4步向导 ==========
  showWizard: function () {
    this.loadTotalMerit();
    this.setData({
      showWizard: true,
      currentStep: 0,
      stepData: { name: '', deadline: '', energy: 0 }
    });
  },

  hideWizard: function () {
    this.setData({ showWizard: false });
  },

  prevStep: function () {
    var step = this.data.currentStep;
    if (step > 0) {
      this.setData({ currentStep: step - 1 });
    }
  },

  nextStep: function () {
    var step = this.data.currentStep;
    var sd = this.data.stepData;

    if (step === 0 && (!sd.name || !sd.name.trim())) {
      wx.showToast({ title: '请输入梦想名称', icon: 'none' });
      return;
    }
    if (step === 1 && !sd.deadline) {
      wx.showToast({ title: '请选择截止日期', icon: 'none' });
      return;
    }

    // 第3步时校验能量值不超过总功德
    if (step === 2) {
      var val = sd.energy;
      if (val > this.data.totalMerit) {
        wx.showToast({ title: '助力能量值不能超过个人功德值(' + this.data.totalMerit + ')', icon: 'none' });
        return;
      }
    }

    if (step < 3) {
      this.setData({ currentStep: step + 1 });
    } else {
      this.submitDream();
    }
  },

  onWizardNameInput: function (e) {
    var sd = this.data.stepData;
    sd.name = e.detail.value;
    this.setData({ stepData: sd });
  },

  onWizardDeadlineChange: function (e) {
    var sd = this.data.stepData;
    sd.deadline = e.detail.value;
    this.setData({ stepData: sd });
  },

  onWizardEnergyInput: function (e) {
    var sd = this.data.stepData;
    var val = parseInt(e.detail.value) || 0;
    if (val > this.data.totalMerit) val = this.data.totalMerit;
    sd.energy = val;
    this.setData({ stepData: sd });
  },

  submitDream: function () {
    var that = this;
    var sd = that.data.stepData;

    if (!sd.name || !sd.name.trim()) {
      wx.showToast({ title: '请输入梦想名称', icon: 'none' });
      return;
    }

    // 提交时扣除功德
    var energyUsed = sd.energy || 0;
    if (energyUsed > 0) {
      if (energyUsed > that.data.totalMerit) {
        wx.showToast({ title: '助力能量值不能超过个人功德值(' + that.data.totalMerit + ')', icon: 'none' });
        return;
      }
    }

    var dreams = that.data.dreams;
    var newDream = {
      id: 'dream_' + Date.now(),
      name: sd.name.trim(),
      deadline: sd.deadline,
      energyUsed: energyUsed,
      status: 'ongoing',
      createdAt: new Date().toISOString(),
      milestones: []
    };
    dreams.push(newDream);

    // 扣除功德值
    if (energyUsed > 0) {
      var currentTotal = wx.getStorageSync('totalMerit') || 0;
      wx.setStorageSync('totalMerit', currentTotal - energyUsed);
      that.addMeritLog('美美历程', '-' + energyUsed);
    }

    try {
      wx.setStorageSync('meimeiDreams', JSON.stringify(dreams));
    } catch (e) { }

    that.setData({
      dreams: dreams,
      showWizard: false,
      showCelebration: true,
      celebrationText: '梦想已种下，静待花开'
    });

    that.loadDreams();
    that.loadTotalMerit();

    setTimeout(function () {
      that.setData({ showCelebration: false });
    }, 3000);
  },

  // ========== 梦想详情 ==========
  showDreamDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    var dreams = this.data.dreams;
    var target = null;
    for (var i = 0; i < dreams.length; i++) {
      if (dreams[i].id === id) {
        target = dreams[i];
        break;
      }
    }
    if (target) {
      this.setData({
        showDreamDetail: true,
        currentDream: target,
        deadlineHint: this.calcDeadlineHint(target.deadline)
      });
    }
  },

  hideDreamDetail: function () {
    this.setData({ showDreamDetail: false, currentDream: null });
  },

  calcDeadlineHint: function (deadlineStr) {
    if (!deadlineStr) return '';
    var deadline = new Date(deadlineStr);
    var now = new Date();
    var diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    if (diff > 30) return '还有 ' + diff + ' 天，稳稳的~';
    if (diff > 7) return '还有 ' + diff + ' 天，加油';
    if (diff > 0) return '时间有点紧，但你比想象中厉害';
    if (diff === 0) return '今天就是截止日，来看看结果吧';
    return '已过期 ' + Math.abs(diff) + ' 天';
  },

  checkDream: function (e) {
    var id = e.currentTarget.dataset.id;
    var dreams = this.data.dreams;
    var name = '';
    for (var i = 0; i < dreams.length; i++) {
      if (dreams[i].id === id) {
        dreams[i].status = 'achieved';
        dreams[i].completedAt = this._getTodayStr();
        name = dreams[i].name;
        break;
      }
    }
    try {
      wx.setStorageSync('meimeiDreams', JSON.stringify(dreams));
    } catch (e) { }

    this.setData({
      dreams: dreams,
      showDreamDetail: false,
      showCelebration: true,
      celebrationText: '恭喜宝子！"' + name + '"梦想成真！我们为你放一串小烟花'
    });

    this.loadDreams();

    var that = this;
    setTimeout(function () {
      that.setData({ showCelebration: false });
    }, 3000);
  },

  deleteDream: function (e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '删除梦想',
      content: '确定要删除这个梦想吗？功德值会全额退回',
      success: function (res) {
        if (res.confirm) {
          var dreams = that.data.dreams;
          var dream = null;
          var newDreams = [];
          for (var i = 0; i < dreams.length; i++) {
            if (dreams[i].id === id) {
              dream = dreams[i];
            } else {
              newDreams.push(dreams[i]);
            }
          }
          // 退回功德值
          if (dream && dream.energyUsed) {
            try {
              var refunded = wx.getStorageSync('meimeiRefunded') || {};
              if (!refunded[id]) {
                refunded[id] = true;
                wx.setStorageSync('meimeiRefunded', refunded);
                var energy = dream.energyUsed || 0;
                var currentTotal = wx.getStorageSync('totalMerit') || 0;
                wx.setStorageSync('totalMerit', currentTotal + energy);
                that.addMeritLog('美美历程返还', '+' + energy);
              }
            } catch (e2) { }
          }
          try {
            wx.setStorageSync('meimeiDreams', JSON.stringify(newDreams));
          } catch (e) { }
          that.setData({ dreams: newDreams });
          that.loadDreams();
          that.loadTotalMerit();
          wx.showToast({ title: '已删除，功德值已退回', icon: 'success' });
        }
      }
    });
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '美美历程 - 追逐梦想，达成目标',
      path: '/subpkg-tools/pages/meimei-journey/meimei-journey'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '美美历程 - 追逐梦想，达成目标',
      query: ''
    };
  }

});

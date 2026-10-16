// pages/star-memory/star-memory.js
Page({
  data: {
    deceasedCount: 0,
    deceasedPersons: [],
    customStars: [],
    showDetail: false,
    selectedPerson: {},
    selectedPersonType: 'family',
    editBirthday: '',
    editBirthdayCal: 'solar',
    editDeathday: '',
    editDeathdayCal: 'solar',
    selectedCustomIndex: -1,
    showMemorial: false,
    memorialInfo: {},
    showLetter: false,
    letterContent: '',
    letterHistory: [],
    showLetterView: false,
    currentLetter: {},
    currentLetterIndex: -1,
    showCreate: false,
    createForm: {
      name: '',
      birthday: '',
      birthdayCal: 'solar',
      deathday: '',
      deathdayCal: 'solar',
      memo: ''
    }
  },

  ctx: null,
  canvasWidth: 0,
  canvasHeight: 0,
  
  // 星星数组
  stars: [],
  
  // 流星数组
  shootingStars: [],
  
  // 动画控制
  animationTimer: null,
  shootingTimer: null,
  
  // 音效
  clickAudio: null,
  bgAudio: null,
  
  // 点击节流
  lastTapTime: 0,

  onLoad: function () {
    this.loadDeceasedPersons();
    this.loadCustomStars();
  },

  onReady: function () {
    var that = this;
    var query = wx.createSelectorQuery();
    query.select('.star-canvas').fields({ node: true, size: true }).exec(function (res) {
      var rect = res[0];
      if (rect) {
        that.canvasWidth = rect.width;
        that.canvasHeight = rect.height;
        var canvasNode = res[0].node;
        that.canvasNode = canvasNode;
        that.ctx = canvasNode.getContext('2d');
        var dpr = wx.getSystemInfoSync().pixelRatio;
        canvasNode.width = rect.width * dpr;
        canvasNode.height = rect.height * dpr;
        that.ctx.scale(dpr, dpr);
        that.initStars();
        that.startAnimation();
        that.scheduleShootingStar();
        that.playBgAudio();
      }
    });
  },

  onUnload: function () {
    this.stopAnimation();
    if (this.clickAudio) {
      this.clickAudio.destroy();
    }
    if (this.bgAudio) {
      this.bgAudio.stop();
    }
  },

  onHide: function () {
    this.stopAnimation();
  },

  // 启用分享菜单
  onShow: function () {
    wx.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline'],
      success: function () {
        console.log('[star-memory] wx.showShareMenu SUCCESS');
      },
      fail: function (err) {
        console.error('[star-memory] wx.showShareMenu FAIL:', JSON.stringify(err));
      }
    });
  },

  // 加载已故家庭成员
  loadDeceasedPersons: function () {
    var currentTreeId = wx.getStorageSync('currentTreeId') || '';
    var persons = wx.getStorageSync('persons_' + currentTreeId) || wx.getStorageSync('persons') || [];
    
    var deceased = [];
    for (var i = 0; i < persons.length; i++) {
      var p = persons[i];
      if (p.status === 'deceased') {
        deceased.push({
          id: p.id,
          name: p.name || '无名',
          birthday: p.birthday || '',
          birthdayCal: p.birthdayCal || 'solar',
          deathday: p.deathday || '',
          deathdayCal: p.deathdayCal || 'solar',
          memo: p.memo || '',
          gender: p.gender || ''
        });
      }
    }
    
    this.setData({
      deceasedCount: deceased.length,
      deceasedPersons: deceased
    });
    
    console.log('思念星空 - 已故成员:', deceased.length, '人');
  },

  // 初始化背景星星
  initStars: function () {
    this.stars = [];
    var count = Math.floor((this.canvasWidth * this.canvasHeight) / 3000);
    
    for (var i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
  },

  // 开始动画
  startAnimation: function () {
    var that = this;
    var time = 0;
    
    function draw() {
      time += 1;
      that.drawBackground(time);
      that.drawShootingStars();
      
      that.animationTimer = setTimeout(draw, 50);
    }
    
    draw();
  },

  // 停止动画
  stopAnimation: function () {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
    if (this.shootingTimer) {
      clearTimeout(this.shootingTimer);
      this.shootingTimer = null;
    }
  },

  // 绘制背景
  drawBackground: function (time) {
    var w = this.canvasWidth;
    var h = this.canvasHeight;
    
    // 深空渐变
    var gradient = this.ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(0.5, '#1a1a3e');
    gradient.addColorStop(1, '#0f0f2f');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);
    
    // 绘制星星
    for (var i = 0; i < this.stars.length; i++) {
      var star = this.stars[i];
      var twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
      var currentOpacity = star.opacity * (0.5 + 0.5 * twinkle);
      
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, ' + currentOpacity + ')';
      this.ctx.fill();
    }
  },

  // 发射流星
  launchShootingStar: function () {
    var deceased = this.data.deceasedPersons;
    if (deceased.length === 0) return;
    
    // 限制同时最多3颗流星
    if (this.shootingStars.length >= 3) return;
    
    // 随机选一个已故成员
    var person = deceased[Math.floor(Math.random() * deceased.length)];
    
    // 随机起点和方向
    var w = this.canvasWidth;
    var h = this.canvasHeight;
    
    var startX, startY, angle;
    var side = Math.floor(Math.random() * 3);
    
    if (side === 0) {
      // 从上方来
      startX = Math.random() * w;
      startY = -30;
      angle = Math.PI / 4 + Math.random() * Math.PI / 4;
    } else if (side === 1) {
      // 从左方来
      startX = -30;
      startY = Math.random() * h * 0.5;
      angle = -Math.PI / 6 + Math.random() * Math.PI / 3;
    } else {
      // 从右方来
      startX = w + 30;
      startY = Math.random() * h * 0.5;
      angle = Math.PI - Math.PI / 3 + Math.random() * Math.PI / 6;
    }
    
    var speed = 3 + Math.random() * 3;
    var nameFontSize = 14;
    
    this.shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      person: person,
      fontSize: nameFontSize,
      trailLength: w / 3,
      opacity: 1,
      alive: true,
      nameWidth: 0
    });
    
    // 计算名字宽度（预估）
    var star = this.shootingStars[this.shootingStars.length - 1];
    star.nameWidth = person.name.length * nameFontSize * 0.7;
    
    // 安排下一颗
    this.scheduleShootingStar();
  },

  // 安排下一颗流星
  scheduleShootingStar: function () {
    var that = this;
    var delay = 2000 + Math.random() * 3000;
    this.shootingTimer = setTimeout(function () {
      that.launchShootingStar();
    }, delay);
  },

  // 绘制流星
  drawShootingStars: function () {
    var w = this.canvasWidth;
    var h = this.canvasHeight;
    
    for (var i = this.shootingStars.length - 1; i >= 0; i--) {
      var star = this.shootingStars[i];
      
      if (!star.alive) continue;
      
      // 更新位置
      star.x += star.vx;
      star.y += star.vy;
      
      // 检查是否出界
      if (star.x < -100 || star.x > w + 100 || star.y < -100 || star.y > h + 100) {
        this.shootingStars.splice(i, 1);
        continue;
      }
      
      // 绘制拖尾
      var trailLen = star.trailLength;
      var totalLen = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
      var nx = -star.vx / totalLen;
      var ny = -star.vy / totalLen;
      
      var tailX = star.x + nx * trailLen;
      var tailY = star.y + ny * trailLen;
      
      // 拖尾渐变
      for (var j = 0; j < 10; j++) {
        var t = j / 10;
        var px = star.x + (tailX - star.x) * t;
        var py = star.y + (tailY - star.y) * t;
        var alpha = (1 - t) * 0.6;
        var radius = (1 - t) * 2;
        
        this.ctx.beginPath();
        this.ctx.arc(px, py, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(200, 220, 255, ' + alpha + ')';
        this.ctx.fill();
      }
      
      // 流星头部
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.fill();
      
      // 发光效果
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(180, 200, 255, 0.3)';
      this.ctx.fill();
      
      // 绘制名字
      this.ctx.font = star.fontSize + 'px sans-serif';
      this.ctx.fillStyle = 'rgba(220, 230, 255, 0.9)';
      this.ctx.textAlign = 'center';
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = 'rgba(100, 150, 255, 0.8)';
      
      var nameOffsetY = -12;
      this.ctx.fillText(star.person.name, star.x, star.y + nameOffsetY);
      
      this.ctx.shadowBlur = 0;
      this.ctx.shadowColor = 'transparent';
    }
  },

  // 点击检测
  onCanvasTap: function (e) {
    var now = Date.now();
    if (now - this.lastTapTime < 300) return;
    this.lastTapTime = now;
    
    var touch = e;
    var x = touch.detail ? touch.detail.x : touch.x;
    var y = touch.detail ? touch.detail.y : touch.y;
    
    if (!x || !y) return;
    
    // 检查是否点中流星
    var hitRadius = 30;
    for (var i = 0; i < this.shootingStars.length; i++) {
      var star = this.shootingStars[i];
      var dx = x - star.x;
      var dy = y - star.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < hitRadius) {
        this.onShootingStarTap(star);
        return;
      }
    }
  },

  onTouchStart: function (e) {
    this.onCanvasTap(e);
  },

  // 点击流星
  onShootingStarTap: function (star) {
    // 播放音效
    this.playClickSound();
    
    // 定格流星
    star.alive = false;
    
    // 显示详情
    this.setData({
      showDetail: true,
      selectedPerson: star.person
    });
    
    // 粒子爆炸效果
    this.playExplosionEffect(star.x, star.y);
  },

  // 爆炸粒子效果
  playExplosionEffect: function (cx, cy) {
    var that = this;
    var particles = [];
    
    for (var i = 0; i < 20; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 3;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        radius: 1 + Math.random() * 2
      });
    }
    
    var frames = 0;
    function animateParticles() {
      frames++;
      if (frames > 30) return;
      
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        
        that.ctx.beginPath();
        that.ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        that.ctx.fillStyle = 'rgba(255, 220, 100, ' + p.life + ')';
        that.ctx.fill();
      }
      
      
      setTimeout(animateParticles, 30);
    }
    
    animateParticles();
  },

  // 播放点击音效
  playClickSound: function () {
    try {
      var that = this;
      if (!this.clickAudio) {
        this.clickAudio = wx.createInnerAudioContext();
        this.clickAudio.src = 'https://1689.1r1zhux.com/audio/zen/muyu.mp3';
        this.clickAudio.onError(function (err) {
          console.log('思念星空音效错误:', err.errMsg);
        });
      }
      this.clickAudio.stop();
      this.clickAudio.play();
    } catch (e) {
      console.log('音效播放失败:', e);
    }
  },

  // 播放背景音
  playBgAudio: function () {
    try {
      var that = this;
      if (!this.bgAudio) {
        this.bgAudio = wx.createInnerAudioContext();
        this.bgAudio.src = 'https://1689.1r1zhux.com/audio/zen/xingkong.mp3';
        this.bgAudio.loop = true;
        this.bgAudio.volume = 0.3;
        this.bgAudio.onError(function (err) {
          console.log('思念星空背景音错误:', err.errMsg);
        });
      }
      this.bgAudio.play();
    } catch (e) {
      console.log('背景音播放失败:', e);
    }
  },

  // 编辑诞辰
  onEditBirthdayChange: function (e) {
    var date = e.detail.value;
    this.setData({ editBirthday: date });
    this._updatePersonDatesDirect(date, this.data.editDeathday);
  },

  // 编辑忌日
  onEditDeathdayChange: function (e) {
    var date = e.detail.value;
    this.setData({ editDeathday: date });
    this._updatePersonDatesDirect(this.data.editBirthday, date);
  },

  // v30: 编辑诞辰日历类型
  onEditBirthdayCalChange: function (e) {
    var idx = parseInt(e.detail.value);
    this.setData({ editBirthdayCal: idx === 1 ? 'lunar' : 'solar' });
  },

  // v30: 编辑忌日日历类型
  onEditDeathdayCalChange: function (e) {
    var idx = parseInt(e.detail.value);
    this.setData({ editDeathdayCal: idx === 1 ? 'lunar' : 'solar' });
  },

  // 更新人物日期到数据源（直接传值，避免 setData 异步问题）
  _updatePersonDatesDirect: function (birthday, deathday) {
    var that = this;
    var person = this.data.selectedPerson;
    var type = this.data.selectedPersonType;

    // 更新 selectedPerson 显示
    person.birthday = birthday;
    person.birthdayCal = this.data.editBirthdayCal || 'solar';
    person.deathday = deathday;
    person.deathdayCal = this.data.editDeathdayCal || 'solar';

    if (type === 'custom') {
      var stars = this.data.customStars.slice();
      var idx = this.data.selectedCustomIndex;
      if (idx >= 0) {
        stars[idx].birthday = birthday;
        stars[idx].birthdayCal = this.data.editBirthdayCal || 'solar';
        stars[idx].deathday = deathday;
        stars[idx].deathdayCal = this.data.editDeathdayCal || 'solar';
      }
      // 保存到本地存储
      wx.setStorageSync('manual_guardian_stars', stars);
      // 更新 customStars + selectedPerson 确保 WXML 正确显示
      that.setData({
        customStars: stars,
        selectedPerson: person
      });
    } else {
      // family 类型也要刷新 selectedPerson 让页面立即显示
      that.setData({
        selectedPerson: person
      });
    }
    wx.showToast({ title: '设置成功', icon: 'success', duration: 1500 });
  },

  // 更新人物日期到数据源（旧版，保留兼容）
  _updatePersonDates: function () {
    var that = this;
    var person = this.data.selectedPerson;
    var type = this.data.selectedPersonType;
    var birthday = this.data.editBirthday;
    var deathday = this.data.editDeathday;

    // 更新 selectedPerson 显示
    person.birthday = birthday;
    person.deathday = deathday;

    if (type === 'custom') {
      var stars = this.data.customStars.slice();
      var idx = this.data.selectedCustomIndex;
      if (idx >= 0) {
        stars[idx].birthday = birthday;
        stars[idx].deathday = deathday;
      }
      // 保存到本地存储
      wx.setStorageSync('manual_guardian_stars', stars);
      // 更新 customStars + selectedPerson 确保 WXML 正确显示
      that.setData({
        customStars: stars,
        selectedPerson: person
      });
      wx.showToast({ title: '设置成功', icon: 'success', duration: 1500 });
    } else {
      wx.showToast({ title: '设置成功', icon: 'success', duration: 1500 });
    }
    // family 类型的日期来自家谱数据，不在此修改
  },

  // 隐藏详情
  hideDetail: function () {
    this.setData({
      showDetail: false,
      selectedPerson: {}
    });
    // 恢复动画
    this.startAnimation();
    this.scheduleShootingStar();
  },

  stopPropagation: function () {}, 

  // ============ 纪念日功能 ============
  openMemorial: function () {
    var person = this.data.selectedPerson;
    var info = this.calculateMemorialInfo(person);
    this.setData({
      showMemorial: true,
      memorialInfo: info
    });
  },

  closeMemorial: function () {
    this.setData({ showMemorial: false });
  },

  calculateMemorialInfo: function (person) {
    var info = {
      birthday: person.birthday || '',
      deathday: person.deathday || '',
      age: '',
      daysSince: '',
      nextAnniversary: '',
      nextAnniversaryType: '',
      nextAnniversaryDate: ''
    };

    // 计算享年
    if (person.birthday && person.deathday) {
      var birthDate = this.parseDate(person.birthday);
      var deathDate = this.parseDate(person.deathday);
      if (birthDate && deathDate) {
        var age = deathDate.getFullYear() - birthDate.getFullYear();
        var m = deathDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && deathDate.getDate() < birthDate.getDate())) {
          age--;
        }
        info.age = age;
      }
    }

    // 计算距今天数
    if (person.deathday) {
      var deathDate = this.parseDate(person.deathday);
      if (deathDate) {
        var now = new Date();
        var diff = now.getTime() - deathDate.getTime();
        info.daysSince = Math.floor(diff / (1000 * 60 * 60 * 24));
      }
    }

    // 计算下一个纪念日
    var now = new Date();
    var nextBday = null;
    var nextDday = null;

    if (person.birthday) {
      var bd = this.parseDate(person.birthday);
      if (bd) {
        nextBday = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        if (nextBday <= now) {
          nextBday = new Date(now.getFullYear() + 1, bd.getMonth(), bd.getDate());
        }
      }
    }

    if (person.deathday) {
      var dd = this.parseDate(person.deathday);
      if (dd) {
        nextDday = new Date(now.getFullYear(), dd.getMonth(), dd.getDate());
        if (nextDday <= now) {
          nextDday = new Date(now.getFullYear() + 1, dd.getMonth(), dd.getDate());
        }
      }
    }

    if (nextBday || nextDday) {
      var nearest = null;
      if (nextBday && nextDday) {
        nearest = nextBday < nextDday ? nextBday : nextDday;
        info.nextAnniversaryType = nearest === nextBday ? '诞辰纪念日' : '忌日纪念日';
      } else if (nextBday) {
        nearest = nextBday;
        info.nextAnniversaryType = '诞辰纪念日';
      } else {
        nearest = nextDday;
        info.nextAnniversaryType = '忌日纪念日';
      }

      var daysTo = Math.ceil((nearest.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      info.nextAnniversary = daysTo;
      info.nextAnniversaryDate = nearest.getFullYear() + '年' + (nearest.getMonth() + 1) + '月' + nearest.getDate() + '日';
    }

    return info;
  },

  parseDate: function (dateStr) {
    if (!dateStr) return null;
    // 支持格式: YYYY-MM-DD, YYYY/MM/DD, YYYY年MM月DD日
    var parts = null;
    if (dateStr.indexOf('-') >= 0) {
      parts = dateStr.split('-');
    } else if (dateStr.indexOf('/') >= 0) {
      parts = dateStr.split('/');
    } else if (dateStr.indexOf('年') >= 0) {
      parts = dateStr.replace('年', '-').replace('月', '-').replace('日', '').split('-');
    }
    if (parts && parts.length >= 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return null;
  },

  // ============ 写信功能 ============
  openLetter: function () {
    var person = this.data.selectedPerson;
    this.loadLetterHistory(person.id);
    this.setData({
      showLetter: true,
      letterContent: '',
      showLetterView: false
    });
  },

  closeLetter: function () {
    this.setData({ showLetter: false });
  },

  // 查看历史信件（从详情面板直接打开）
  viewLetterHistory: function () {
    var person = this.data.selectedPerson;
    this.loadLetterHistory(person.id);
    this.setData({
      showLetterHistory: true,
      showLetter: false,
      showLetterView: false
    });
  },

  // 关闭历史信件弹窗
  closeLetterHistory: function () {
    this.setData({ showLetterHistory: false });
  },

  onLetterInput: function (e) {
    this.setData({ letterContent: e.detail.value });
  },

  saveLetter: function () {
    var content = this.data.letterContent.trim();
    if (!content) {
      wx.showToast({ title: '请写点什么吧', icon: 'none' });
      return;
    }

    var person = this.data.selectedPerson;
    var key = 'letters_' + person.id;
    var letters = wx.getStorageSync(key) || [];

    var now = new Date();
    var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' +
      (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();

    letters.unshift({
      id: 'l' + Date.now(),
      content: content,
      date: dateStr,
      preview: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
      toPerson: person.name
    });

    wx.setStorageSync(key, letters);
    this.loadLetterHistory(person.id);

    this.setData({ letterContent: '' });

    wx.showToast({ title: '信件已保存 🕊️', icon: 'success' });
  },

  loadLetterHistory: function (personId) {
    var key = 'letters_' + personId;
    var letters = wx.getStorageSync(key) || [];
    this.setData({ letterHistory: letters });
  },

  viewLetter: function (e) {
    var index = e.currentTarget.dataset.index;
    var letter = this.data.letterHistory[index];
    this.setData({
      showLetterView: true,
      currentLetter: letter,
      currentLetterIndex: index
    });
  },

  closeLetterView: function () {
    this.setData({ showLetterView: false });
  },

  deleteLetter: function () {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这封信吗？',
      success: function (res) {
        if (res.confirm) {
          var person = that.data.selectedPerson;
          var key = 'letters_' + person.id;
          var letters = wx.getStorageSync(key) || [];
          letters.splice(that.data.currentLetterIndex, 1);
          wx.setStorageSync(key, letters);
          that.loadLetterHistory(person.id);
          that.setData({ showLetterView: false });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // ============ 自定义守护星功能 ============
  loadCustomStars: function () {
    var stars = wx.getStorageSync('manual_guardian_stars') || [];
    this.setData({ customStars: stars });
    console.log('思念星空 - 自定义守护星:', stars.length, '个');
  },

  showCreateForm: function () {
    this.setData({
      showCreate: true,
      createForm: { name: '', birthday: '', birthdayCal: 'solar', deathday: '', deathdayCal: 'solar', memo: '' }
    });
  },

  hideCreateForm: function () {
    this.setData({ showCreate: false });
  },

  onCreateNameInput: function (e) {
    var form = this.data.createForm;
    form.name = e.detail.value;
    this.setData({ createForm: form });
  },

  onCreateBirthdayChange: function (e) {
    var form = this.data.createForm;
    form.birthday = e.detail.value;
    this.setData({ createForm: form });
  },

  onCreateBirthdayCalChange: function (e) {
    var form = this.data.createForm;
    var idx = parseInt(e.detail.value);
    form.birthdayCal = idx === 1 ? 'lunar' : 'solar';
    this.setData({ createForm: form });
  },

  onCreateDeathdayChange: function (e) {
    var form = this.data.createForm;
    form.deathday = e.detail.value;
    this.setData({ createForm: form });
  },

  onCreateDeathdayCalChange: function (e) {
    var form = this.data.createForm;
    var idx = parseInt(e.detail.value);
    form.deathdayCal = idx === 1 ? 'lunar' : 'solar';
    this.setData({ createForm: form });
  },

  onCreateMemoInput: function (e) {
    var form = this.data.createForm;
    form.memo = e.detail.value;
    this.setData({ createForm: form });
  },

  submitCreate: function () {
    var form = this.data.createForm;
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入名字', icon: 'none' });
      return;
    }

    var stars = wx.getStorageSync('manual_guardian_stars') || [];
    var newStar = {
      id: 'custom_' + Date.now(),
      name: form.name.trim(),
      birthday: form.birthday,
      birthdayCal: form.birthdayCal || 'solar',
      deathday: form.deathday,
      deathdayCal: form.deathdayCal || 'solar',
      memo: form.memo,
      source_type: 'manual'
    };
    stars.push(newStar);
    wx.setStorageSync('manual_guardian_stars', stars);

    this.setData({
      customStars: stars,
      showCreate: false,
      createForm: { name: '', birthday: '', birthdayCal: 'solar', deathday: '', deathdayCal: 'solar', memo: '' }
    });

    wx.showToast({ title: '守护星创建成功 ✨', icon: 'success' });
  },

  // ============ 列表点击交互 ============
  onPersonTap: function (e) {
    var ds = e.currentTarget.dataset;
    var type = ds.type;
    var index = ds.index;

    var person;
    if (type === 'family') {
      person = this.data.deceasedPersons[index];
    } else {
      person = this.data.customStars[index];
    }

    // 播放音效（创建表单和写信时保留，点击守护星静音）

    this.setData({
      showDetail: true,
      selectedPerson: person,
      selectedPersonType: type,
      selectedCustomIndex: type === 'custom' ? index : -1,
      editBirthday: person.birthday || '',
      editBirthdayCal: person.birthdayCal || 'solar',
      editDeathday: person.deathday || '',
      editDeathdayCal: person.deathdayCal || 'solar'
    });
  },

  onPersonAction: function (e) {
    var ds = e.currentTarget.dataset;
    var index = ds.index;
    var person = this.data.customStars[index];

    var that = this;
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: function (res) {
        if (res.tapIndex === 0) {
          that.editCustomStar(index);
        } else if (res.tapIndex === 1) {
          that.deleteCustomStar(index);
        }
      }
    });
  },

  editCustomStar: function (index) {
    var person = this.data.customStars[index];
    var form = {
      name: person.name,
      birthday: person.birthday || '',
      birthdayCal: person.birthdayCal || 'solar',
      deathday: person.deathday || '',
      deathdayCal: person.deathdayCal || 'solar',
      memo: person.memo || ''
    };
    this.setData({
      showCreate: true,
      createForm: form,
      editingIndex: index
    });
  },

  deleteCustomStar: function (index) {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个守护星吗？',
      success: function (res) {
        if (res.confirm) {
          var stars = wx.getStorageSync('manual_guardian_stars') || [];
          stars.splice(index, 1);
          wx.setStorageSync('manual_guardian_stars', stars);
          that.setData({ customStars: stars });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // 分享给好友
  onShareAppMessage: function () {
    console.log('[star-memory] onShareAppMessage CALLED!');
    return {
      title: '思念星空 - 缅怀故人，寄托哀思',
      path: '/subpkg-tools/pages/star-memory/star-memory'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    console.log('[star-memory] onShareTimeline CALLED!');
    return {
      title: '思念星空 - 缅怀故人，寄托哀思'
    };
  }
});

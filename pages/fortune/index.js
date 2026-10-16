// pages/fortune/index.js - 天经地易抽签页面
const app = getApp();

Page({
  data: {
    lotData: {},
    isDrawing: false,
    isShaking: false,
    showResult: false,
    showInterpret: false,
    interpretation: {
      meaning: '',
      guidance: ''
    },
    advice: {
      career: '',
      wealth: '',
      love: '',
      health: ''
    },
    Math: Math,
    leftMenuOpen: false,
    rightMenuOpen: false,
    // AI 分析相关
    showAiResultModal: false,
    aiResultTitle: '',
    aiResultContent: '',
    showAnalysisDialog: false,
    analysisConfig: {},
    userInput: '',
    birthDateValue: '',
    lunarDate: '',  // 农历日期
    analysisResult: '',
    formattedResult: ''  // 格式化后的结果（带 HTML）
  },

  onLoad: function() {
    // 初始化音频
    this.initAudio();

    // 监听摇一摇事件
    this.initAccelerometer();
  },

  // 初始化音频
  initAudio: function() {
    this.audioCtx = wx.createInnerAudioContext();
    this.audioCtx.src = 'https://1689.1r1zhux.com/audio/zen/miaozhen.wav';
    this.audioCtx.autoplay = false;
    this.audioCtx.loop = true;
    this.audioCtx.obeyMuteSwitch = false;
  },

  // 播放音效
  playAudio: function() {
    if (this.audioCtx) {
      this.audioCtx.seek(0);
      this.audioCtx.play();
      console.log('[index] 播放音效');
    }
  },

  // 停止音效
  stopAudio: function() {
    if (this.audioCtx) {
      this.audioCtx.pause();
      console.log('[index] 停止音效');
    }
  },

  // 初始化加速度传感器
  initAccelerometer: function() {
    try {
      wx.startAccelerometer({
        interval: 'game',
        success: () => {
          console.log('[index] 加速度传感器启动成功');
        },
        fail: (err) => {
          console.warn('[index] 加速度传感器启动失败:', err);
          console.warn('[index] 摇一摇功能不可用，请点击签筒抽签');
        }
      });
      wx.onAccelerometerChange(this.handleShake.bind(this));
    } catch (e) {
      console.log('[index] 加速度传感器初始化失败:', e);
    }
  },

  // 摇一摇检测
  handleShake: function(res) {
    if (this.data.isDrawing || this.data.showResult) return;

    const threshold = 2.5;
    const acceleration = Math.abs(res.x) + Math.abs(res.y) + Math.abs(res.z);

    if (acceleration > threshold) {
      this.shakeLot();
    }
  },

  // 点击签筒抽签
  shakeLot: function() {
    var that = this;
    if (this.data.isDrawing) return;

    this.setData({
      isDrawing: true,
      isShaking: true
    });

    // 播放音效
    this.playAudio();

    // 模拟抽签过程
    setTimeout(function() {
      that.setData({
        isDrawing: false,
        isShaking: false
      });

      // 停止音效
      that.stopAudio();

      // 震动反馈
      wx.vibrateShort({ type: 'heavy' });

      // 调用 AI 生成签文
      that.generateLotWithAI();
    }, 2200);
  },

    // 使用备用签文数据（60 条传统签文，确保每次不同）
  generateLotWithAI: function() {
    var that = this;
    console.log('[index] 使用备用签文数据');
    that.useBackupLotData();
    that.setData({ isDrawing: false, isShaking: false });
  },

    // 备用签文数据（60 条传统签文）
  useBackupLotData: function() {
    var backupLots = [
      { lotNumber: 1, lotName: '上上大吉', lotContent: '旭日东升照门庭，万事如意享安康。贵人相助事业兴，财源广进福满堂。', lotMeaning: '运势极佳，诸事顺利。', lotExplanation: '当前运势旺盛，把握时机，积极进取。' },
      { lotNumber: 2, lotName: '中平之签', lotContent: '平平淡淡才是真，莫求富贵莫求名。心安理得自逍遥，知足常乐度此生。', lotMeaning: '运势平稳，不宜冒进。', lotExplanation: '保持平常心，顺其自然。' },
      { lotNumber: 3, lotName: '姻缘待定', lotContent: '姻缘未定不用急，缘分自有天注定。修身养性多充实，良缘自会找上门。', lotMeaning: '姻缘未到无需着急。', lotExplanation: '先提升自己，缘分自来。' },
      { lotNumber: 4, lotName: '事业有成', lotContent: '十年磨剑今试锋，乘风破浪会有时。功成名就指日待，前程似锦步步高。', lotMeaning: '事业运势上升。', lotExplanation: '努力终有回报，把握机会。' },
      { lotNumber: 5, lotName: '财运亨通', lotContent: '财源广进达三江，生意兴隆通四海。投资理财皆有道，富贵荣华自然来。', lotMeaning: '财运旺盛。', lotExplanation: '理性投资，不可贪心。' },
      { lotNumber: 6, lotName: '健康平安', lotContent: '身心康泰福寿长，起居有常精神爽。饮食有节多运动，平安喜乐度时光。', lotMeaning: '健康状况良好。', lotExplanation: '注意养生，预防为主。' },
      { lotNumber: 7, lotName: '否极泰来', lotContent: '寒冬已过春意浓，枯木逢春又发荣。否极泰来终有时，转运就在眼前中。', lotMeaning: '运势即将好转。', lotExplanation: '坚持到底，曙光在前。' },
      { lotNumber: 8, lotName: '谨慎行事', lotContent: '行船须得顺风水，做事当要慎始终。小心驶得万年船，稳中求胜莫冲动。', lotMeaning: '需谨慎行事。', lotExplanation: '三思而后行，避免冒险。' },
      { lotNumber: 9, lotName: '贵人相助', lotContent: '山重水复疑无路，柳暗花明又一村。贵人指点迷津处，峰回路转见光明。', lotMeaning: '有贵人相助。', lotExplanation: '多与人交流，贵人自现。' },
      { lotNumber: 10, lotName: '自强不息', lotContent: '天行健以自强不息，地势坤以厚德载物。持之以恒终有成，功夫不负有心人。', lotMeaning: '坚持就是胜利。', lotExplanation: '持之以恒，必有所成。' },
      { lotNumber: 11, lotName: '和气生财', lotContent: '和气致祥家有庆，宽容待人事事顺。忍一时风平浪静，退一步海阔天空。', lotMeaning: '以和为贵。', lotExplanation: '宽容待人，和气生财。' },
      { lotNumber: 12, lotName: '顺势而为', lotContent: '识时务者为俊杰，顺势而为事半功。逆水行舟难前进，顺水推舟易成功。', lotMeaning: '顺应时势。', lotExplanation: '把握大势，顺势而为。' },
      { lotNumber: 13, lotName: '积德行善', lotContent: '积善之家必有余，积德之门庆有余。但行好事莫问果，福报自来不用求。', lotMeaning: '行善积德。', lotExplanation: '多做好事，福报自来。' },
      { lotNumber: 14, lotName: '知足常乐', lotContent: '人生在世知多少，知足常乐最逍遥。不求富贵求安康，平淡是真乐陶陶。', lotMeaning: '知足是福。', lotExplanation: '珍惜当下，知足常乐。' },
      { lotNumber: 15, lotName: '勤能补拙', lotContent: '勤能补拙是良训，一分辛苦一分才。笨鸟先飞早入林，持之以恒事竟成。', lotMeaning: '勤奋努力。', lotExplanation: '天道酬勤，努力必有回报。' },
      { lotNumber: 16, lotName: '守正出奇', lotContent: '守正不阿立身处，出奇制胜显神通。正奇相合事事成，智勇双全建奇功。', lotMeaning: '守正创新。', lotExplanation: '坚守正道，灵活应变。' },
      { lotNumber: 17, lotName: '未雨绸缪', lotContent: '未雨绸缪早准备，有备无患事事成。防患未然智者行，临危不乱显从容。', lotMeaning: '提前准备。', lotExplanation: '做好规划，有备无患。' },
      { lotNumber: 18, lotName: '厚德载物', lotContent: '地势坤厚载万物，君子德厚容百川。宽以待人严以己，德行天下路自宽。', lotMeaning: '修身养德。', lotExplanation: '提升品德，路越走越宽。' },
      { lotNumber: 19, lotName: '水到渠成', lotContent: '瓜熟蒂落水到渠，功到自然成有时。不必强求不必急，时机一到事自成。', lotMeaning: '时机成熟。', lotExplanation: '耐心等待，水到渠成。' },
      { lotNumber: 20, lotName: '虚怀若谷', lotContent: '虚心使人能进步，骄傲使人会落后。虚怀若谷纳百川，学无止境永向前。', lotMeaning: '虚心学习。', lotExplanation: '保持谦虚，不断进步。' },
      { lotNumber: 21, lotName: '随机应变', lotContent: '世事如棋局局新，随机应变是达人。固步自封难前进，灵活变通事事成。', lotMeaning: '灵活变通。', lotExplanation: '因势利导，随机应变。' },
      { lotNumber: 22, lotName: '同心协力', lotContent: '众人拾柴火焰高，同心协力事事成。团结就是力量大，众志成城无不成。', lotMeaning: '团结合作。', lotExplanation: '与人合作，事半功倍。' },
      { lotNumber: 23, lotName: '脚踏实地', lotContent: '千里之行始足下，万丈高楼平地起。脚踏实地莫好高，一步一脚印向前。', lotMeaning: '务实做事。', lotExplanation: '从基础做起，稳步前进。' },
      { lotNumber: 24, lotName: '见机行事', lotContent: '识时务者为俊杰，见机行事是智者。该进则进该退退，把握时机事事成。', lotMeaning: '把握时机。', lotExplanation: '观察形势，适时行动。' },
      { lotNumber: 25, lotName: '宁静致远', lotContent: '非淡泊无以明志，非宁静无以致远。心静方能思长远，浮躁难成大事业。', lotMeaning: '心静致远。', lotExplanation: '保持内心平静，方能成就大事。' },
      { lotNumber: 26, lotName: '精益求精', lotContent: '百尺竿头进一步，精益求精无止境。追求卓越不满足，方能达到最高峰。', lotMeaning: '追求卓越。', lotExplanation: '不断改进，追求完美。' },
      { lotNumber: 27, lotName: '以德服人', lotContent: '以力服人非真服，以德服人心自服。德行天下人敬仰，威望自来不用求。', lotMeaning: '德行天下。', lotExplanation: '以德待人，自然受人尊敬。' },
      { lotNumber: 28, lotName: '居安思危', lotContent: '居安思危智者行，未雨绸缪早准备。盛世不忘乱世苦，平安常记危险时。', lotMeaning: '警惕风险。', lotExplanation: '顺境中也要保持警惕。' },
      { lotNumber: 29, lotName: '循序渐进', lotContent: '欲速则不达道理，循序渐进是正道。一口吃不成胖子，一步一脚印向前。', lotMeaning: '按部就班。', lotExplanation: '稳步前进，不要急于求成。' },
      { lotNumber: 30, lotName: '取长补短', lotContent: '三人行必有我师，取长补短是智慧。学习他人优点处，弥补自己不足处。', lotMeaning: '学习他人。', lotExplanation: '虚心学习，不断完善自己。' },
      { lotNumber: 31, lotName: '而不舍', lotContent: '锲而不舍金石镂，持之以恒事事成。坚持到底不放弃，成功就在前方等。', lotMeaning: '坚持不懈。', lotExplanation: '坚持就是胜利。' },
      { lotNumber: 32, lotName: '审时度势', lotContent: '审时度势是智者，把握大局显才能。看清形势再行动，事半功倍事事成。', lotMeaning: '看清形势。', lotExplanation: '分析形势，做出正确决策。' },
      { lotNumber: 33, lotName: '以柔克刚', lotContent: '柔弱胜刚强道理，以柔克刚是智慧。滴水穿石非力大，持之以恒功自成。', lotMeaning: '以柔制胜。', lotExplanation: '用柔和的方式解决问题。' },
      { lotNumber: 34, lotName: '知足不辱', lotContent: '知足不辱知止安，贪得无厌招祸端。适可而止是智慧，知足常乐保平安。', lotMeaning: '适可而止。', lotExplanation: '不要贪心，知足常乐。' },
      { lotNumber: 35, lotName: '大智若愚', lotContent: '大智若愚是境界，大巧若拙是真功。不显山不露水处，真才实学在其中。', lotMeaning: '内敛智慧。', lotExplanation: '真正的智慧往往不显露。' },
      { lotNumber: 36, lotName: '因势利导', lotContent: '因势利导是良策，顺势而为事半功。逆流而上难前进，顺水推舟易成功。', lotMeaning: '顺应大势。', lotExplanation: '借助大势，事半功倍。' },
      { lotNumber: 37, lotName: '博采众长', lotContent: '博采众长是智慧，兼收并蓄显胸怀。学习各家优点处，融会贯通自成家。', lotMeaning: '广泛学习。', lotExplanation: '吸收各方优点，提升自己。' },
      { lotNumber: 38, lotName: '量力而行', lotContent: '量力而行是明智，逞强好胜招祸端。认清自己能力处，适可而止保平安。', lotMeaning: '认清自己。', lotExplanation: '不要超出自己的能力范围。' },
      { lotNumber: 39, lotName: '以静制动', lotContent: '以静制动是策略，以不变应万变招。沉着冷静观其变，后发制人显高招。', lotMeaning: '冷静应对。', lotExplanation: '保持冷静，后发制人。' },
      { lotNumber: 40, lotName: '厚积薄发', lotContent: '厚积薄发是道理，积累深厚方有成。十年磨剑为一搏，关键时刻显身手。', lotMeaning: '积累沉淀。', lotExplanation: '平时积累，关键时刻爆发。' },
      { lotNumber: 41, lotName: '以退为进', lotContent: '以退为进是策略，暂时让步为将来。忍一时风平浪静，退一步海阔天空。', lotMeaning: '策略性退让。', lotExplanation: '暂时的退让是为了更好的前进。' },
      { lotNumber: 42, lotName: '云开见月', lotContent: '风散云开日，光华照四方。心清无挂碍，自有好时光。', lotMeaning: '困境将解。', lotExplanation: '坚持到底，曙光在前。' },
      { lotNumber: 43, lotName: '柳暗花明', lotContent: '柳暗花明又一村，山重水复疑无路。贵人指点迷津处，峰回路转见光明。', lotMeaning: '转机出现。', lotExplanation: '多与人交流，贵人自现。' },
      { lotNumber: 44, lotName: '以诚待人', lotContent: '以诚待人是根本，真心实意换真心。虚情假意难长久，诚信立世路自宽。', lotMeaning: '诚信为本。', lotExplanation: '真诚待人，才能获得信任。' },
      { lotNumber: 45, lotName: '顺势而上', lotContent: '顺势而上是智慧，逆势而行事难成。把握时代大趋势，乘风破浪向前进。', lotMeaning: '把握趋势。', lotExplanation: '顺应时代潮流，才能成功。' },
      { lotNumber: 46, lotName: '稳中求胜', lotContent: '稳中求胜是策略，冒进冒险招祸端。步步为营扎稳打，最终胜利属于我。', lotMeaning: '稳健行事。', lotExplanation: '稳健行事，最终获胜。' },
      { lotNumber: 47, lotName: '以德报怨', lotContent: '以德报怨是境界，宽容大度显胸怀。化干戈为玉帛处，和谐相处乐陶陶。', lotMeaning: '宽容大度。', lotExplanation: '用宽容化解矛盾。' },
      { lotNumber: 48, lotName: '知行合一', lotContent: '知行合一是真谛，理论实践要结合。光说不练假把式，身体力行是真功。', lotMeaning: '理论实践结合。', lotExplanation: '知识与行动要统一。' },
      { lotNumber: 49, lotName: '以简驭繁', lotContent: '以简驭繁是智慧，化繁为简显才能。抓住关键和本质，复杂问题简单解。', lotMeaning: '化繁为简。', lotExplanation: '抓住核心，简化问题。' },
      { lotNumber: 50, lotName: '与时俱进', lotContent: '与时俱进是要求，固步自封难生存。学习新知不断更新，方能立于不败地。', lotMeaning: '不断学习。', lotExplanation: '跟上时代，不断更新自己。' },
      { lotNumber: 51, lotName: '以和为贵', lotContent: '以和为贵是传统，和气生财是道理。和谐相处事事成，争吵斗气两败伤。', lotMeaning: '和谐相处。', lotExplanation: '和睦相处，对大家都有利。' },
      { lotNumber: 52, lotName: '居功不傲', lotContent: '居功不傲是美德，谦虚谨慎保平安。功成名就莫骄傲，低调做人路更长。', lotMeaning: '谦虚谨慎。', lotExplanation: '成功后不要骄傲，保持低调。' },
      { lotNumber: 53, lotName: '以信立世', lotContent: '以信立世是根本，言出必行是品格。诚信为人处事道，信誉良好路自宽。', lotMeaning: '诚信为本。', lotExplanation: '诚信是立身处世的根本。' },
      { lotNumber: 54, lotName: '以学益智', lotContent: '以学益智是正道，读书明理长见识。活到老来学到老，知识改变人生命。', lotMeaning: '终身学习。', lotExplanation: '不断学习，增长智慧。' },
      { lotNumber: 55, lotName: '以勤致富', lotContent: '以勤致富是真理，懒惰贫穷是必然。勤劳双手创财富，幸福生活靠自己。', lotMeaning: '勤劳致富。', lotExplanation: '勤劳是致富的根本。' },
      { lotNumber: 56, lotName: '以俭养德', lotContent: '以俭养德是传统，奢侈浪费招祸端。勤俭节约是美德，朴素生活最长久。', lotMeaning: '勤俭节约。', lotExplanation: '节俭是一种美德。' },
      { lotNumber: 57, lotName: '以爱化恨', lotContent: '以爱化恨是境界，宽容包容显胸怀。用爱感化仇怨处，和谐世界乐陶陶。', lotMeaning: '用爱感化。', lotExplanation: '用爱心化解仇恨。' },
      { lotNumber: 58, lotName: '以智取胜', lotContent: '以智取胜是策略，蛮干硬拼非良策。运筹帷幄决胜外，智慧才是真力量。', lotMeaning: '用智慧取胜。', lotExplanation: '智慧比力量更重要。' },
      { lotNumber: 59, lotName: '以义为先', lotContent: '以义为先是原则，见利忘义是小人。道义重于利益处，正直做人路自宽。', lotMeaning: '道义为先。', lotExplanation: '做人要讲道义。' },
      { lotNumber: 60, lotName: '圆满如意', lotContent: '功德圆满事事顺，如意吉祥福满门。心想事成皆如愿，幸福美满乐无边。', lotMeaning: '万事圆满。', lotExplanation: '一切顺利，心想事成。' }
    ];

    var randomIndex = Math.floor(Math.random() * backupLots.length);
    var selectedLot = backupLots[randomIndex];

    console.log('[index] 启用备用签文，随机选择第', randomIndex + 1, '支:', selectedLot.lotName);

    var lotContentLines = [];
    if (selectedLot.lotContent) {
      // 方案 2：先按标点符号断行，再去掉标点符号
      var originalContent = selectedLot.lotContent;
      console.log('[index] 原始签文:', originalContent);

      // 将所有标点符号替换为逗号，然后分割
      var normalized = originalContent
        .replace(/，/g, ',')  // 中文逗号 → 英文逗号
        .replace(/。/g, ',')  // 中文句号 → 英文逗号
        .replace(/\./g, ','); // 英文句号 → 英文逗号

      var parts = normalized.split(',');

      // 过滤掉空字符串和纯空格
      lotContentLines = parts.filter(function(line) {
        return line && line.trim().length > 0;
      });

      console.log('[index] 签文分行:', lotContentLines);
      console.log('[index] 分行数量:', lotContentLines.length);
    }
    if (lotContentLines.length === 0) {
      lotContentLines = [selectedLot.lotContent || ''];
    }

    this.setData({
      lotData: {
        ...selectedLot,
        lotContentLines: lotContentLines
      },
      showResult: true
    });

    wx.showToast({
      title: '已获取签文',
      icon: 'success'
    });
  },

openEnergy: function() {
    if (!this.data.lotData || !this.data.lotData.lotContent) {
      wx.showToast({
        title: '请先获取签文',
        icon: 'none'
      });
      return;
    }

    // 先显示 loading，等 AI 返回后再显示弹窗
    wx.showLoading({
      title: 'AI 解读中...',
      mask: true
    });

    // 调用 AI 生成深度解读
    this.generateInterpretationWithAI(this.data.lotData);
  },

  // 使用千问 AI 生成深度解读
  generateInterpretationWithAI: function(lotData) {
    var that = this;

    const DASHSCOPE_API_KEY = 'YOUR_DASHSCOPE_API_KEY_HERE';
    const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    wx.request({
      url: DASHSCOPE_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DASHSCOPE_API_KEY
      },
      data: {
        model: 'qwen-turbo',
        stream: false,
        messages: [
          {
            role: 'system',
            content: '你是一位精通中国传统文化、周易八卦、命理学和诗签的玄学专家。请根据用户提供的签文，生成详细的解读，包括：\n1. 核心寓意（80-120 字，总结这支签的核心启示）\n2. 行动指引（80-120 字，给出具体可行的建议）\n3. 运势建议（针对事业、财运、感情、健康四个方面，各 30-50 字）\n\n请以 JSON 格式返回，格式如下：\n{\n  "meaning": "核心寓意",\n  "guidance": "行动指引",\n  "advice": {\n    "career": "事业建议",\n    "wealth": "财运建议",\n    "love": "感情建议",\n    "health": "健康建议"\n  }\n}'
          },
          {
            role: 'user',
            content: '请解读以下签文：\n签题：' + lotData.lotName + '\n签文：' + lotData.lotContent + '\n解签：' + (lotData.lotMeaning || '') + '\n运势提示：' + (lotData.lotExplanation || '')
          }
        ]
      },
      success: function(res) {
        console.log('[index] 解读 AI 响应:', res);

        if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0]) {
          try {
            var aiResponse = res.data.choices[0].message.content;
            console.log('[index] 解读 AI content:', aiResponse);

            // 尝试提取 JSON
            var jsonStr = aiResponse;
            if (aiResponse.indexOf('```') >= 0) {
              var match = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
              if (match && match[1]) {
                jsonStr = match[1];
              }
            }

            // 注意：必须先提取 JSON 对象，再清理换行符
            var startIdx = jsonStr.indexOf('{');
            var endIdx = jsonStr.lastIndexOf('}');
            if (startIdx >= 0 && endIdx > startIdx) {
              jsonStr = jsonStr.substring(startIdx, endIdx + 1);
            }

            // 清理特殊字符和换行符
            jsonStr = jsonStr.trim().replace(/[\n\r]/g, ' ').replace(/↵/g, ' ').replace(/\s+/g, ' ');

            var interpretation = JSON.parse(jsonStr);
            console.log('[index] 解读解析成功:', interpretation);

            // 隐藏 loading，显示弹窗
            wx.hideLoading();

            that.setData({
              showInterpret: true,
              interpretation: {
                meaning: interpretation.meaning || lotData.lotMeaning || '此签文蕴含深刻的人生哲理，值得细细品味。',
                guidance: interpretation.guidance || '建议您保持平和的心态，顺势而为，不要强求。'
              },
              advice: interpretation.advice || {
                career: '保持积极进取的心态，把握机会',
                wealth: '理性投资，避免冲动消费',
                love: '真诚沟通，珍惜眼前人',
                health: '注意作息规律，适当运动'
              }
            });

          } catch (e) {
            console.error('[index] 解读解析失败:', e);
            // 隐藏 loading，显示弹窗
            wx.hideLoading();
            // 使用默认数据
            that.setData({
              showInterpret: true,
              interpretation: {
                meaning: lotData.lotMeaning || '此签文蕴含深刻的人生哲理，值得细细品味。',
                guidance: '建议您保持平和的心态，顺势而为，不要强求。'
              },
              advice: {
                career: '工作中保持专注，展现专业能力',
                wealth: '理财需谨慎，避免高风险投资',
                love: '感情需要用心经营，多沟通理解',
                health: '注意饮食均衡，保持良好作息'
              }
            });
          }
        } else {
          console.error('[index] 解读 AI 请求失败:', res);
          // 使用默认数据
          that.setData({
            interpretation: {
              meaning: lotData.lotMeaning || '此签文蕴含深刻的人生哲理，值得细细品味。',
              guidance: '建议您保持平和的心态，顺势而为，不要强求。'
            },
            advice: {
              career: '工作中保持专注，展现专业能力',
              wealth: '理财需谨慎，避免高风险投资',
              love: '感情需要用心经营，多沟通理解',
              health: '注意饮食均衡，保持良好作息'
            }
          });
        }
      },
      fail: function(err) {
        console.error('[index] 解读 AI 请求失败:', err);
        // 隐藏 loading
        wx.hideLoading();
        // 使用默认数据
        that.setData({
          showInterpret: true,
          interpretation: {
            meaning: lotData.lotMeaning || '此签文蕴含深刻的人生哲理，值得细细品味。',
            guidance: '建议您保持平和的心态，顺势而为，不要强求。'
          },
          advice: {
            career: '工作中保持专注，展现专业能力',
            wealth: '理财需谨慎，避免高风险投资',
            love: '感情需要用心经营，多沟通理解',
            health: '注意饮食均衡，保持良好作息'
          }
        });
      }
    });
  },

  // 切换左侧菜单
  toggleLeftMenu: function() {
    this.setData({
      leftMenuOpen: !this.data.leftMenuOpen,
      rightMenuOpen: false
    });
  },

  // 切换右侧菜单
  toggleRightMenu: function() {
    this.setData({
      rightMenuOpen: !this.data.rightMenuOpen,
      leftMenuOpen: false
    });
  },

  // 关闭所有菜单
  closeAllMenus: function() {
    this.setData({
      leftMenuOpen: false,
      rightMenuOpen: false
    });
  },

  // 左侧菜单导航函数
  navigateToFingerprint: function() {
    this.closeAllMenus();
    wx.navigateTo({ url: '/subpkg-tools/pages/fingerprint/index' });
  },
  navigateToAlmanac: function() {
    this.closeAllMenus();
    wx.navigateTo({ url: '/pages/almanac/almanac' });
  },
  navigateToDailyDraw: function() {
    this.closeAllMenus();
    wx.navigateTo({ url: '/pages/daily-draw/daily-draw-start' });
  },
  navigateToDailyQuestion: function() {
    this.closeAllMenus();
    wx.navigateTo({ url: '/subpkg-tools/pages/daily-question/daily-question' });
  },

  // 右侧菜单 - AI 功能
  openAiAnalysis: function(e) {
    var type = e.currentTarget.dataset.type;
    var config = this.getAiAnalysisConfig(type);

    if (!config) {
      wx.showToast({ title: '功能暂未开放', icon: 'none' });
      return;
    }

    this.closeAllMenus();

    // 初始化数据
    this.setData({
      analysisConfig: config,
      showAnalysisDialog: true,
      userInput: '',
      birthDateValue: '',
      analysisResult: ''
    });
  },

  // 获取 AI 功能配置
  getAiAnalysisConfig: function(type) {
    var configs = {
      numberLuck: {
        type: 'numberLuck',
        title: '数字能量',
        description: '通过数字能量学和周易八卦分析数字能量',
        placeholder: '请输入手机号码或车牌号',
        requiresName: true,
        requiresBirthDate: false,
        prompt: (input) => `请分析号码"${input}"的吉凶属性，从数字能量学和周易八卦的角度进行详细解读，包括：1. 号码的五行属性 2. 吉凶评分（1-10 分）3. 适合的用途 4. 使用建议`
      },
      constellation: {
        type: 'constellation',
        title: '星座分析',
        description: '分析星座的性格特征和运势走向',
        placeholder: '请输入星座，如：白羊座',
        requiresName: true,
        requiresBirthDate: false,
        prompt: (input) => `请对"${input}"进行详细的星座分析，包括：1. 性格特征 2. 本周运势 3. 爱情运势 4. 事业运势 5. 财运 6. 健康建议 7. 幸运数字和颜色`
      },
      dreamInterpretation: {
        type: 'dreamInterpretation',
        title: '周公解梦',
        description: '解析梦境的寓意和预兆',
        placeholder: '请描述您的梦境',
        requiresName: true,
        requiresBirthDate: false,
        prompt: (input) => `请使用周公解梦的方式，详细解析梦境"${input}"的寓意和预兆，包括：1. 传统解梦 2. 心理学解读 3. 近期运势提示 4. 行动建议`
      },
      auspiciousDay: {
        type: 'auspiciousDay',
        title: '黄道吉日',
        description: '查询日期的宜忌事项',
        placeholder: '请选择日期',
        requiresName: false,
        requiresBirthDate: true,
        datePickerType: 'date',
        datePickerLabel: '日期',
        prompt: (input, date) => `请详细分析黄道吉日宜忌信息，严格按以下格式返回（带标点符号）：

宜：祭祀、祈福、求嗣、开光、动土、安门、修造、谢土、拆卸、嫁娶、安葬、修造、祈福、求财。

忌：出行、开市、词讼、破土、置产、移柩、伐木、安床。

五行：金水相生之象。详细解析五行属性对运势的影响，包括阴阳平衡、生克关系等。

冲煞：冲鼠煞北。详细解释冲煞的含义，对属鼠人的影响，以及需要避免的方位和活动。

彭祖百忌：甲不开仓财物耗散，乙不问人先入为主，丙不修灶必见火灾，丁不剃头头风目疾，戊不辞官失禄亡财，己不破土动土遭殃，庚不祭祀主重忧，辛不嫁娶犯天罡，壬不冠带终身不旺，癸不词讼理弱声微。详细解释每个百忌的含义和注意事项。

综合建议：五行属金水相生之象，行事需注意谨慎周全。适宜进行祭祀祈福等吉祥活动，有利于家庭和谐与事业顺利。不宜进行出行开市等活动，避免因决策失误带来损失。此时适合进行婚嫁安葬等重大事宜，但需注意避免与生肖鼠相冲的方位。保持内心平静，以求得最佳运势。

️ 要求：
1. 每个部分之间空一行
2. 使用标点符号（顿号、逗号、句号）
3. 不要提及日期（不要写"今日"、"这一天"等）
4. 内容要详细，300 字左右`
      }
    };
    return configs[type];
  },

  // 调用 AI 分析
  callAiAnalysis: function(title, input, dateValue) {
    var that = this;
    var config = this.data.analysisConfig;

    if (!config) return;

    wx.showLoading({ title: 'AI 分析中...', mask: true });

    // 使用 lunar.js 计算准确的农历
    var lunarText = '';
    try {
      var lunar = require('../../../utils/lunar.js');
      var lunarInfo = lunar.formatLunarDate(new Date(dateValue));
      lunarText = lunarInfo.full;
    } catch(e) {
      lunarText = '农历日期';
    }

    // 构建 prompt - 使用 config 中定义的 prompt
    var promptText = '';
    if (config.prompt) {
      // 使用 config 中定义的 prompt（黄道吉日使用带标点的版本）
      if (config.requiresBirthDate && dateValue) {
        promptText = config.prompt(input, dateValue);
      } else {
        promptText = config.prompt(input);
      }
    } else {
      // 默认 prompt
      promptText = `请分析宜忌信息，包括：1. 宜 2. 忌 3. 五行 4. 冲煞 5. 彭祖百忌 6. 综合建议`;
    }

    wx.request({
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_DASHSCOPE_API_KEY_HERE'
      },
      data: {
        model: 'qwen-turbo',
        stream: false,
        messages: [
          {
            role: 'system',
            content: '你是一位精通中国传统文化、周易八卦、命理学的玄学专家。请用清晰易懂的中文回答，不要使用 markdown 格式（不要用*、#、**等符号），不要用 JSON 格式，直接用纯文本分段表述。'
          },
          {
            role: 'user',
            content: promptText
          }
        ]
      },
      success: function(res) {
        wx.hideLoading();

        if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0]) {
          var result = res.data.choices[0].message.content;
          console.log('良辰吉日 AI 返回:', result);

          // 清理 markdown 格式
          result = that.cleanMarkdown(result);
          
          // 简单的格式化：将每个部分的标题加粗
          var formattedResult = result
            .replace(/^宜：/gm, '<div style="color:#c05c41;font-size:18px;font-weight:bold;margin:20px 0 10px 0;">宜：</div>')
            .replace(/^忌：/gm, '<div style="color:#c05c41;font-size:18px;font-weight:bold;margin:20px 0 10px 0;">忌：</div>')
            .replace(/^五行：/gm, '<div style="color:#c05c41;font-size:18px;font-weight:bold;margin:20px 0 10px 0;">五行：</div>')
            .replace(/^冲煞：/gm, '<div style="color:#c05c41;font-size:18px;font-weight:bold;margin:20px 0 10px 0;">冲煞：</div>')
            .replace(/^彭祖百忌：/gm, '<div style="color:#c05c41;font-size:18px;font-weight:bold;margin:20px 0 10px 0;">彭祖百忌：</div>')
            .replace(/^综合建议：/gm, '<div style="color:#c05c41;font-size:18px;font-weight:bold;margin:20px 0 10px 0;">综合建议：</div>')
            .replace(/\n\n/g, '<br/><br/>')
            .replace(/\n/g, '<br/>');
          
          // 显示结果
          that.setData({
            analysisResult: result,
            formattedResult: formattedResult
          });
        } else {
          wx.showToast({ title: 'AI 服务暂时不可用', icon: 'none' });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        console.error('[AI 分析] 请求失败:', err);
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  // 清理 markdown 格式
  cleanMarkdown: function(text) {
    if (!text) return '';

    // 移除代码块标记
    text = text.replace(/```[\s\S]*?```/g, '');

    // 移除标题标记
    text = text.replace(/^#{1,6}\s+/gm, '');

    // 移除粗体/斜体标记
    text = text.replace(/\*\*(.+?)\*\*/g, '$1');
    text = text.replace(/\*(.+?)\*/g, '$1');
    text = text.replace(/__(.+?)__/g, '$1');
    text = text.replace(/_(.+?)_/g, '$1');

    // 移除列表标记
    text = text.replace(/^[\s]*[-*+]\s+/gm, '• ');
    text = text.replace(/^[\s]*\d+\.\s+/gm, '• ');

    // 移除引用标记
    text = text.replace(/^>\s+/gm, '');

    // 移除行内代码标记
    text = text.replace(/`([^`]+)`/g, '$1');

    // 移除多余空行
    text = text.replace(/\n{3,}/g, '\n\n');

    // 移除首尾空白
    text = text.trim();

    return text;
  },

  // 显示 AI 结果弹窗（带关闭按钮）
  showAiResultModal: function(title, content) {
    var that = this;

    // 使用自定义弹窗而不是 wx.showModal
    this.setData({
      showAiResultModal: true,
      aiResultTitle: title,
      aiResultContent: content
    });
  },

  // 关闭 AI 结果弹窗
  closeAiResultModal: function() {
    this.setData({
      showAiResultModal: false,
      aiResultTitle: '',
      aiResultContent: ''
    });
  },

  // 复制 AI 结果
  copyAiResult: function() {
    var that = this;
    wx.setClipboardData({
      data: this.data.aiResultContent,
      success: function() {
        wx.showToast({ title: '已复制', icon: 'success' });
        that.closeAiResultModal();
      }
    });
  },

  // 关闭分析弹窗
  closeAnalysisDialog: function() {
    this.setData({
      showAnalysisDialog: false,
      analysisConfig: {},
      userInput: '',
      birthDateValue: '',
      analysisResult: ''
    });
  },

  // 阻止事件冒泡（防止点击输入框关闭弹窗）
  preventClose: function(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  },

  // 用户输入变化
  onUserInput: function(e) {
    this.setData({ userInput: e.detail.value });
  },

  // 日期选择变化
  onDateChange: function(e) {
    var dateValue = e.detail.value;
    
    // 计算农历日期（硬编码 2026 年 9 月）
    var dateObj = new Date(dateValue);
    var year = dateObj.getFullYear();
    var month = dateObj.getMonth() + 1;
    var day = dateObj.getDate();
    
    var lunarDateStr = '';
    if (year === 2026 && month === 9) {
      var dayOffset = day - 1;
      var lunarDayNum = 20 + dayOffset; // 9 月 1 日=七月二十
      var lunarDays = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
      var dayStr = lunarDays[lunarDayNum - 1] || '初一';
      lunarDateStr = '丙午年 七月' + dayStr;
    } else {
      lunarDateStr = '农历日期';
    }
    
    var weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    var weekDayStr = weekDays[dateObj.getDay()];
    
    console.log('黄道吉日 onDateChange:', dateValue, lunarDateStr, weekDayStr);
    this.setData({
      birthDateValue: dateValue,
      lunarDate: lunarDateStr + ' ' + weekDayStr
    });
  },

  // 提交分析
  submitAnalysis: function() {
    var config = this.data.analysisConfig;
    var input = '';

    if (config.requiresName && this.data.userInput) {
      input = this.data.userInput;
    } else if (config.requiresBirthDate && this.data.birthDateValue) {
      input = this.data.birthDateValue;
    } else {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    this.callAiAnalysis(config.title, input, this.data.birthDateValue);
  },

  // 复制结果
  copyResult: function() {
    var that = this;
    wx.setClipboardData({
      data: this.data.analysisResult,
      success: function() {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 重新分析
  reanalyze: function() {
    this.setData({ analysisResult: '' });
  },

  // 右侧菜单 - 功能开发中提示
  showComingSoon: function() {
    this.closeAllMenus();
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  // 关闭解读弹窗
  closeInterpret: function() {
    // 清空签文和解读，恢复到初始状态
    this.setData({
      showInterpret: false,
      showResult: false,
      lotData: {},
      interpretation: {
        meaning: '',
        guidance: ''
      },
      advice: {
        career: '',
        wealth: '',
        love: '',
        health: ''
      }
    });
  },

  // 页面卸载时清理
  onUnload: function() {
    this.stopAudio();
    if (this.audioCtx) {
      this.audioCtx.stop();
      this.audioCtx.destroy();
    }
    try {
      wx.stopAccelerometer();
      wx.offAccelerometerChange();
    } catch (e) {
      console.log('[index] 清理传感器失败:', e);
    }
  },

  onShareAppMessage() {
    return {
      title: '天经地易 - 易经占卜',
      path: '/pages/fortune/index',
      imageUrl: ''
    };
  },

  onShareTimeline() {
    return {
      title: '天经地易 - 易经占卜',
      query: '',
      imageUrl: ''
    };
  }

});

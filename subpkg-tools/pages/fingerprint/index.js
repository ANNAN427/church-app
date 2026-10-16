Page({
  data: {
    navHeight: 44,
    genderValue: 0,
    currentFingerIndex: 0,
    flippingIndex: -1,
    fingerNames: ['拇指', '食指', '中指', '无名指', '小指'],
    isFlipping: false,
    fingerClass: ['', '', '', '', ''],
    fingerprints: [
      { key: 'mz', value: 's' },
      { key: 'sz', value: 's' },
      { key: 'zz', value: 's' },
      { key: 'wmz', value: 's' },
      { key: 'xz', value: 's' }
    ],
    completedCount: 0,
    progressPercent: 0,
    allDone: false
  },

  onLoad: function() {
    try{wx.showShareMenu({menus:['shareAppMessage','shareTimeline']})}catch(e){}
    var sysInfo = wx.getSystemInfoSync();
    var statusBarH = sysInfo.statusBarHeight || 44;
    this.setData({ navHeight: statusBarH });
    this.loadFromStorage();
    this.updateProgress();
  },

  // 从本地存储加载数据
  loadFromStorage: function() {
    var saved = wx.getStorageSync('fingerprint_data');
    if (saved) {
      var fps = saved.fingerprints || this.data.fingerprints;
      var all = true;
      for (var i = 0; i < fps.length; i++) {
        if (fps[i].value === 's') {
          all = false;
          break;
        }
      }
      this.setData({
        genderValue: saved.genderValue || 0,
        currentFingerIndex: saved.currentFingerIndex || 0,
        fingerprints: saved.fingerprints || this.data.fingerprints,
        fingerClass: saved.fingerClass || ['', '', '', '', ''],
        allDone: all
      });
      this.updateProgress();
    }
  },

  // 保存数据到本地存储
  saveToStorage: function() {
    wx.setStorageSync('fingerprint_data', {
      genderValue: this.data.genderValue,
      currentFingerIndex: this.data.currentFingerIndex,
      fingerprints: this.data.fingerprints,
      fingerClass: this.data.fingerClass
    });
  },

  // 更新进度条
  updateProgress: function() {
    var fingerprints = this.data.fingerprints;
    var count = 0;
    for (var i = 0; i < fingerprints.length; i++) {
      if (fingerprints[i].value !== 's') {
        count++;
      }
    }
    var percent = Math.round((count / 5) * 100);
    var all = true;
    for (var i = 0; i < this.data.fingerprints.length; i++) {
      if (this.data.fingerprints[i].value === 's') {
        all = false;
        break;
      }
    }
    this.setData({
      completedCount: count,
      progressPercent: percent,
      allDone: all
    });
  },

  // 更新硬币显示样式
  updateFingerClass: function() {
    var fingerprints = this.data.fingerprints;
    var classes = [];
    for (var i = 0; i < fingerprints.length; i++) {
      if (fingerprints[i].value === 'o') {
        classes.push('show-front');
      } else if (fingerprints[i].value === 'x') {
        classes.push('show-back');
      } else {
        classes.push('');
      }
    }
    this.setData({ fingerClass: classes });
  },

  // 切换性别
  setGender: function(e) {
    var val = e.currentTarget.dataset.val;
    this.setData({
      genderValue: val,
      currentFingerIndex: 0,
      fingerprints: [
        { key: 'mz', value: 's' },
        { key: 'sz', value: 's' },
        { key: 'zz', value: 's' },
        { key: 'wmz', value: 's' },
        { key: 'xz', value: 's' }
      ],
      fingerClass: ['', '', '', '', '']
    });
    this.updateProgress();
    this.saveToStorage();
    wx.vibrateShort({ type: 'light' });
  },

  // 跳转到指定手指
  jumpToFinger: function(e) {
    var index = e.currentTarget.dataset.index;
    this.setData({ currentFingerIndex: index });
    wx.vibrateShort({ type: 'light' });
  },

  // 点击硬币切换状态
  onClick: function(e) {
    var index = e.currentTarget.dataset.index;
    if (this.data.isFlipping) {
      return;
    }

    var currentVal = this.data.fingerprints[index].value;
    var newVal = 's';

    // 状态循环: 空(s) -> 斗(o) -> 簸(x) -> 空(s)
    if (currentVal === 's') {
      newVal = 'o';
    } else if (currentVal === 'o') {
      newVal = 'x';
    } else {
      newVal = 's';
    }

    this.setData({ isFlipping: true, flippingIndex: index });

    // 更新数据
    var propPath = 'fingerprints[' + index + '].value';
    var classPath = 'fingerClass[' + index + ']';
    var newClass = newVal === 'o' ? 'show-front' : (newVal === 'x' ? 'show-back' : '');

    var updates = {};
    updates[propPath] = newVal;
    updates[classPath] = newClass;
    this.setData(updates);

    // 震动反馈
    wx.vibrateShort({ type: 'medium' });

    this.saveToStorage();
    this.updateProgress();

    // 动画结束后自动跳到下一根手指
    var self = this;
    setTimeout(function() {
      var nextIndex = index + 1;
      if (nextIndex >= 5) {
        // 检查是否所有手指都已选择
        var allDone = true;
        for (var i = 0; i < self.data.fingerprints.length; i++) {
          if (self.data.fingerprints[i].value === 's') {
            allDone = false;
            break;
          }
        }
        if (allDone) {
          nextIndex = 5;
        } else {
          // 找到第一个未选择的手指
          nextIndex = 0;
          for (var j = 0; j < self.data.fingerprints.length; j++) {
            if (self.data.fingerprints[j].value === 's') {
              nextIndex = j;
              break;
            }
          }
        }
      }
      self.setData({
        isFlipping: false,
        flippingIndex: -1,
        currentFingerIndex: nextIndex
      });
      self.saveToStorage();
    }, 600);
  },

  // 获取运势结果
  getResult: function(pattern) {
    // pattern 格式: s/o/x 五字符组合，如 'sooxs'
    var douCount = 0;
    var jiCount = 0;
    for (var i = 0; i < pattern.length; i++) {
      if (pattern[i] === 'o') douCount++;
      else if (pattern[i] === 'x') jiCount++;
    }

    // 32种完整运势数据库
    var results = {
      // 5斗 - 极贵之命
      'ooooo': {
        type: '五斗聚命 · 极贵之格',
        summary: '五指皆斗，天生富贵之命，才智过人，运势亨通。',
        poetry: '五指皆螺聚宝盆，天生富贵命中存。',
        nature: '性格坚毅，意志力强，有领袖气质，做事果断。',
        marriage: '婚姻美满，伴侣贤良，家庭和睦幸福。',
        occupation: '适合从政、经商、企业管理，可成大器。',
        healthy: '注意心脑血管保养，避免过度劳累。',
        fortune: '一生运势亨通，中年后事业大成，晚年福寿双全。'
      },
      // 5簸 - 平淡是真
      'xxxxx': {
        type: '五簸开运 · 平和之格',
        summary: '五指皆簸，为人朴实，勤劳本分，一生平安。',
        poetry: '五指皆簸性温和，勤劳本分福自多。',
        nature: '性格温和，为人诚恳，踏实肯干，不善争斗。',
        marriage: '婚姻平淡但长久，相濡以沫，细水长流。',
        occupation: '适合技术类、手工业、农业等踏实工作。',
        healthy: '注意肠胃消化，保持规律作息。',
        fortune: '早年平凡，中年渐入佳境，晚年安逸无忧。'
      },
      // 4斗1簸
      'oooox': {
        type: '四斗一簸 · 富中之格',
        summary: '四斗聚财一簸开口，先富后稳，守成有道。',
        poetry: '四螺一簸财禄丰，先聚后守运自通。',
        nature: '聪明灵活，善于理财，但需注意守成。',
        marriage: '感情丰富，婚姻需用心经营。',
        occupation: '适合金融、投资、商贸类工作。',
        healthy: '注意肝肾保养，避免熬夜。',
        fortune: '财运旺盛，但需防大起大落，稳中求胜。'
      },
      'oooxo': {
        type: '四斗一簸 · 文昌之格',
        summary: '中指簸箕主文昌，才华横溢，文运亨通。',
        poetry: '中指开口文星照，才华横溢名自高。',
        nature: '聪慧好学，文采出众，有艺术天赋。',
        marriage: '知音难觅，一旦得之则白头偕老。',
        occupation: '适合教育、文化、艺术创作。',
        healthy: '注意视力保护，避免久坐。',
        fortune: '文运昌盛，以才致富，名声远播。'
      },
      'ooxoo': {
        type: '四斗一簸 · 将帅之格',
        summary: '中指簸箕为将星，有统帅之才，敢闯敢拼。',
        poetry: '中指独簸将星明，统领群雄事竟成。',
        nature: '胆识过人，有魄力，适合独当一面。',
        marriage: '婚姻中需学会包容，勿过于强势。',
        occupation: '适合军警、管理、创业。',
        healthy: '注意肝脏保养，控制脾气。',
        fortune: '事业有成，中年后权力地位日增。'
      },
      'oxooo': {
        type: '四斗一簸 · 智慧之格',
        summary: '食指簸箕主智谋，深谋远虑，善于策划。',
        poetry: '食指开口智谋深，运筹帷幄定乾坤。',
        nature: '思维缜密，善于分析策划，不轻易表态。',
        marriage: '感情内敛，需学会表达。',
        occupation: '适合咨询、策划、科研。',
        healthy: '注意神经系统保养，避免思虑过度。',
        fortune: '以智取胜，步步为营，终成大业。'
      },
      'xoooo': {
        type: '四斗一簸 · 根基之格',
        summary: '拇指簸箕主根基，虽然起步晚但后劲足。',
        poetry: '拇指独簸根基稳，大器晚成福自深。',
        nature: '坚韧不拔，吃苦耐劳，大器晚成型。',
        marriage: '晚婚为宜，婚姻稳定。',
        occupation: '适合实业、建筑、制造业。',
        healthy: '注意骨骼关节保养。',
        fortune: '早年辛苦，中年后渐入佳境，晚年富足。'
      },
      // 4簸1斗
      'xxxox': {
        type: '一斗四簸 · 技艺之格',
        summary: '仅无名指为斗，技艺精湛，以技立身。',
        poetry: '独螺无名技艺精，一技傍身走天下。',
        nature: '专注执着，对热爱之事极为投入。',
        marriage: '感情专一，但需多关注伴侣感受。',
        occupation: '适合专业技术、手工艺、设计。',
        healthy: '注意颈椎腰椎保养。',
        fortune: '以技致富，越老越吃香。'
      },
      'xxoxx': {
        type: '一斗四簸 · 中流之格',
        summary: '仅中指为斗，中庸之道，不偏不倚。',
        poetry: '中指独螺立中流，不偏不倚自无忧。',
        nature: '为人中正，处事公平，人缘极佳。',
        marriage: '婚姻和谐，夫妻相敬如宾。',
        occupation: '适合公务员、教师、中介服务。',
        healthy: '体质均衡，保持运动即可。',
        fortune: '一生平稳，无大起大落，知足常乐。'
      },
      'xoxxx': {
        type: '一斗四簸 · 智取之格',
        summary: '仅食指为斗，以智取胜，善于抓住机会。',
        poetry: '食指独螺智谋高，善于把握好时机。',
        nature: '反应灵敏，善于交际，机会把握力强。',
        marriage: '感情丰富，需注意专一。',
        occupation: '适合销售、公关、传媒。',
        healthy: '注意呼吸系统保养。',
        fortune: '抓住机遇可一飞冲天，但需防得意忘形。'
      },
      'oxxxx': {
        type: '一斗四簸 · 开创之格',
        summary: '仅拇指为斗，开创力极强，白手起家。',
        poetry: '拇指独螺开创力，白手起家建功业。',
        nature: '独立自主，不依赖他人，有开创精神。',
        marriage: '事业心强，需平衡家庭。',
        occupation: '适合创业、自由职业、独立工作室。',
        healthy: '注意心脏保养，劳逸结合。',
        fortune: '白手起家，创业维艰但终有成就。'
      },
      'xxxxo': {
        type: '一斗四簸 · 晚福之格',
        summary: '仅小指为斗，晚年运势极佳，子女孝顺。',
        poetry: '小指独螺晚运佳，子女孝顺享清福。',
        nature: '为人低调，晚年福气深厚。',
        marriage: '晚婚更好，子女运佳。',
        occupation: '适合服务行业、教育、慈善。',
        healthy: '注意泌尿系统保养。',
        fortune: '早年平淡，中晚年运势渐强，福寿双全。'
      },
      // 3斗2簸 组合
      'oooxx': {
        type: '三斗两簸 · 富贵之格',
        summary: '三斗聚前，财运亨通，社交能力强。',
        poetry: '三螺两簸财运通，左右逢源事事顺。',
        nature: '开朗豁达，善于交际，人缘极好。',
        marriage: '桃花旺盛，婚姻幸福美满。',
        occupation: '适合商贸、娱乐、公共关系。',
        healthy: '注意饮食节制，避免暴饮暴食。',
        fortune: '财运旺盛，善于把握商机，一生富贵。'
      },
      'ooxxo': {
        type: '三斗两簸 · 才艺之格',
        summary: '三斗夹两簸，多才多艺，适应力强。',
        poetry: '三螺两簸才艺丰，多才多艺路路通。',
        nature: '兴趣广泛，学习能力强，多才多艺。',
        marriage: '感情丰富，需学会专一。',
        occupation: '适合艺术、传媒、创意设计。',
        healthy: '注意情绪调节，避免多愁善感。',
        fortune: '多才多艺，可多方向发展，收入来源广。'
      },
      'oxxoo': {
        type: '三斗两簸 · 平衡之格',
        summary: '斗簸分布均衡，为人中庸，各方面都不错。',
        poetry: '斗簸均衡运自平，中庸之道最聪明。',
        nature: '为人中庸，各方面均衡发展。',
        marriage: '婚姻稳定，平淡中见真情。',
        occupation: '适合行政管理、人力资源。',
        healthy: '体质较好，保持锻炼即可。',
        fortune: '一生平稳发展，不冒险但收益稳定。'
      },
      'xooox': {
        type: '三斗两簸 · 聚财之格',
        summary: '中间三指为斗，聚财能力极强。',
        poetry: '中指三螺聚宝盆，财源滚滚入家门。',
        nature: '精于理财，对金钱敏感，善于积累。',
        marriage: '会持家，家庭经济稳定。',
        occupation: '适合财务、会计、银行。',
        healthy: '注意代谢系统保养。',
        fortune: '财运极佳，善于理财积累，越老越富。'
      },
      'oxoxo': {
        type: '三斗两簸 · 谋略之格',
        summary: '斗簸交替，思维灵活，善于变通。',
        poetry: '斗簸交替智谋深，随机应变最聪明。',
        nature: '思维灵活，善于变通，适应力强。',
        marriage: '感情中需要真诚，勿过于算计。',
        occupation: '适合战略咨询、投资分析。',
        healthy: '注意睡眠质量。',
        fortune: '善于把握趋势，顺势而为可获大利。'
      },
      'oxoox': {
        type: '三斗两簸 · 进取之格',
        summary: '前三指两斗一簸，进取心强。',
        poetry: '三螺进取志气高，勇往直前步步高。',
        nature: '积极进取，有目标感，执行力强。',
        marriage: '需平衡事业与家庭。',
        occupation: '适合项目管理、工程、IT。',
        healthy: '注意压力管理，避免过劳。',
        fortune: '事业心强，步步攀升，中年达巅峰。'
      },
      'xoxxo': {
        type: '三斗两簸 · 稳健之格',
        summary: '斗簸分布稳健，做事踏实有规划。',
        poetry: '稳健行事步步营，不急不躁自成事。',
        nature: '踏实稳重，有计划性，不急不躁。',
        marriage: '婚姻稳定，家庭责任感强。',
        occupation: '适合财务、审计、法律。',
        healthy: '注意腰椎颈椎保养。',
        fortune: '稳扎稳打，积少成多，晚年富足。'
      },
      'xoxoo': {
        type: '三斗两簸 · 智胜之格',
        summary: '以智取胜，善于利用资源。',
        poetry: '智胜之道在于谋，善用资源事半功。',
        nature: '善于利用资源和人脉，效率极高。',
        marriage: '善于经营关系，家庭和睦。',
        occupation: '适合资源整合、平台运营。',
        healthy: '注意眼睛保养。',
        fortune: '善用资源，以少博大，收益颇丰。'
      },
      'xooxo': {
        type: '三斗两簸 · 通达之格',
        summary: '中指无名指为斗，人际通达。',
        poetry: '中指无名螺相连，人际通达路路宽。',
        nature: '善于交际，人脉广泛，八面玲珑。',
        marriage: '桃花旺盛，婚姻需专一。',
        occupation: '适合公关、外交、社交行业。',
        healthy: '注意肝脏保养。',
        fortune: '人脉即财脉，善于借势上位。'
      },
      'ooxxo': {
        type: '三斗两簸 · 文运之格',
        summary: '前两指为斗，文运亨通。',
        poetry: '前两螺文运通达，书香门第出英才。',
        nature: '好学上进，文化底蕴深厚。',
        marriage: '门当户对，婚姻美满。',
        occupation: '适合教育、出版、文化传播。',
        healthy: '注意视力保护。',
        fortune: '以文立身，文化致富。'
      },
      // 2斗3簸 组合
      'ooxxx': {
        type: '两斗三簸 · 温和之格',
        summary: '两斗主温和，三簸主勤劳，一生安稳。',
        poetry: '两螺三簸性温和，勤劳本分福自多。',
        nature: '温和谦逊，勤劳踏实，不喜争斗。',
        marriage: '婚姻和谐，相敬如宾。',
        occupation: '适合服务、教育、医疗。',
        healthy: '注意肠胃保养。',
        fortune: '一生安稳，勤劳致富，知足常乐。'
      },
      'oxxox': {
        type: '两斗三簸 · 技艺之格',
        summary: '拇指无名指为斗，手巧心灵。',
        poetry: '拇无两螺手巧灵，技艺精湛美名扬。',
        nature: '手巧心灵，动手能力强。',
        marriage: '感情专一，用心经营。',
        occupation: '适合手工、设计、技术类。',
        healthy: '注意手部关节保养。',
        fortune: '以技立身，越老越值钱。'
      },
      'oxxxo': {
        type: '两斗三簸 · 晚成之格',
        summary: '拇指小指为斗，大器晚成。',
        poetry: '拇小两螺晚运佳，大器晚成名远扬。',
        nature: '有耐心，不急功近利，厚积薄发。',
        marriage: '晚婚为宜，婚姻稳定。',
        occupation: '适合研究、学术、咨询。',
        healthy: '注意肾脏保养。',
        fortune: '早年积累，中晚年爆发。'
      },
      'xooxx': {
        type: '两斗三簸 · 才略之格',
        summary: '食指中指为斗，才略兼备。',
        poetry: '食中两螺才略全，文武双全世无双。',
        nature: '聪明能干，有才略，执行力强。',
        marriage: '择偶眼光高，婚姻质量佳。',
        occupation: '适合管理、军警、法律。',
        healthy: '注意心脏保养。',
        fortune: '才略出众，事业有成。'
      },
      'xoxxo': {
        type: '两斗三簸 · 灵巧之格',
        summary: '食指小指为斗，心灵手巧。',
        poetry: '食小两螺灵巧至，心思细腻万事通。',
        nature: '心思细腻，观察力强。',
        marriage: '体贴入微，伴侣幸福。',
        occupation: '适合护理、心理、艺术。',
        healthy: '注意情绪管理。',
        fortune: '以细腻取胜，小处见大智慧。'
      },
      'xxxoo': {
        type: '两斗三簸 · 晚福之格',
        summary: '无名指小指为斗，晚年福厚。',
        poetry: '无小两螺晚福厚，子孙满堂乐悠悠。',
        nature: '为人善良，晚年福气深厚。',
        marriage: '子女运佳，家庭和睦。',
        occupation: '适合慈善、教育、服务。',
        healthy: '注意关节保养。',
        fortune: '早年辛苦，晚年享福。'
      },
      // 1斗4簸 已在上面覆盖主要情况，以下为补充
      // 0斗5簸 已在上面
      // 补充剩余的2斗3簸组合
      'xoxxx': {
        type: '一斗四簸 · 智取之格',
        summary: '仅食指为斗，以智取胜。',
        poetry: '食指独螺智谋高，善抓机遇步步高。',
        nature: '反应灵敏，善于抓住机会。',
        marriage: '感情丰富，需学会专一。',
        occupation: '适合销售、公关、传媒。',
        healthy: '注意呼吸系统保养。',
        fortune: '抓住机遇可一飞冲天。'
      },
      'xxoxx': {
        type: '一斗四簸 · 中庸之格',
        summary: '仅中指为斗，中庸之道。',
        poetry: '中指独螺立中流，不偏不倚自无忧。',
        nature: '为人中正，处事公平。',
        marriage: '婚姻和谐，相敬如宾。',
        occupation: '适合公务员、教师。',
        healthy: '体质均衡。',
        fortune: '一生平稳，知足常乐。'
      },
      'xxxox': {
        type: '一斗四簸 · 技艺之格',
        summary: '仅无名指为斗，技艺精湛。',
        poetry: '无名独螺技艺精，一技傍身走天下。',
        nature: '专注执着，精益求精。',
        marriage: '感情专一。',
        occupation: '适合专业技术、手工艺。',
        healthy: '注意颈椎保养。',
        fortune: '以技致富，越老越吃香。'
      },
      'xxxxo': {
        type: '一斗四簸 · 晚福之格',
        summary: '仅小指为斗，晚年运势极佳。',
        poetry: '小指独螺晚运佳，子女孝顺享清福。',
        nature: '为人低调，晚年福厚。',
        marriage: '晚婚更好。',
        occupation: '适合服务、教育。',
        healthy: '注意泌尿系统。',
        fortune: '早年平淡，晚年福气深厚。'
      }
    };

    // 如果有精确匹配则返回，否则根据斗数匹配
    if (results[pattern]) {
      return results[pattern];
    }

    // 兜底：根据斗数返回通用结果
    if (douCount === 5) {
      return results['ooooo'];
    } else if (douCount === 0) {
      return results['xxxxx'];
    } else if (douCount === 4) {
      return results['oooox'];
    } else if (douCount === 3) {
      return results['oooxx'];
    } else if (douCount === 2) {
      return results['ooxxx'];
    } else if (douCount === 1) {
      return results['oxxxx'];
    }

    return results['ooxxx'];
  },

  // 提交测算
  submit: function() {
    console.log('[submit] allDone:', this.data.allDone, 'currentFingerIndex:', this.data.currentFingerIndex);
    var fingerprints = this.data.fingerprints;
    var pattern = '';
    for (var i = 0; i < fingerprints.length; i++) {
      pattern += fingerprints[i].value;
    }

    var resultData = this.getResult(pattern);
    resultData.pattern = pattern;
    resultData.douCount = this.countDots(pattern);
    resultData.fingerDetails = this.getFingerDetails(pattern);

    wx.setStorageSync('fingerprint_result', resultData);
    wx.vibrateShort({ type: 'heavy' });

    wx.navigateTo({
      url: '/subpkg-tools/pages/fingerprint/result/result'
    });
  },

  // 统计斗的数量
  countDots: function(pattern) {
    var count = 0;
    for (var i = 0; i < pattern.length; i++) {
      if (pattern[i] === 'o') count++;
    }
    return count;
  },

  // 获取每根手指的详细状态
  getFingerDetails: function(pattern) {
    var fingerNames = ['拇指', '食指', '中指', '无名指', '小指'];
    var details = [];
    for (var i = 0; i < pattern.length; i++) {
      details.push({
        name: fingerNames[i],
        value: pattern[i] === 'o' ? '斗' : (pattern[i] === 'x' ? '簸箕' : '未选')
      });
    }
    return details;
  },

  onBack: function() {
    wx.navigateBack({ delta: 1 });
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '指纹密码 - 斗簸箕运势解析',
      path: '/subpkg-tools/pages/fingerprint/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '指纹密码 - 斗簸箕运势解析',
      query: ''
    };
  }

});

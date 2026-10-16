// pages/member/add.js
Page({
  data: {
    parentId: '',
    type: '',
    subtype: '',
    typeText: '',
    relationOptions: [],
    selectedRelation: {},
    addMode: 'new', // 'new' 或 'link'
    existingMembers: [],
    selectedMemberIndex: -1,
    memberName: '',
    genderIndex: 0,
    genderText: '男',
    birthDate: '',
    statusIndex: 0,
    statusText: '在世'
  },

  onStatusChange: function (e) {
    var index = e.detail.value;
    this.setData({
      statusIndex: index,
      statusText: index === 0 ? '在世' : '已故'
    });
  },

  onPhoneInput: function (e) {
    this.setData({ phone: e.detail.value });
  },

  onWechatInput: function (e) {
    this.setData({ wechat: e.detail.value });
  },

  onEmailInput: function (e) {
    this.setData({ email: e.detail.value });
  },

  onLoad: function (options) {
    console.log('add onLoad:', options.type, options.parentId);
    var type = options.type;
    // v711-51-fix-v93: 兼容 self 和 current 两种类型
    if (type === 'self') type = 'current';
    var subtype = options.subtype || '';
    var parentId = options.parentId;
    this.setData({ type: type, subtype: subtype, parentId: parentId });
    
    // 如果是添加当前人自己
    if (type === 'current') {
      // v711-51-fix-v94: 显式设置性别默认值为男性
      this.setData({
        typeText: '添加当前人',
        showRelation: false,
        genderIndex: 0,
        genderText: '男'
      });
    } else {
      this.loadRelationOptions(type, subtype);
      // 延迟调用确保 type 已设置
      var that = this;
      setTimeout(function() {
        that.loadExistingMembers();
      }, 100);
    }
  },

  // 加载现有成员列表（显示所有成员，让用户选择）
  loadExistingMembers: function () {
    var currentTreeId = wx.getStorageSync('currentTreeId') || 'default';
    var personsKey = 'persons_' + currentTreeId;
    var persons = wx.getStorageSync(personsKey) || [];
    var currentPersonId = this.data.parentId;
    var relationType = this.data.type;
    
    console.log('loadExistingMembers:', {
      currentTreeId: currentTreeId,
      personsKey: personsKey,
      personsCount: persons.length,
      currentPersonId: currentPersonId,
      relationType: relationType
    });
    
    // 确定需要的性别
    var requiredGender = '';
    if (relationType === 'father' || relationType === 'brother' || relationType === 'son') {
      requiredGender = 'male';
    } else if (relationType === 'mother' || relationType === 'sister' || relationType === 'daughter') {
      requiredGender = 'female';
    } else if (relationType === 'spouse') {
      // 配偶性别与当前人相反
      var currentPerson = persons.find(function(p) { return p.id === currentPersonId; });
      requiredGender = currentPerson && currentPerson.gender === 'male' ? 'female' : 'male';
    }
    
    // 过滤成员：只显示性别符合的成员
    var existingMembers = persons.filter(function(p) {
      // 排除当前人自己
      if (p.id === currentPersonId) return false;
      
      // 性别必须匹配
      if (requiredGender && p.gender !== requiredGender) return false;
      
      return true;
    });
    
    console.log('Available members for linking:', existingMembers.length, 'required gender:', requiredGender);
    console.log('existingMembers:', existingMembers);
    this.setData({ existingMembers: existingMembers });
  },
  
  // 查找与当前人有关系的所有成员 ID（BFS）
  findRelatedMemberIds: function (currentPersonId, relationships) {
    var relatedIds = [currentPersonId];
    var queue = [currentPersonId];
    var visited = {};
    visited[currentPersonId] = true;
    
    while (queue.length > 0) {
      var personId = queue.shift();
      
      // 查找所有与这个人有关系的人
      for (var i = 0; i < relationships.length; i++) {
        var r = relationships[i];
        var otherId = null;
        
        if (r.from === personId && !visited[r.to]) {
          otherId = r.to;
          visited[r.to] = true;
        } else if (r.to === personId && !visited[r.from]) {
          otherId = r.from;
          visited[r.from] = true;
        }
        
        if (otherId && relatedIds.indexOf(otherId) === -1) {
          relatedIds.push(otherId);
          queue.push(otherId);
        }
      }
    }
    
    return relatedIds;
  },

  loadRelationOptions: function (type, subtype) {
    var options = [];
    var typeText = '';
    var relationNamePrefix = '';

    if (type === 'father') {
      options = [
        { type: 'father', nature: 'biological', gender: 'male', icon: '👨', name: '生父' },
        { type: 'father', nature: 'adoptive', gender: 'male', icon: '👨', name: '养父' },
        { type: 'father', nature: 'step', gender: 'male', icon: '👨', name: '继父' }
      ];
      typeText = '父亲';
    } else if (type === 'mother') {
      options = [
        { type: 'mother', nature: 'biological', gender: 'female', icon: '👩', name: '生母' },
        { type: 'mother', nature: 'adoptive', gender: 'female', icon: '👩', name: '养母' },
        { type: 'mother', nature: 'step', gender: 'female', icon: '👩', name: '继母' }
      ];
      typeText = '母亲';
    } else if (type === 'brother') {
      if (subtype === '哥哥') {
        options = [
          { type: 'brother', nature: 'elder', gender: 'male', icon: '👨', name: '哥哥' }
        ];
      } else if (subtype === '弟弟') {
        options = [
          { type: 'brother', nature: 'younger', gender: 'male', icon: '👦', name: '弟弟' }
        ];
      } else {
        options = [
          { type: 'brother', nature: 'elder', gender: 'male', icon: '👨', name: '哥哥' },
          { type: 'brother', nature: 'younger', gender: 'male', icon: '👦', name: '弟弟' }
        ];
      }
      typeText = '兄弟';
    } else if (type === 'sister') {
      if (subtype === '姐姐') {
        options = [
          { type: 'sister', nature: 'elder', gender: 'female', icon: '👩', name: '姐姐' }
        ];
      } else if (subtype === '妹妹') {
        options = [
          { type: 'sister', nature: 'younger', gender: 'female', icon: '👧', name: '妹妹' }
        ];
      } else {
        options = [
          { type: 'sister', nature: 'elder', gender: 'female', icon: '👩', name: '姐姐' },
          { type: 'sister', nature: 'younger', gender: 'female', icon: '👧', name: '妹妹' }
        ];
      }
      typeText = '姐妹';
    } else if (type === 'spouse') {
      // 根据当前人性别自动识别配偶性别
      var currentPerson = null;
      var personsKey = 'persons_' + wx.getStorageSync('currentTreeId');
      var persons = wx.getStorageSync(personsKey) || [];
      var parentId = this.data.parentId;
      currentPerson = persons.find(function(p) { return p.id === parentId; });
      
      var autoGender = currentPerson && currentPerson.gender === 'male' ? 'female' : 'male';
      var autoText = autoGender === 'male' ? '丈夫' : '妻子';
      
      // 只显示一个自动识别的选项
      options = [
        { type: 'spouse', nature: 'biological', gender: autoGender, icon: autoGender === 'male' ? '👨' : '👩', name: autoText }
      ];
      typeText = '配偶';
    } else if (type === 'son') {
      options = [
        { type: 'son', nature: 'biological', gender: 'male', icon: '👦', name: '生子' },
        { type: 'son', nature: 'adoptive', gender: 'male', icon: '👦', name: '养子' },
        { type: 'son', nature: 'step', gender: 'male', icon: '👦', name: '继子' }
      ];
      typeText = '儿子';
    } else if (type === 'daughter') {
      options = [
        { type: 'daughter', nature: 'biological', gender: 'female', icon: '👧', name: '生女' },
        { type: 'daughter', nature: 'adoptive', gender: 'female', icon: '👧', name: '养女' },
        { type: 'daughter', nature: 'step', gender: 'female', icon: '👧', name: '继女' }
      ];
      typeText = '女儿';
    }

    this.setData({
      relationOptions: options,
      typeText: typeText,
      selectedRelation: options[0] || {},
      genderIndex: options[0] && options[0].gender === 'male' ? 0 : 1,
      genderText: options[0] && options[0].gender === 'male' ? '男' : '女',
      relationNamePrefix: relationNamePrefix
    });
  },

  // 设置添加方式
  setAddMode: function (e) {
    var mode = e.currentTarget.dataset.mode;
    this.setData({ 
      addMode: mode,
      selectedMemberIndex: -1
    });
    
    // 切换到关联模式时重新加载成员列表
    if (mode === 'link') {
      this.loadExistingMembers();
    }
  },

  // 选择现有成员
  onMemberSelect: function (e) {
    var index = e.detail.value;
    this.setData({ selectedMemberIndex: index });
    
    // 自动填充性别
    if (index >= 0) {
      var member = this.data.existingMembers[index];
      this.setData({
        genderIndex: member.gender === 'male' ? 0 : 1,
        genderText: member.gender === 'male' ? '男' : '女'
      });
    }
  },

  selectRelation: function (e) {
    var type = e.currentTarget.dataset.type;
    var nature = e.currentTarget.dataset.nature;
    var gender = e.currentTarget.dataset.gender;
    this.setData({
      selectedRelation: { type: type, nature: nature, gender: gender },
      genderIndex: gender === 'male' ? 0 : 1,
      genderText: gender === 'male' ? '男' : '女'
    });
  },

  onNameInput: function (e) {
    this.setData({ memberName: e.detail.value });
  },

  onGenderChange: function (e) {
    var index = e.detail.value;
    // v711-51-fix-v94: 确保 index 是数字类型
    index = parseInt(index) || 0;
    console.log('[性别切换] index:', index, 'genderText:', index === 0 ? '男' : '女');
    this.setData({
      genderIndex: index,
      genderText: index === 0 ? '男' : '女'
    });
  },

  onBirthChange: function (e) {
    this.setData({ birthDate: e.detail.value });
  },

  onStatusChange: function (e) {
    var index = e.detail.value;
    this.setData({
      statusIndex: index,
      statusText: index === 0 ? '在世' : '已故'
    });
  },

  saveMember: function () {
    console.log('===== saveMember 开始 =====');
    
    // 获取当前树 ID
    var currentTreeId = wx.getStorageSync('currentTreeId') || 'default';
    var personsKey = 'persons_' + currentTreeId;
    var relationshipsKey = 'relationships_' + currentTreeId;
    
    // 从新格式读取
    var persons = wx.getStorageSync(personsKey) || [];
    var relationships = wx.getStorageSync(relationshipsKey) || [];
    
    console.log('读取到 persons:', persons.length, 'relationships:', relationships.length);
    
    var selectedPerson = null;
    
    // 添加当前人自己
    if (this.data.type === 'current') {
      if (!this.data.memberName) {
        wx.showToast({ title: '请输入姓名', icon: 'none' });
        return;
      }

      selectedPerson = {
        id: 'p' + Date.now(),
        name: this.data.memberName,
        gender: this.data.genderIndex === 0 ? 'male' : 'female',
        birthDate: this.data.birthDate,
        status: this.data.statusIndex === 0 ? 'alive' : 'deceased'
      };
      
      persons.push(selectedPerson);
      
      // 保存当前人 ID
      wx.setStorageSync('currentPersonId_' + currentTreeId, selectedPerson.id);
      
    } else {
      // 关联现有成员模式
      if (this.data.addMode === 'link') {
        if (this.data.selectedMemberIndex < 0) {
          wx.showToast({ title: '请选择成员', icon: 'none' });
          return;
        }
        
        selectedPerson = this.data.existingMembers[this.data.selectedMemberIndex];
        
        // 验证性别是否匹配
        if (this.data.selectedRelation.gender && selectedPerson.gender !== this.data.selectedRelation.gender) {
          wx.showToast({ title: '性别不匹配', icon: 'none' });
          return;
        }
        
        // 创建新关系
        var newRel = {
          id: 'r' + Date.now(),
          from: this.data.parentId,
          to: selectedPerson.id,
          type: this.data.selectedRelation.type,
          nature: this.data.selectedRelation.nature,
          subtype: this.data.subtype || ''  // 保存 subtype
        };
        
        relationships.push(newRel);
        
      } else {
        // 新建成员模式
        if (!this.data.memberName) {
          wx.showToast({ title: '请输入姓名', icon: 'none' });
          return;
        }

        selectedPerson = {
          id: 'p' + Date.now(),
          name: this.data.memberName,
          gender: this.data.selectedRelation.gender,
          birthDate: this.data.birthDate,
          status: this.data.statusIndex === 0 ? 'alive' : 'deceased'
        };
        
        // 创建关系
        var newRel = {
          id: 'r' + Date.now(),
          from: this.data.parentId,
          to: selectedPerson.id,
          type: this.data.selectedRelation.type,
          nature: this.data.selectedRelation.nature,
          subtype: this.data.subtype || ''  // 保存 subtype
        };
        
        relationships.push(newRel);
        persons.push(selectedPerson);
      }
    }

    // 保存到新格式
    wx.setStorageSync(personsKey, persons);
    wx.setStorageSync(relationshipsKey, relationships);
    
    // v30: 数据变动后自动保存到云端
    var cloudSync = require('../../../utils/cloud-sync.js');
    var persons2 = wx.getStorageSync(personsKey);
    var relationships2 = wx.getStorageSync(relationshipsKey);
    cloudSync.saveTreeToCloud(currentTreeId, {
      tree_name: '我的家谱',
      local_tree_id: currentTreeId,
      persons: persons2,
      relationships: relationships2
    }, function() { console.log('[add] 云端保存成功'); });
    
    console.log('保存完成，persons:', persons.length, 'relationships:', relationships.length);
    
    // 修复：保存 parentId 作为 currentPersonId，确保返回后保持当前人身份
    wx.setStorageSync('currentPersonId_' + currentTreeId, this.data.parentId);
    console.log('[add saveMember] 保存 currentPersonId:', this.data.parentId);
    
    wx.showToast({ 
      title: '添加成功', 
      icon: 'success',
      duration: 1000
    });
    
    // 延迟返回，让首页有时间刷新
    setTimeout(function() {
      wx.navigateBack({ delta: 1 });
    }, 1500);
  }
});

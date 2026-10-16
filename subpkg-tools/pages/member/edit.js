// pages/member/edit.js
Page({
  data: {
    memberId: '',
    memberName: '',
    genderIndex: 0,
    genderText: '男',
    birthDate: '',
    statusIndex: 0,
    statusText: '在世'
  },

  onLoad: function (options) {
    console.log('edit onLoad, options:', options);
    if (options.id) {
      this.setData({ memberId: options.id });
      this.loadMemberData(options.id);
    }
  },

  loadMemberData: function (memberId) {
    console.log('====== loadMemberData 开始 ======');
    console.log('memberId:', memberId);
    
    // 从新格式读取
    var currentTreeId = wx.getStorageSync('currentTreeId') || 'default';
    var personsKey = 'persons_' + currentTreeId;
    var persons = wx.getStorageSync(personsKey) || [];
    
    console.log('读取 personsKey:', personsKey, 'persons:', persons.length);
    
    const person = persons.find(p => p.id === memberId);
    
    if (person) {
      console.log('找到成员:', person.name);
      console.log('person.status 值:', person.status, '类型:', typeof person.status);
      console.log('person.status === "deceased":', person.status === 'deceased');
      console.log('person.status === "已故":', person.status === '已故');
      
      var statusIndex = 0;
      var statusText = '在世';
      
      // 兼容多种 status 值
      if (person.status === 'deceased' || person.status === '已故') {
        statusIndex = 1;
        statusText = '已故';
      }
      
      console.log('最终 statusIndex:', statusIndex, 'statusText:', statusText);
      
      this.setData({
        memberName: person.name,
        genderIndex: person.gender === 'male' ? 0 : 1,
        genderText: person.gender === 'male' ? '男' : '女',
        birthDate: person.birthDate,
        statusIndex: statusIndex,
        statusText: statusText
      });
    } else {
      console.log('未找到成员，memberId:', memberId);
      // 成员不存在，可能是待添加状态，使用默认值
      this.setData({
        memberName: '',
        genderIndex: 0,
        genderText: '男',
        birthDate: '',
        statusIndex: 0,
        statusText: '在世'
      });
    }
  },

  onNameInput: function (e) {
    this.setData({ memberName: e.detail.value });
  },

  onGenderChange: function (e) {
    const index = e.detail.value;
    this.setData({
      genderIndex: index,
      genderText: index === 0 ? '男' : '女'
    });
  },

  onBirthChange: function (e) {
    this.setData({ birthDate: e.detail.value });
  },

  onStatusChange: function (e) {
    const index = e.detail.value;
    console.log('====== onStatusChange ======');
    console.log('e.detail.value:', index);
    console.log('typeof index:', typeof index);
    
    // 强制转换为数字
    const indexNum = Number(index);
    console.log('indexNum:', indexNum);
    
    // 立即更新 UI 显示
    this.setData({
      statusIndex: indexNum,
      statusText: indexNum === 0 ? '在世' : '已故'
    });
    
    console.log('setData 后 statusIndex:', this.data.statusIndex);
    console.log('setData 后 statusText:', this.data.statusText);
  },

  saveMember: function () {
    console.log('===== saveMember 开始 =====');
    const { memberId, memberName, genderIndex, birthDate, statusIndex } = this.data;

    if (!memberName) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }

    // 从新格式读取
    var currentTreeId = wx.getStorageSync('currentTreeId') || 'default';
    var personsKey = 'persons_' + currentTreeId;
    var persons = wx.getStorageSync(personsKey) || [];
    
    console.log('保存，personsKey:', personsKey, 'persons:', persons.length);
    console.log('statusIndex 原始值:', statusIndex, 'typeof:', typeof statusIndex);
    
    // ⭐ 强制转换为数字
    const statusIndexNum = Number(statusIndex);
    console.log('statusIndexNum 转换后:', statusIndexNum, 'typeof:', typeof statusIndexNum);
    
    const index = persons.findIndex(p => p.id === memberId);
    console.log('index:', index);
    
    if (index !== -1) {
      // 更新现有成员 - 直接修改属性，不使用展开运算符
      const newStatus = statusIndexNum === 0 ? 'alive' : 'deceased';
      console.log('更新前 status:', persons[index].status);
      console.log('更新后 status:', newStatus);
      
      // 直接修改对象属性
      persons[index].name = memberName;
      persons[index].gender = genderIndex === 0 ? 'male' : 'female';
      persons[index].birthDate = birthDate;
      persons[index].status = newStatus;  // ⭐ 关键：直接赋值

      console.log('保存前 persons[index].status:', persons[index].status);
      
      // 写入 storage
      wx.setStorageSync(personsKey, persons);
      
      // v30: 编辑后自动保存到云端
      var cloudSync2 = require('../../../utils/cloud-sync.js');
      var currentTreeId2 = wx.getStorageSync('currentTreeId') || '';
      var persons2 = wx.getStorageSync(personsKey);
      var relationshipsKey2 = 'relationships_' + currentTreeId2;
      var relationships2 = wx.getStorageSync(relationshipsKey2) || wx.getStorageSync('relationships') || [];
      cloudSync2.saveTreeToCloud(currentTreeId2, {
        tree_name: '我的家谱',
        local_tree_id: currentTreeId2,
        persons: persons2,
        relationships: relationships2
      }, function() { console.log('[edit] 云端保存成功'); });
      
      // 立即验证是否保存成功
      var verifyPersons = wx.getStorageSync(personsKey);
      var verifyPerson = verifyPersons.find(p => p.id === memberId);
      console.log('验证保存结果:', verifyPerson ? verifyPerson.status : 'not found');
      
      console.log('更新成功');
      console.log('更新后成员数据:', persons[index]);
      
      // 修复：保存 memberId 作为 currentPersonId，确保返回后保持当前人身份
      wx.setStorageSync('currentPersonId_' + currentTreeId, memberId);
      console.log('[edit saveMember] 保存 currentPersonId:', memberId);
      
      wx.showToast({ title: '保存成功', icon: 'success' });
      
      // 立即返回
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
    } else {
      // 成员不存在，创建新成员（待添加状态）
      console.log('成员不存在，创建新成员');
      
      var newPerson = {
        id: memberId || 'p_' + Date.now(),
        name: memberName,
        gender: genderIndex === 0 ? 'male' : 'female',
        birthDate: birthDate || '',
        status: statusIndexNum === 0 ? 'alive' : 'deceased'
      };
      
      persons.push(newPerson);
      wx.setStorageSync(personsKey, persons);
      
      // 保存当前人 ID
      wx.setStorageSync('currentPersonId_' + currentTreeId, newPerson.id);
      
      console.log('创建成功，newPerson:', newPerson);
      
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  // 删除成员
  deleteMember: function () {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该成员吗？删除后不可恢复！',
      confirmColor: '#e74c3c',
      success: function (res) {
        if (res.confirm) {
          console.log('===== deleteMember 开始 =====');
          var currentTreeId = wx.getStorageSync('currentTreeId') || 'default';
          var personsKey = 'persons_' + currentTreeId;
          var persons = wx.getStorageSync(personsKey) || [];
          
          const index = persons.findIndex(p => p.id === that.data.memberId);
          console.log('index:', index);
          
          if (index !== -1) {
            // 删除成员
            persons.splice(index, 1);
            wx.setStorageSync(personsKey, persons);
            console.log('删除成功');
            
            wx.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          } else {
            wx.showToast({ title: '成员不存在', icon: 'none' });
          }
        }
      }
    });
  }
});

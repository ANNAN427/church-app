// pages/member/member.js
Page({
  data: {
    memberId: '',
    memberInfo: {
      name: '',
      avatar: '👤',
      gender: 'male',
      relation: ''
    },
    existingChildren: []
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ memberId: options.id });
      this.loadMemberInfo(options.id);
      
      // 修复：保存当前查看的成员 ID 到 storage，确保返回时保持身份
      var currentTreeId = wx.getStorageSync('currentTreeId') || 'tree_default';
      wx.setStorageSync('currentPersonId_' + currentTreeId, options.id);
      console.log('[member onLoad] 保存 currentPersonId:', options.id);
    }
  },

  loadMemberInfo: function (memberId) {
    const persons = wx.getStorageSync('persons') || [];
    const relationships = wx.getStorageSync('relationships') || [];
    
    const person = persons.find(p => p.id === memberId);
    if (!person) {
      wx.showToast({ title: '成员不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 查找子女
    const children = relationships
      .filter(r => r.from === memberId && (r.type === 'son' || r.type === 'daughter'))
      .map(r => {
        const child = persons.find(p => p.id === r.to);
        return child ? { ...child, avatar: child.gender === 'male' ? '👨' : '👩' } : null;
      })
      .filter(c => c);

    this.setData({
      'memberInfo.name': person.name,
      'memberInfo.avatar': person.gender === 'male' ? '👨' : '👩',
      'memberInfo.gender': person.gender,
      'memberInfo.relation': '本人',
      existingChildren: children
    });
  },

  // 添加亲属 - 修复：跳转到 add 页面而不是直接返回
  addRelative: function (e) {
    const type = e.currentTarget.dataset.type;
    const { memberId } = this.data;
    
    // 构建 subtype 参数（兄弟/姐妹需要区分哥哥弟弟姐姐妹妹）
    var subtype = '';
    if (type === 'sibling') {
      // 兄弟姐妹需要用户选择具体类型，在 add 页面处理
      subtype = '';
    }
    
    // 跳转到 add 页面添加亲属
    wx.navigateTo({
      url: `/subpkg-tools/pages/member/add?type=${type}&subtype=${subtype}&parentId=${memberId}`
    });
  },

  // 查看子女
  viewChild: function (e) {
    const childId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/member/member?id=${childId}`
    });
  },

  // 编辑信息
  editMember: function () {
    const { memberId, memberInfo } = this.data;
    wx.navigateTo({
      url: `/pages/member/edit?id=${memberId}&name=${memberInfo.name}&birthDate=&gender=${memberInfo.gender}`
    });
  },

  // 删除成员
  deleteMember: function () {
    const { memberId } = this.data;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此成员吗？删除后无法恢复！',
      success: (res) => {
        if (res.confirm) {
          // 修复 v166: 使用正确的数据键（支持多树）
          var currentTreeId = wx.getStorageSync('currentTreeId') || 'tree_default';
          var personsKey = 'persons_' + currentTreeId;
          var relationshipsKey = 'relationships_' + currentTreeId;
          
          const persons = wx.getStorageSync(personsKey) || wx.getStorageSync('persons') || [];
          const relationships = wx.getStorageSync(relationshipsKey) || wx.getStorageSync('relationships') || [];
          
          const newPersons = persons.filter(p => p.id !== memberId);
          const newRelationships = relationships.filter(r => r.from !== memberId && r.to !== memberId);
          
          wx.setStorageSync(personsKey, newPersons);
          wx.setStorageSync(relationshipsKey, newRelationships);
          
          // v30: 删除后自动保存到云端
          var cloudSync3 = require('../../../utils/cloud-sync.js');
          var cloudPersons = wx.getStorageSync(personsKey);
          var cloudRelationships = wx.getStorageSync(relationshipsKey);
          cloudSync3.saveTreeToCloud(currentTreeId, {
            tree_name: '我的家谱',
            local_tree_id: currentTreeId,
            persons: cloudPersons,
            relationships: cloudRelationships
          }, function() { console.log('[delete] 云端保存成功'); });
          // 同时清理旧格式数据（兼容）
          wx.setStorageSync('persons', newPersons);
          wx.setStorageSync('relationships', newRelationships);
          
          wx.showToast({ title: '删除成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  },

  // 显示分支图谱
  showBranchTree: function () {
    wx.showToast({ title: '功能开发中...', icon: 'none' });
  },

  // 返回 - 修复：返回前保存当前 memberId
  goBack: function () {
    // 保存当前查看的成员 ID 到 storage
    var currentTreeId = wx.getStorageSync('currentTreeId') || 'tree_default';
    if (this.data.memberId) {
      wx.setStorageSync('currentPersonId_' + currentTreeId, this.data.memberId);
      console.log('[member goBack] 保存 currentPersonId:', this.data.memberId);
    }
    wx.navigateBack();
  }
});

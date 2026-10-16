// pages/index/index.js - 基于 v129 修复版本 v261
Page({
  data: {
    persons: [],
    relationships: [],
    currentPersonId: '',
    currentPerson: { name: '待添加', avatar: '👤', gender: 'male' },
    spouses: [],
    elders: [],
    brothers: [],
    sisters: [],
    children: [],
    hasFather: false,
    hasMother: false,
    totalPersons: 0,
    totalRelationships: 0,
    totalGenerations: 0,
    showCenterMenu: false,
    showSiblingMenu: false,
    showEditFamilyName: false,
    familyName: '主家谱',
    showMembersModal: false,
    allMembers: []
  },

  onLoad: function () {
    this.loadData();
  },

  onShow: function () {
    this.loadData();
  },

  loadData: function () {
    var currentTreeId = wx.getStorageSync('currentTreeId') || '';
    
    if (!currentTreeId) {
      var familyTrees = wx.getStorageSync('familyTrees') || [];
      if (familyTrees.length > 0) {
        currentTreeId = familyTrees[0].id;
      } else {
        var defaultTree = { id: 'tree_default', name: '主家谱', memberCount: 0 };
        familyTrees.push(defaultTree);
        wx.setStorageSync('familyTrees', familyTrees);
        wx.setStorageSync('persons_tree_default', []);
        wx.setStorageSync('relationships_tree_default', []);
        currentTreeId = 'tree_default';
      }
      wx.setStorageSync('currentTreeId', currentTreeId);
    }
    
    var personsKey = 'persons_' + currentTreeId;
    var relationshipsKey = 'relationships_' + currentTreeId;
    
    var persons = wx.getStorageSync(personsKey) || [];
    var relationships = wx.getStorageSync(relationshipsKey) || [];
    
    if (persons.length === 0) {
      persons = wx.getStorageSync('persons') || [];
      relationships = wx.getStorageSync('relationships') || [];
    }
    
    var familyTrees = wx.getStorageSync('familyTrees') || [];
    var familyName = '主家谱';
    for (var i = 0; i < familyTrees.length; i++) {
      if (familyTrees[i].id === currentTreeId) {
        familyName = familyTrees[i].name;
        break;
      }
    }
    
    this.setData({ 
      persons: persons, 
      relationships: relationships,
      totalPersons: persons.length,
      totalRelationships: relationships.length,
      totalGenerations: persons.length > 0 ? 3 : 0,
      familyName: familyName
    });
    
    if (persons.length > 0) {
      this.setCurrentPerson(persons[0].id);
    } else {
      this.setData({
        currentPerson: { name: '待添加', avatar: '', gender: 'male' }
      });
    }
  },

  // 完全重写的关系查找逻辑 - 智能识别配偶
  setCurrentPerson: function (personId) {
    var persons = this.data.persons || [];
    var relationships = this.data.relationships || [];
    
    var person = persons.find(function(p) { return p.id === personId; });
    if (!person) {
      person = { name: '待添加', gender: 'male' };
    }

    var app = getApp();
    app.globalData.currentPersonId = personId;
    wx.setStorageSync('currentPersonId_' + (this.data.currentTreeId || 'default'), personId);

    var spouses = [];
    var elders = [];
    var brothers = [];
    var sisters = [];
    var children = [];
    var addedChildIds = [];
    var hasFather = false;
    var hasMother = false;
    var fatherId = null;
    var motherId = null;

    // 第一遍：查找直接关系
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      
      // 1. 配偶关系
      if (r.type === 'spouse') {
        var spouseId = null;
        if (r.from === personId) spouseId = r.to;
        else if (r.to === personId) spouseId = r.from;
        
        if (spouseId && !spouses.some(function(s){return s.id===spouseId;})) {
          var spouse = persons.find(function(p){return p.id===spouseId;});
          if (spouse) {
            spouses.push({ id: spouse.id, name: spouse.name, avatar: spouse.gender === 'male' ? '👨' : '👩', gender: spouse.gender, status: spouse.status || 'alive', relation: spouse.gender === 'male' ? '丈夫' : '妻子' });
          }
        }
      }
      
      // 2. 父亲关系
      if (r.type === 'father') {
        if (r.from === personId) {
          fatherId = r.to;
          if (fatherId && !elders.some(function(e){return e.id===fatherId;})) {
            hasFather = true;
            var father = persons.find(function(p){return p.id===fatherId;});
            if (father) elders.push({ id: father.id, name: father.name, gender: father.gender, status: father.status || 'alive', relation: '父亲' });
          }
        } else if (r.to === personId) {
          var childId = r.from;
          if (childId && !children.some(function(c){return c.id===childId;})) {
            var child = persons.find(function(p){return p.id===childId;});
            if (child) {
              children.push({ id: child.id, name: child.name, avatar: child.gender === 'male' ? '👨' : '👩', gender: child.gender, status: child.status || 'alive', relation: child.gender === 'male' ? '儿子' : '女儿' });
              addedChildIds.push(childId);
            }
          }
        }
      }
      
      // 3. 母亲关系
      if (r.type === 'mother') {
        if (r.from === personId) {
          motherId = r.to;
          if (motherId && !elders.some(function(e){return e.id===motherId;})) {
            hasMother = true;
            var mother = persons.find(function(p){return p.id===motherId;});
            if (mother) elders.push({ id: mother.id, name: mother.name, gender: mother.gender, status: mother.status || 'alive', relation: '母亲' });
          }
        } else if (r.to === personId) {
          var childId = r.from;
          if (childId && !children.some(function(c){return c.id===childId;})) {
            var child = persons.find(function(p){return p.id===childId;});
            if (child) {
              children.push({ id: child.id, name: child.name, avatar: child.gender === 'male' ? '👨' : '👩', gender: child.gender, status: child.status || 'alive', relation: child.gender === 'male' ? '儿子' : '女儿' });
              addedChildIds.push(childId);
            }
          }
        }
      }
      
      // 4. 兄弟姐妹关系
      if (r.type === 'brother' || r.type === 'sister') {
        var siblingId = null;
        if (r.from === personId) siblingId = r.to;
        else if (r.to === personId) siblingId = r.from;
        
        if (siblingId && siblingId !== personId) {
          var sibling = persons.find(function(p){return p.id===siblingId;});
          if (sibling) {
            var list = r.type === 'brother' ? brothers : sisters;
            if (!list.some(function(s){return s.id===siblingId;})) {
              list.push({ id: sibling.id, name: sibling.name, avatar: sibling.gender === 'male' ? '👨' : '👩', gender: sibling.gender, status: sibling.status || 'alive', relation: r.type === 'brother' ? '兄弟' : '姐妹' });
            }
          }
        }
      }
      
      // 5. 子女关系
      if (r.type === 'son' || r.type === 'daughter') {
        var childId = null;
        if (r.from === personId) childId = r.to;
        else if (r.to === personId) childId = r.from;
        
        if (childId && !children.some(function(c){return c.id===childId;})) {
          var child = persons.find(function(p){return p.id===childId;});
          if (child) {
            children.push({ id: child.id, name: child.name, avatar: child.gender === 'male' ? '👨' : '👩', gender: child.gender, status: child.status || 'alive', relation: r.type === 'son' ? '儿子' : '女儿' });
            addedChildIds.push(childId);
          }
        }
      }
    }
    
    // 第二遍：智能识别配偶
    // 情况 1：如果当前人有父亲和母亲，他们互为配偶
    if (fatherId && motherId) {
      var isSpouse = relationships.some(function(r) {
        return r.type === 'spouse' && ((r.from === fatherId && r.to === motherId) || (r.to === fatherId && r.from === motherId));
      });
      if (!isSpouse && !spouses.some(function(s){return s.id===motherId;})) {
        var mother = persons.find(function(p){return p.id===motherId;});
        if (mother) {
          spouses.push({ id: mother.id, name: mother.name, avatar: mother.gender === 'male' ? '👨' : '👩', gender: mother.gender, status: mother.status || 'alive', relation: mother.gender === 'male' ? '丈夫' : '妻子' });
        }
      }
    }
    
    // 情况 2：通过子女查找配偶
    if (children.length > 0) {
      for (var c = 0; c < children.length; c++) {
        var child = children[c];
        for (var i = 0; i < relationships.length; i++) {
          var r = relationships[i];
          if (r.type === 'father' || r.type === 'mother') {
            var parentId = null;
            if (r.to === child.id) parentId = r.from;
            else if (r.from === child.id) parentId = r.to;
            
            if (parentId && parentId !== personId && !spouses.some(function(s){return s.id===parentId;})) {
              var spouse = persons.find(function(p){return p.id===parentId;});
              if (spouse) {
                spouses.push({ id: spouse.id, name: spouse.name, avatar: spouse.gender === 'male' ? '👨' : '👩', gender: spouse.gender, status: spouse.status || 'alive', relation: spouse.gender === 'male' ? '丈夫' : '妻子' });
              }
            }
          }
        }
      }
    }

    this.setData({
      currentPersonId: personId,
      currentPerson: { name: person.name || '待添加', avatar: person.gender === 'male' ? '👨' : '👩', gender: person.gender || 'male' },
      spouses: spouses,
      elders: elders,
      brothers: brothers,
      sisters: sisters,
      children: children,
      hasFather: hasFather,
      hasMother: hasMother
    });
  },

  calculateGenerations: function (currentId, persons, relationships) {
    var maxGen = 0, minGen = 0;
    var queue = [{id: currentId, gen: 0}];
    var visited = {};
    visited[currentId] = true;
    
    while (queue.length > 0) {
      var item = queue.shift();
      if (visited[item.id]) continue;
      visited[item.id] = true;
      if (item.gen > maxGen) maxGen = item.gen;
      if (item.gen < minGen) minGen = item.gen;
      
      for (var i = 0; i < relationships.length; i++) {
        var r = relationships[i];
        if ((r.type === 'father' || r.type === 'mother')) {
          if (r.to === item.id && !visited[r.from]) queue.push({id: r.from, gen: item.gen - 1});
          if (r.from === item.id && !visited[r.to]) queue.push({id: r.to, gen: item.gen - 1});
        }
        if ((r.type === 'son' || r.type === 'daughter')) {
          if (r.from === item.id && !visited[r.to]) queue.push({id: r.to, gen: item.gen + 1});
          if (r.to === item.id && !visited[r.from]) queue.push({id: r.from, gen: item.gen + 1});
        }
      }
    }
    return maxGen - minGen + 1;
  },

  handleCurrentPersonTap: function () {
    wx.navigateTo({ url: '/subpkg-tools/pages/member/edit?id=' + this.data.currentPersonId });
  },

  editCurrentMember: function () {
    wx.navigateTo({ url: '/subpkg-tools/pages/member/edit?id=' + this.data.currentPersonId });
  },

  showMembers: function () {
    var allMembers = [];
    for (var i = 0; i < this.data.persons.length; i++) {
      allMembers.push({ id: this.data.persons[i].id, name: this.data.persons[i].name });
    }
    this.setData({ showMembersModal: true, allMembers: allMembers });
  },

  hideMembers: function () {
    this.setData({ showMembersModal: false });
  },

  switchToMember: function (e) {
    this.setCurrentPerson(e.currentTarget.dataset.id);
    this.hideMembers();
  },

  addRelative: function (e) {
    var type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: '/subpkg-tools/pages/member/add?type=' + type + '&parentId=' + this.data.currentPersonId });
  },

  viewMember: function (e) {
    wx.navigateTo({ url: '/subpkg-tools/pages/member/member?id=' + e.currentTarget.dataset.id });
  },

  showFamilyTree: function () {
    wx.navigateTo({ url: '/subpkg-family/pages/family-tree/family-tree' });
  },

  showCenterMenu: function () {
    this.setData({ showCenterMenu: true });
  },

  hideCenterMenu: function () {
    this.setData({ showCenterMenu: false });
  },

  showSiblingMenu: function () {
    this.setData({ showSiblingMenu: true });
  },

  hideSiblingMenu: function () {
    this.setData({ showSiblingMenu: false });
  },

  hideEditFamilyName: function () {
    this.setData({ showEditFamilyName: false });
  },

  editFamilyName: function () {
    this.setData({ showEditFamilyName: true });
  },

  onFamilyNameInput: function (e) {
    this.setData({ familyName: e.detail.value });
  },

  saveFamilyName: function () {
    var currentTreeId = wx.getStorageSync('currentTreeId') || '';
    var familyTrees = wx.getStorageSync('familyTrees') || [];
    for (var i = 0; i < familyTrees.length; i++) {
      if (familyTrees[i].id === currentTreeId) {
        familyTrees[i].name = this.data.familyName;
        break;
      }
    }
    wx.setStorageSync('familyTrees', familyTrees);
    this.setData({ showEditFamilyName: false });
    wx.showToast({ title: '保存成功' });
  },

  addBrother: function () {
    this.setData({ showSiblingMenu: false });
    wx.navigateTo({ url: '/subpkg-tools/pages/member/add?type=brother&subtype=哥哥&parentId=' + this.data.currentPersonId });
  },

  addYoungerBrother: function () {
    this.setData({ showSiblingMenu: false });
    wx.navigateTo({ url: '/subpkg-tools/pages/member/add?type=brother&subtype=弟弟&parentId=' + this.data.currentPersonId });
  },

  addSister: function () {
    this.setData({ showSiblingMenu: false });
    wx.navigateTo({ url: '/subpkg-tools/pages/member/add?type=sister&subtype=姐姐&parentId=' + this.data.currentPersonId });
  },

  addYoungerSister: function () {
    this.setData({ showSiblingMenu: false });
    wx.navigateTo({ url: '/subpkg-tools/pages/member/add?type=sister&subtype=妹妹&parentId=' + this.data.currentPersonId });
  },

  showMemberMenu: function (e) {
    var memberId = e.currentTarget.dataset.id;
    var that = this;
    wx.showActionSheet({
      itemList: ['编辑资料', '切换到此成员'],
      success: function (res) {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: '/subpkg-tools/pages/member/edit?id=' + memberId });
        } else if (res.tapIndex === 1) {
          that.setCurrentPerson(memberId);
        }
      }
    });
  },

  shareFamilyTree: function () {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
  }
});

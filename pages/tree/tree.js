// pages/tree/tree.js
Page({
  data: {
    persons: [],
    relationships: [],
    generation1: [], // 高祖父辈
    generation2: [], // 曾祖父辈
    generation3: [], // 祖父辈
    generation4: [], // 父辈
    generation5: [], // 自己辈
    generation6: [], // 子辈
    expandedGens: [true, true, true, true, true, true],
    totalMembers: 0,
    hasData: true,
    
    // 关系查询
    queryMode: false,
    selectedMembers: [],
    showResultModal: false,
    memberA: {},
    memberB: {},
    relationResult: {}
  },

  onLoad: function () {
    this.loadData();
  },

  loadData: function () {
    var persons = wx.getStorageSync('persons') || [];
    var relationships = wx.getStorageSync('relationships') || [];
    var currentId = wx.getStorageSync('currentTreeId');
    
    this.setData({ 
      persons: persons, 
      relationships: relationships,
      totalMembers: persons.length
    });
    this.groupByGeneration(persons, relationships, currentId);
  },

  groupByGeneration: function (persons, relationships, currentId) {
    var generation1 = []; // 高祖父辈
    var generation2 = []; // 曾祖父辈
    var generation3 = []; // 祖父辈
    var generation4 = []; // 父辈
    var generation5 = []; // 自己辈
    var generation6 = []; // 子辈

    // 找到当前成员
    var current = null;
    for (var i = 0; i < persons.length; i++) {
      if (persons[i].id === currentId) {
        current = persons[i];
        break;
      }
    }

    // 如果没有当前成员或当前成员不在列表中，使用第一个成员
    if (!current && persons.length > 0) {
      current = persons[0];
    }

    if (!current) {
      // 没有数据
      this.setData({
        hasData: false,
        generation1: [],
        generation2: [],
        generation3: [],
        generation4: [],
        generation5: [],
        generation6: []
      });
      return;
    }

    // 有数据
    this.setData({ hasData: true });

    // 将自己放入 generation5
    generation5.push({
      id: current.id,
      name: current.name,
      avatar: current.gender === 'male' ? '👨' : '👩',
      gender: current.gender
    });

    // 查找祖先（往上 4 代）
    this.findAncestors(current.id, relationships, persons, generation4, generation3, generation2, generation1);

    // 查找后代（往下 1 代）
    this.findDescendants(current.id, relationships, persons, generation6);

    this.setData({
      generation1: generation1,
      generation2: generation2,
      generation3: generation3,
      generation4: generation4,
      generation5: generation5,
      generation6: generation6
    });
  },

  findAncestors: function (personId, relationships, persons, gen4, gen3, gen2, gen1) {
    // 查找父母（第 4 代）
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if (r.to === personId && (r.type === 'father' || r.type === 'mother')) {
        var parent = null;
        for (var j = 0; j < persons.length; j++) {
          if (persons[j].id === r.from) {
            parent = persons[j];
            break;
          }
        }
        
        if (parent) {
          // 检查是否已存在
          var exists = false;
          for (var k = 0; k < gen4.length; k++) {
            if (gen4[k].id === parent.id) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            gen4.push({
              id: parent.id,
              name: parent.name,
              avatar: parent.gender === 'male' ? '👨' : '👩',
              gender: parent.gender
            });

            // 查找祖父母（第 3 代）
            this.findParents(parent.id, relationships, persons, gen3, gen2, gen1);
          }
        }
      }
    }
  },

  findParents: function (personId, relationships, persons, gen3, gen2, gen1) {
    // 查找父母（第 3 代）
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if (r.to === personId && (r.type === 'father' || r.type === 'mother')) {
        var grandparent = null;
        for (var j = 0; j < persons.length; j++) {
          if (persons[j].id === r.from) {
            grandparent = persons[j];
            break;
          }
        }
        
        if (grandparent) {
          // 检查是否已存在
          var exists = false;
          for (var k = 0; k < gen3.length; k++) {
            if (gen3[k].id === grandparent.id) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            gen3.push({
              id: grandparent.id,
              name: grandparent.name,
              avatar: grandparent.gender === 'male' ? '👨' : '👩',
              gender: grandparent.gender
            });

            // 查找曾祖父母（第 2 代）
            this.findGreatGrandparents(grandparent.id, relationships, persons, gen2, gen1);
          }
        }
      }
    }
  },

  findGreatGrandparents: function (personId, relationships, persons, gen2, gen1) {
    // 查找父母（第 2 代）
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if (r.to === personId && (r.type === 'father' || r.type === 'mother')) {
        var ggp = null;
        for (var j = 0; j < persons.length; j++) {
          if (persons[j].id === r.from) {
            ggp = persons[j];
            break;
          }
        }
        
        if (ggp) {
          // 检查是否已存在
          var exists = false;
          for (var k = 0; k < gen2.length; k++) {
            if (gen2[k].id === ggp.id) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            gen2.push({
              id: ggp.id,
              name: ggp.name,
              avatar: ggp.gender === 'male' ? '👨' : '👩',
              gender: ggp.gender
            });

            // 查找高祖父母（第 1 代）
            this.findGreatGreatGrandparents(ggp.id, relationships, persons, gen1);
          }
        }
      }
    }
  },

  findGreatGreatGrandparents: function (personId, relationships, persons, gen1) {
    // 查找父母（第 1 代）
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if (r.to === personId && (r.type === 'father' || r.type === 'mother')) {
        var gggp = null;
        for (var j = 0; j < persons.length; j++) {
          if (persons[j].id === r.from) {
            gggp = persons[j];
            break;
          }
        }
        
        if (gggp) {
          // 检查是否已存在
          var exists = false;
          for (var k = 0; k < gen1.length; k++) {
            if (gen1[k].id === gggp.id) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            gen1.push({
              id: gggp.id,
              name: gggp.name,
              avatar: gggp.gender === 'male' ? '👨' : '👩',
              gender: gggp.gender
            });
          }
        }
      }
    }
  },

  findDescendants: function (personId, relationships, persons, gen6) {
    // 查找子女
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if (r.from === personId && (r.type === 'son' || r.type === 'daughter')) {
        var child = null;
        for (var j = 0; j < persons.length; j++) {
          if (persons[j].id === r.to) {
            child = persons[j];
            break;
          }
        }
        
        if (child) {
          // 检查是否已存在
          var exists = false;
          for (var k = 0; k < gen6.length; k++) {
            if (gen6[k].id === child.id) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            gen6.push({
              id: child.id,
              name: child.name,
              avatar: child.gender === 'male' ? '👨' : '👩',
              gender: child.gender
            });
          }
        }
      }
    }
  },

  getChildren: function (personId, relationships, persons) {
    var children = [];
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if (r.from === personId && (r.type === 'son' || r.type === 'daughter')) {
        for (var j = 0; j < persons.length; j++) {
          if (persons[j].id === r.to) {
            children.push(persons[j]);
            break;
          }
        }
      }
    }
    return children;
  },

  // 切换代际展开/折叠
  toggleGeneration: function (e) {
    var index = e.currentTarget.dataset.index;
    var expandedGens = this.data.expandedGens;
    expandedGens[index] = !expandedGens[index];
    this.setData({ expandedGens: expandedGens });
  },

  // 展开全部
  expandAll: function () {
    this.setData({ expandedGens: [true, true, true, true, true, true] });
  },

  // 折叠全部
  collapseAll: function () {
    this.setData({ expandedGens: [false, false, false, false, false, false] });
  },

  // 切换查询模式
  toggleQueryMode: function () {
    this.setData({
      queryMode: !this.data.queryMode,
      selectedMembers: [],
      showResultModal: false
    });
  },

  // 判断是否已选中
  isSelected: function (memberId) {
    for (var i = 0; i < this.data.selectedMembers.length; i++) {
      if (this.data.selectedMembers[i].id === memberId) {
        return true;
      }
    }
    return false;
  },

  // 成员点击事件
  onMemberTap: function (e) {
    var that = this;
    
    // 查询模式：选择成员
    if (this.data.queryMode) {
      var memberId = e.currentTarget.dataset.id;
      var person = null;
      for (var i = 0; i < this.data.persons.length; i++) {
        if (this.data.persons[i].id === memberId) {
          person = this.data.persons[i];
          break;
        }
      }
      
      // 如果已选中，取消选中
      if (this.isSelected(memberId)) {
        var newSelectedMembers = [];
        for (var i = 0; i < this.data.selectedMembers.length; i++) {
          if (this.data.selectedMembers[i].id !== memberId) {
            newSelectedMembers.push(this.data.selectedMembers[i]);
          }
        }
        this.setData({ selectedMembers: newSelectedMembers });
        return;
      }

      // 添加选中
      var newSelectedMembers = this.data.selectedMembers.concat({
        id: person.id,
        name: person.name,
        avatar: person.gender === 'male' ? '👨' : '👩'
      });
      this.setData({ selectedMembers: newSelectedMembers });

      // 已选 2 人，自动查询
      if (newSelectedMembers.length === 2) {
        this.queryRelation();
      }
      return;
    }
    
    // 非查询模式：查看详情
    var memberId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/subpkg-tools/pages/member/member?id=' + memberId
    });
  },

  // 查询关系
  queryRelation: function () {
    if (this.data.selectedMembers.length !== 2) {
      wx.showToast({ title: '请选择 2 位成员', icon: 'none' });
      return;
    }

    var memberA = this.data.selectedMembers[0];
    var memberB = this.data.selectedMembers[1];

    var resultAB = this.findRelationship(memberA.id, memberB.id);
    var resultBA = this.findRelationship(memberB.id, memberA.id);

    this.setData({
      memberA: memberA,
      memberB: memberB,
      relationResult: {
        titleAB: resultAB.title || '无直接关系',
        titleBA: resultBA.title || '无直接关系',
        generationDiff: resultAB.generationDiff || 0,
        path: resultAB.path || '无'
      },
      showResultModal: true
    });
  },

  // 查找两人关系
  findRelationship: function (fromId, toId) {
    if (fromId === toId) return { title: '本人', generationDiff: 0, path: '本人' };

    var queue = [[fromId]];
    var visited = {};
    visited[fromId] = true;

    while (queue.length > 0) {
      var path = queue.shift();
      var current = path[path.length - 1];

      if (current === toId) {
        return this.analyzePath(path, fromId, toId);
      }

      for (var i = 0; i < this.data.relationships.length; i++) {
        var r = this.data.relationships[i];
        if (r.from === current && !visited[r.to]) {
          visited[r.to] = true;
          var newPath = path.concat([r.to]);
          queue.push(newPath);
        }
        if (r.to === current && !visited[r.from]) {
          visited[r.from] = true;
          var newPath = path.concat([r.from]);
          queue.push(newPath);
        }
      }
    }

    return { title: '远亲', generationDiff: 0, path: '无' };
  },

  // 分析关系路径
  analyzePath: function (pathIds, fromId, toId) {
    if (pathIds.length < 2) return { title: '无关系', generationDiff: 0, path: '无' };

    var generationDiff = 0;
    var pathDesc = [];

    for (var i = 0; i < pathIds.length - 1; i++) {
      var from = pathIds[i];
      var to = pathIds[i + 1];

      var rel = null;
      for (var j = 0; j < this.data.relationships.length; j++) {
        var r = this.data.relationships[j];
        if ((r.from === from && r.to === to) || (r.to === from && r.from === to)) {
          rel = r;
          break;
        }
      }

      if (rel) {
        var isForward = rel.from === from;
        var type = isForward ? rel.type : this.getReverseType(rel.type);
        pathDesc.push(this.getRelationLabel(type));

        if (type === 'father' || type === 'mother') generationDiff++;
        else if (type === 'son' || type === 'daughter') generationDiff--;
      }
    }

    var title = this.deriveTitle(pathDesc, generationDiff);

    return {
      title: title,
      generationDiff: Math.abs(generationDiff),
      path: pathDesc.join(' → ')
    };
  },

  getReverseType: function (type) {
    var reverse = {
      'father': 'son',
      'mother': 'daughter',
      'son': 'father',
      'daughter': 'mother',
      'brother': 'brother',
      'sister': 'sister',
      'spouse': 'spouse'
    };
    return reverse[type] || type;
  },

  getRelationLabel: function (type) {
    var labels = {
      'father': '父',
      'mother': '母',
      'son': '子',
      'daughter': '女',
      'brother': '兄弟',
      'sister': '姐妹',
      'spouse': '配偶'
    };
    return labels[type] || type;
  },

  deriveTitle: function (pathDesc, genDiff) {
    var pathStr = pathDesc.join('-');

    if (pathStr.indexOf('父') >= 0 && genDiff === 1) return '父亲';
    if (pathStr.indexOf('父') >= 0 && genDiff === 2) return '爷爷/外公';
    if (pathStr.indexOf('父') >= 0 && genDiff === 3) return '太爷爷';
    if (pathStr.indexOf('母') >= 0 && genDiff === 1) return '母亲';
    if (pathStr.indexOf('母') >= 0 && genDiff === 2) return '奶奶/外婆';
    if (pathStr.indexOf('母') >= 0 && genDiff === 3) return '太奶奶';
    if (pathStr.indexOf('子') >= 0 && genDiff === -1) return '儿子';
    if (pathStr.indexOf('子') >= 0 && genDiff === -2) return '孙子/外孙';
    if (pathStr.indexOf('子') >= 0 && genDiff === -3) return '曾孙';
    if (pathStr.indexOf('女') >= 0 && genDiff === -1) return '女儿';
    if (pathStr.indexOf('女') >= 0 && genDiff === -2) return '孙女/外孙女';
    if (pathStr.indexOf('女') >= 0 && genDiff === -3) return '曾孙女';
    if (pathStr.indexOf('兄弟') >= 0) return '兄弟';
    if (pathStr.indexOf('姐妹') >= 0) return '姐妹';
    if (pathStr.indexOf('配偶') >= 0) return '配偶';

    return '亲属';
  },

  // 关闭结果弹窗
  closeResultModal: function () {
    this.setData({
      showResultModal: false,
      queryMode: false,
      selectedMembers: []
    });
  },

  // 分享树形图谱
  shareTree: function () {
    wx.showShareMenu({
      withShareTicket: true,
      showShareItems: ['wechatFriends', 'wechatMoment']
    });
    
    wx.showToast({
      title: '点击右上角分享',
      icon: 'none'
    });
  },

  // 阻止弹窗冒泡
  stopPropagation: function () {},

  // 返回首页
  goHome: function () {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});

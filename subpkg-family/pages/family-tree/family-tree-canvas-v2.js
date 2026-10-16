// pages/family-tree/family-tree.js - Canvas 2D 版本
Page({
  data: {
    hasData: false,
    persons: [],
    relationships: [],
    currentTreeId: '',
    familyName: '',
    rawFamilyName: '',
    currentPerson: null,
    treeNodes: [],
    canvasWidth: 0,
    canvasHeight: 0,
    selectedMember: null,
    crossData: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },

  onLoad: function () {
    console.log('=== family-tree onLoad ===');
    this.loadData();
  },

  onShow: function () {
    console.log('=== family-tree onShow ===');
    this.loadData();
  },

  onReady: function () {
    console.log('=== onReady 获取 Canvas 上下文 ===');
    this.ctx = wx.createCanvasContext('familyTreeCanvas', this);
    console.log('Canvas 上下文:', this.ctx);
  },

  initCanvas: function () {
    console.log('=== initCanvas 开始 ===');
    if (!this.ctx) {
      this.ctx = wx.createCanvasContext('familyTreeCanvas', this);
      console.log('Canvas 上下文:', this.ctx);
    }
    
    if (this.ctx) {
      console.log('✅ Canvas 上下文获取成功');
      if (this.data.hasData && this.data.treeNodes.length > 0) {
        this.drawFamilyTree();
      }
    } else {
      console.error('❌ Canvas 上下文获取失败，重试...');
      setTimeout(() => {
        this.initCanvas();
      }, 500);
    }
  },

  loadData: function () {
    console.log('====== family-tree loadData 开始 ======');
    
    var currentTreeId = wx.getStorageSync('currentTreeId') || '';
    if (!currentTreeId) {
      var familyTrees = wx.getStorageSync('familyTrees') || [];
      if (familyTrees.length > 0) {
        currentTreeId = familyTrees[0].id;
      } else {
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
    var familyName = '家谱';
    for (var i = 0; i < familyTrees.length; i++) {
      if (familyTrees[i].id === currentTreeId) {
        familyName = familyTrees[i].name;
        break;
      }
    }
    
    if (persons.length === 0) {
      console.log('❌ 数据为空');
      this.setData({ hasData: false });
      return;
    }
    
    console.log('✅ 数据加载成功：', persons.length, '人');
    
    // v711-51-fix-v200 修复：视角切换问题 - 优先从 storage 读取 currentPersonId
    var app = getApp();
    var currentPersonId = wx.getStorageSync('currentPersonId_' + currentTreeId);
    
    console.log('[loadData] 读取 currentPersonId:', currentPersonId, 'currentTreeId:', currentTreeId);
    
    // 如果 storage 中没有，尝试从 app.globalData 读取
    if (!currentPersonId) {
      currentPersonId = app.globalData.currentPersonId;
      console.log('[loadData] 从 app.globalData 读取 currentPersonId:', currentPersonId);
    }
    
    // 如果都没有，使用第一个人作为默认
    if (!currentPersonId && persons.length > 0) { 
      currentPersonId = persons[0].id; 
      console.log('[loadData] 使用第一个人作为 currentPersonId:', currentPersonId);
    }
    
    // 同步到 app.globalData 和 storage
    app.globalData.currentPersonId = currentPersonId;
    wx.setStorageSync('currentPersonId_' + currentTreeId, currentPersonId);
    console.log('[loadData] 最终 currentPersonId:', currentPersonId);
    
    var currentPerson = persons.find(function(p) { return p.id === currentPersonId; });
    var generations = this.calculateGenerations(currentPerson.id, persons, relationships);
    var treeNodes = this.buildTreeStructure(persons, relationships, generations);
    
    var canvasWidth = Math.max(750, treeNodes.maxX + 100);
    var canvasHeight = Math.max(1200, treeNodes.maxY + 100);
    
    this.setData({
      hasData: true,
      persons: persons,
      relationships: relationships,
      currentTreeId: currentTreeId,
      familyName: familyName + '家族关系树',
      rawFamilyName: familyName,
      currentPerson: currentPerson,
      treeNodes: treeNodes.nodes,
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight
    });
    
    // 数据设置完成后，初始化 Canvas
    setTimeout(() => {
      this.initCanvas();
    }, 500);
    
    console.log('====== family-tree loadData 完成 ======');
  },

  calculateGenerations: function (currentId, persons, relationships) {
    var generations = {};
    generations[currentId] = 0;
    
    var queue = [{id: currentId, gen: 0}];
    var visited = {};
    visited[currentId] = true;
    
    while (queue.length > 0) {
      var item = queue.shift();
      var personId = item.id;
      var gen = item.gen;
      
      for (var i = 0; i < relationships.length; i++) {
        var r = relationships[i];
        if ((r.type === 'father' || r.type === 'mother')) {
          if (r.to === personId && !visited[r.from]) {
            visited[r.from] = true;
            generations[r.from] = gen - 1;
            queue.push({id: r.from, gen: gen - 1});
          }
          if (r.from === personId && !visited[r.to]) {
            visited[r.to] = true;
            generations[r.to] = gen - 1;
            queue.push({id: r.to, gen: gen - 1});
          }
        }
        if ((r.type === 'son' || r.type === 'daughter')) {
          if (r.from === personId && !visited[r.to]) {
            visited[r.to] = true;
            generations[r.to] = gen + 1;
            queue.push({id: r.to, gen: gen + 1});
          }
          if (r.to === personId && !visited[r.from]) {
            visited[r.from] = true;
            generations[r.from] = gen + 1;
            queue.push({id: r.from, gen: gen + 1});
          }
        }
        if (r.type === 'brother' || r.type === 'sister') {
          var siblingId = (r.from === personId) ? r.to : r.from;
          if (siblingId && !visited[siblingId]) {
            visited[siblingId] = true;
            generations[siblingId] = gen;
            queue.push({id: siblingId, gen: gen});
          }
        }
        if (r.type === 'spouse') {
          var spouseId = (r.from === personId) ? r.to : r.from;
          if (spouseId && !visited[spouseId]) {
            visited[spouseId] = true;
            generations[spouseId] = gen;
          }
        }
      }
    }
    
    return generations;
  },

  buildTreeStructure: function (persons, relationships, generations) {
    var nodes = [];
    var maxX = 0;
    var maxY = 0;
    
    var genGroups = {};
    for (var id in generations) {
      var gen = generations[id];
      if (!genGroups[gen]) genGroups[gen] = [];
      var member = persons.find(function(p) { return p.id === id; });
      if (member) genGroups[gen].push(member);
    }
    
    var nodePositions = {};
    var genIndex = 0;
    var genLevels = Object.keys(genGroups).map(function(g) { return parseInt(g); }).sort(function(a, b) { return a - b; });
    
    for (var i = 0; i < genLevels.length; i++) {
      var gen = genLevels[i];
      var members = genGroups[gen];
      
      for (var j = 0; j < members.length; j++) {
        var member = members[j];
        var x = 100 + j * 150;
        var y = 100 + genIndex * 200;
        
        nodePositions[member.id] = { x: x, y: y, gen: gen };
        
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        
        nodes.push({
          id: member.id,
          name: member.name,
          gender: member.gender,
          generation: gen,
          x: x,
          y: y
        });
      }
      
      genIndex++;
    }
    
    var links = [];
    
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if (r.type === 'father' || r.type === 'mother' || r.type === 'son' || r.type === 'daughter') {
        var fromId = (r.type === 'father' || r.type === 'mother') ? r.from : r.to;
        var toId = (r.type === 'father' || r.type === 'mother') ? r.to : r.from;
        
        if (nodePositions[fromId] && nodePositions[toId]) {
          links.push({
            type: 'parent-child',
            from: fromId,
            to: toId,
            fromPos: nodePositions[fromId],
            toPos: nodePositions[toId]
          });
        }
      }
      
      if (r.type === 'spouse') {
        if (nodePositions[r.from] && nodePositions[r.to]) {
          links.push({
            type: 'spouse',
            from: r.from,
            to: r.to,
            fromPos: nodePositions[r.from],
            toPos: nodePositions[r.to]
          });
        }
      }
      
      if (r.type === 'brother' || r.type === 'sister') {
        if (nodePositions[r.from] && nodePositions[r.to]) {
          links.push({
            type: 'sibling',
            from: r.from,
            to: r.to,
            fromPos: nodePositions[r.from],
            toPos: nodePositions[r.to]
          });
        }
      }
    }
    
    return {
      nodes: nodes,
      links: links,
      maxX: maxX,
      maxY: maxY
    };
  },

  drawFamilyTree: function () {
    console.log('=== drawFamilyTree 开始绘制 ===');
    
    if (!this.ctx) {
      console.error('❌ Canvas 上下文为空，等待...');
      setTimeout(() => {
        this.drawFamilyTree();
      }, 500);
      return;
    }
    
    if (this.data.treeNodes.length === 0) {
      console.error('❌ 没有节点数据！');
      return;
    }
    
    var ctx = this.ctx;
    var treeNodes = this.data.treeNodes;
    
    // 清空画布
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);
    console.log('✅ 画布已清空');
    
    // 绘制连线
    for (var i = 0; i < treeNodes.links.length; i++) {
      var link = treeNodes.links[i];
      this.drawLink(ctx, link);
    }
    console.log('✅ 连线已绘制:', treeNodes.links.length, '条');
    
    // 绘制节点
    for (var i = 0; i < treeNodes.nodes.length; i++) {
      var node = treeNodes.nodes[i];
      this.drawNode(ctx, node);
    }
    console.log('✅ 节点已绘制:', treeNodes.nodes.length, '个');
    
    console.log('✅ Canvas 绘制完成');
  },

  drawLink: function (ctx, link) {
    var fromX = link.fromPos.x + 40;
    var fromY = link.fromPos.y + 40;
    var toX = link.toPos.x + 40;
    var toY = link.toPos.y + 40;
    
    ctx.beginPath();
    ctx.strokeStyle = link.type === 'spouse' ? '#e91e63' : '#4a90d9';
    ctx.lineWidth = 3;
    
    if (link.type === 'parent-child') {
      ctx.moveTo(fromX, fromY + 40);
      ctx.lineTo(toX, toY - 40);
    } else if (link.type === 'spouse') {
      ctx.moveTo(fromX + 40, fromY);
      ctx.lineTo(toX - 40, toY);
    } else if (link.type === 'sibling') {
      ctx.setLineDash([10, 5]);
      ctx.moveTo(fromX + 40, fromY);
      ctx.lineTo(toX - 40, toY);
      ctx.setLineDash([]);
    }
    
    ctx.stroke();
  },

  drawNode: function (ctx, node) {
    var x = node.x;
    var y = node.y;
    var width = 80;
    var height = 80;
    
    ctx.fillStyle = 'white';
    ctx.strokeStyle = node.gender === 'male' ? '#4a90d9' : '#e91e63';
    ctx.lineWidth = 2;
    
    this.roundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    
    ctx.font = '40px Arial';
    ctx.fillStyle = node.gender === 'male' ? '#4a90d9' : '#e91e63';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.gender === 'male' ? '👨' : '👩', x + width/2, y + 35);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(node.name, x + width/2, y + 65);
  },

  roundRect: function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  onMemberTap: function (e) {
    var memberId = e.currentTarget.dataset.id;
    var member = this.data.persons.find(function(p) { return p.id === memberId; });
    if (!member) return;
    
    var crossData = this.calculateCrossData(memberId, this.data.persons, this.data.relationships);
    
    this.setData({
      selectedMember: member,
      crossData: crossData
    });
  },

  calculateCrossData: function (personId, persons, relationships) {
    var cross = {
      father: null,
      mother: null,
      spouse: null,
      siblings: [],
      children: []
    };
    
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if (r.type === 'father') {
        if (r.to === personId) cross.father = persons.find(function(p) { return p.id === r.from; });
        else if (r.from === personId) cross.father = persons.find(function(p) { return p.id === r.to; });
      }
      if (r.type === 'mother') {
        if (r.to === personId) cross.mother = persons.find(function(p) { return p.id === r.from; });
        else if (r.from === personId) cross.mother = persons.find(function(p) { return p.id === r.to; });
      }
      if (r.type === 'spouse') {
        var spouseId = (r.from === personId) ? r.to : r.from;
        if (spouseId && !cross.spouse) cross.spouse = persons.find(function(p) { return p.id === spouseId; });
      }
      if (r.type === 'brother' || r.type === 'sister') {
        var siblingId = (r.from === personId) ? r.to : r.from;
        if (siblingId && siblingId !== personId) {
          var sibling = persons.find(function(p) { return p.id === siblingId; });
          if (sibling && !cross.siblings.some(function(s){return s.id===siblingId;})) cross.siblings.push(sibling);
        }
      }
      if (r.type === 'son' || r.type === 'daughter') {
        var childId = (r.from === personId) ? r.to : r.from;
        if (childId && !cross.children.some(function(c){return c.id===childId;})) {
          var child = persons.find(function(p) { return p.id === childId; });
          if (child) cross.children.push(child);
        }
      }
    }
    
    return cross;
  },

  closeCross: function () {
    this.setData({ selectedMember: null, crossData: null });
  },

  switchToMember: function (e) {
    var memberId = e.currentTarget.dataset.id;
    var persons = this.data.persons;
    var newCurrentPerson = persons.find(function(p) { return p.id === memberId; });
    if (newCurrentPerson) {
      var index = persons.indexOf(newCurrentPerson);
      if (index > 0) {
        persons.splice(index, 1);
        persons.unshift(newCurrentPerson);
      }
      this.setData({ persons: persons, currentPerson: newCurrentPerson });
      this.loadData();
    }
    this.closeCross();
  },

  goHome: function () {
    wx.redirectTo({ url: '/pages/index/index' });
  },

  resetView: function () {
    this.setData({ scale: 1, offsetX: 0, offsetY: 0 });
  }
});

// pages/family-tree/family-tree.js - 完整家族关系树版本
Page({
  data: {
    hasData: false,
    persons: [],
    relationships: [],
    currentTreeId: '',
    familyName: '',
    rawFamilyName: '',
    currentPerson: null,
    // 家谱树节点数据
    treeNodes: [],
    // Canvas 尺寸
    canvasWidth: 0,
    canvasHeight: 0,
    // 当前选中的成员
    selectedMember: null,
    // 十字架关系数据
    crossData: null,
    // 视图控制
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },

  onLoad: function (options) {
    console.log('=== family-tree onLoad ===');
    this.loadData();
  },

  onShow: function () {
    console.log('=== family-tree onShow ===');
    this.loadData();
  },

  onReady: function () {
    console.log('=== onReady 获取 Canvas 上下文 ===');
    // 使用 querySelector 获取 Canvas 节点
    const query = wx.createSelectorQuery().in(this);
    query.select('#familyTreeCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        console.log('Canvas 节点查询结果:', res);
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          this.canvas = canvas;
          this.ctx = ctx;
          console.log('✅ Canvas 2D 上下文获取成功:', ctx);
          
          // 如果有数据，立即绘制
          if (this.data.hasData && this.data.treeNodes.length > 0) {
            this.drawFamilyTree();
          }
        } else {
          console.error('❌ Canvas 节点查询失败');
        }
      });
  },

  // 数据读取
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
    
    var currentPerson = persons[0];
    
    // 计算辈分
    var generations = this.calculateGenerations(currentPerson.id, persons, relationships);
    
    // 构建树形结构
    var treeNodes = this.buildTreeStructure(persons, relationships, generations);
    
    // 计算 Canvas 尺寸
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
    
    // 延迟绘制，确保 DOM 已渲染
    setTimeout(() => {
      this.drawFamilyTree();
    }, 300);
    
    console.log('====== family-tree loadData 完成 ======');
  },

  // BFS 计算辈分
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
      
      // 查找父母（gen - 1）
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
        // 查找子女（gen + 1）
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
      }
      
      // 查找兄弟姐妹（gen 不变）
      for (var i = 0; i < relationships.length; i++) {
        var r = relationships[i];
        if (r.type === 'brother' || r.type === 'sister') {
          var siblingId = (r.from === personId) ? r.to : r.from;
          if (siblingId && !visited[siblingId]) {
            visited[siblingId] = true;
            generations[siblingId] = gen;
            queue.push({id: siblingId, gen: gen});
          }
        }
      }
      
      // 查找配偶（gen 不变，不加入队列）
      for (var i = 0; i < relationships.length; i++) {
        var r = relationships[i];
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

  // 构建树形结构（计算每个节点的位置）
  buildTreeStructure: function (persons, relationships, generations) {
    var nodes = [];
    var maxX = 0;
    var maxY = 0;
    
    // 按辈分分组
    var genGroups = {};
    for (var id in generations) {
      var gen = generations[id];
      if (!genGroups[gen]) genGroups[gen] = [];
      var member = persons.find(function(p) { return p.id === id; });
      if (member) genGroups[gen].push(member);
    }
    
    // 为每个辈分计算位置
    var nodePositions = {};
    var genIndex = 0;
    
    // 获取所有辈分层级并排序
    var genLevels = Object.keys(genGroups).map(function(g) { return parseInt(g); }).sort(function(a, b) { return a - b; });
    
    for (var i = 0; i < genLevels.length; i++) {
      var gen = genLevels[i];
      var members = genGroups[gen];
      
      // 同辈成员水平排列
      for (var j = 0; j < members.length; j++) {
        var member = members[j];
        var x = 100 + j * 150;  // 水平间距 150
        var y = 100 + genIndex * 200;  // 垂直间距 200
        
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
    
    // 构建连线数据
    var links = [];
    
    // 亲子关系连线
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
      
      // 夫妻关系连线
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
      
      // 兄弟姐妹连线
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

  // 绘制家族树
  drawFamilyTree: function () {
    console.log('=== drawFamilyTree 开始绘制 ===');
    console.log('Canvas 上下文:', this.ctx);
    
    if (!this.ctx) {
      console.error('❌ Canvas 上下文为空，等待重试...');
      // 等待 500ms 后重试
      setTimeout(() => {
        this.drawFamilyTree();
      }, 500);
      return;
    }
    
    console.log('节点数量:', this.data.treeNodes.length);
    console.log('Canvas 尺寸:', this.data.canvasWidth, 'x', this.data.canvasHeight);
    
    if (this.data.treeNodes.length === 0) {
      console.error('❌ 没有节点数据！');
      return;
    }
    
    var ctx = this.ctx;
    var treeNodes = this.data.treeNodes;
    
    // 清空画布
    ctx.setFillStyle('#f0f4f8');
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
    
    ctx.draw();
    console.log('✅ Canvas 绘制完成');
  },

  // 绘制连线
  drawLink: function (ctx, link) {
    var fromX = link.fromPos.x + 40;  // 节点宽度的一半
    var fromY = link.fromPos.y + 40;  // 节点高度的一半
    var toX = link.toPos.x + 40;
    var toY = link.toPos.y + 40;
    
    ctx.beginPath();
    ctx.setStrokeStyle(link.type === 'spouse' ? '#e91e63' : '#4a90d9');
    ctx.setLineWidth(3);
    
    if (link.type === 'parent-child') {
      // 垂直连线
      ctx.moveTo(fromX, fromY + 40);
      ctx.lineTo(toX, toY - 40);
    } else if (link.type === 'spouse') {
      // 水平连线（夫妻）
      ctx.moveTo(fromX + 40, fromY);
      ctx.lineTo(toX - 40, toY);
    } else if (link.type === 'sibling') {
      // 水平连线（兄弟姐妹）
      ctx.setLineDash([10, 5]);
      ctx.moveTo(fromX + 40, fromY);
      ctx.lineTo(toX - 40, toY);
      ctx.setLineDash([]);
    }
    
    ctx.stroke();
  },

  // 绘制节点
  drawNode: function (ctx, node) {
    var x = node.x;
    var y = node.y;
    var width = 80;
    var height = 80;
    
    // 绘制节点背景
    ctx.setFillStyle('white');
    ctx.setStrokeStyle(node.gender === 'male' ? '#4a90d9' : '#e91e63');
    ctx.setLineWidth(2);
    
    // 圆角矩形
    this.roundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    
    // 绘制头像
    ctx.setFontSize(40);
    ctx.setFillStyle(node.gender === 'male' ? '#4a90d9' : '#e91e63');
    ctx.setTextAlign('center');
    ctx.fillText(node.gender === 'male' ? '👨' : '👩', x + width/2, y + 45);
    
    // 绘制姓名
    ctx.setFontSize(14);
    ctx.setFillStyle('#333');
    ctx.fillText(node.name, x + width/2, y + 68);
  },

  // 绘制圆角矩形
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

  // 点击成员显示十字架弹窗
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

  // 计算十字架关系数据
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

  // 重置视图
  resetView: function () {
    this.setData({ scale: 1, offsetX: 0, offsetY: 0 });
  }
});

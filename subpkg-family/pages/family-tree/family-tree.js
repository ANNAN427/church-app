// pages/family-tree/family-tree.js - v49.0 正确的向下递归
// 核心思路：
// 1. 先计算父母中间位置
// 2. 查找自己有几个子女
// 3. 然后根据子女数量计算每个子女的位置

Page({
  data: {
    hasData: false, persons: [], relationships: [], currentPersonId: '',
    currentPersonName: '', treeNodes: { nodes: [], links: [] },
    canvasWidth: 8000, canvasHeight: 4000
  },
  onLoad: function() { this.loadData(); },
  onShow: function() { 
    // 页面显示时刷新数据（从 member/add 页面返回时）
    console.log('[family-tree onShow] 刷新数据');
    this.loadData(); 
  },
  onReady: function() { 
    var that = this;
    setTimeout(function() {
      that.ctx = wx.createCanvasContext('familyTreeCanvas', that);
      console.log('Canvas 初始化完成');
    }, 300);
  },

  loadData: function() {
    console.log('=== 开始加载数据 ===');
    var currentTreeId = wx.getStorageSync('currentTreeId') || 'tree_default';
    var persons = wx.getStorageSync('persons_' + currentTreeId) || wx.getStorageSync('persons') || [];
    var relationships = wx.getStorageSync('relationships_' + currentTreeId) || wx.getStorageSync('relationships') || [];
    
    console.log('人数:', persons.length, '关系数:', relationships.length);
    
    // v711-43-fix: 通用逻辑 - 检查根节点夫妻是否有配偶关系，没有则添加
    // 遍历所有无父母的人（根节点候选者），如果他们有配偶但没有配偶关系，则添加
    for (var i = 0; i < persons.length; i++) {
      var p = persons[i];
      // 检查是否无父母（根节点）
      var hasParent = false;
      for (var j = 0; j < relationships.length; j++) {
        if ((relationships[j].type === 'father' || relationships[j].type === 'mother') && 
            relationships[j].from === p.id) {
          hasParent = true;
          break;
        }
      }
      if (!hasParent) {
        // 检查是否有配偶关系
        var hasSpouseRel = false;
        var spouseId = null;
        for (var j = 0; j < relationships.length; j++) {
          if (relationships[j].type === 'spouse' && 
              ((relationships[j].from === p.id && relationships[j].to !== p.id) ||
               (relationships[j].to === p.id && relationships[j].from !== p.id))) {
            hasSpouseRel = true;
            spouseId = relationships[j].from === p.id ? relationships[j].to : relationships[j].from;
            break;
          }
        }
        // 如果有配偶但没有配偶关系，则添加
        if (!hasSpouseRel) {
          for (var j = 0; j < relationships.length; j++) {
            if ((relationships[j].type === 'husband' || relationships[j].type === 'wife' || 
                 relationships[j].type === '夫妻' || relationships[j].type === '妻子' || 
                 relationships[j].type === '丈夫') &&
                ((relationships[j].from === p.id || relationships[j].to === p.id))) {
              spouseId = relationships[j].from === p.id ? relationships[j].to : relationships[j].from;
              relationships.push({ type: 'spouse', from: p.id, to: spouseId });
              console.log('➕ 添加根节点配偶关系:', p.name, '↔', spouseId);
              break;
            }
          }
        }
      }
    }
    
    // v711-51-fix-v20: 第二步 - 子女辅助推断配偶（通用逻辑）
    // 场景：孟秀荣没有显性配偶关系，但她是安南的母亲，可以通过子女推断配偶
    // 策略：遍历所有人，如果某人有子女但没有配偶关系，则通过子女推断配偶
    var inferredSpouses = {};
    for (var i = 0; i < persons.length; i++) {
      var p = persons[i];
      // 检查是否已有配偶关系
      var hasSpouseRel = false;
      for (var j = 0; j < relationships.length; j++) {
        if ((relationships[j].type === 'spouse' || relationships[j].type === '夫妻' || 
             relationships[j].type === 'husband' || relationships[j].type === 'wife' ||
             relationships[j].type === '丈夫' || relationships[j].type === '妻子') &&
            (relationships[j].from === p.id || relationships[j].to === p.id)) {
          hasSpouseRel = true;
          break;
        }
      }
      if (!hasSpouseRel) {
        // 通过子女推断配偶：查找所有子女，看子女的另一方父母是谁
        var childrenIds = [];
        for (var j = 0; j < relationships.length; j++) {
          if ((relationships[j].type === 'son' || relationships[j].type === 'daughter' || 
               relationships[j].type === 'parent-child') && relationships[j].from === p.id) {
            childrenIds.push(relationships[j].to);
          }
          if ((relationships[j].type === 'father' || relationships[j].type === 'mother') && 
              relationships[j].to === p.id) {
            childrenIds.push(relationships[j].from);
          }
        }
        // 如果有子女，查找子女的另一方父母
        if (childrenIds.length > 0) {
          var potentialSpouse = null;
          for (var c = 0; c < childrenIds.length; c++) {
            var childId = childrenIds[c];
            for (var j = 0; j < relationships.length; j++) {
              // 查找孩子的另一方父母
              if ((relationships[j].type === 'son' || relationships[j].type === 'daughter' || 
                   relationships[j].type === 'parent-child') && 
                  relationships[j].to === childId && relationships[j].from !== p.id) {
                potentialSpouse = relationships[j].from;
                break;
              }
              if ((relationships[j].type === 'father' || relationships[j].type === 'mother') && 
                  relationships[j].from === childId && relationships[j].to !== p.id) {
                potentialSpouse = relationships[j].to;
                break;
              }
            }
            if (potentialSpouse) break;
          }
          if (potentialSpouse && !inferredSpouses[p.id]) {
            // 修复 v166: 验证配偶是否存在于 persons 数组中
            var spouseExists = false;
            for (var k = 0; k < persons.length; k++) {
              if (persons[k].id === potentialSpouse) {
                spouseExists = true;
                break;
              }
            }
            if (spouseExists) {
              inferredSpouses[p.id] = potentialSpouse;
              console.log('🔍 子女推断配偶:', p.name, '→', potentialSpouse);
            } else {
              console.log('⚠️ 跳过无效配偶:', p.name, '→', potentialSpouse, '(该成员不存在)');
            }
          }
        }
      }
    }
    // 将推断的配偶关系添加到 relationships（不覆盖显性关系）
    for (var pid in inferredSpouses) {
      var spouseId = inferredSpouses[pid];
      // 检查是否已存在
      var exists = false;
      for (var j = 0; j < relationships.length; j++) {
        if ((relationships[j].type === 'spouse' || relationships[j].type === '夫妻') &&
            ((relationships[j].from === pid && relationships[j].to === spouseId) ||
             (relationships[j].from === spouseId && relationships[j].to === pid))) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        relationships.push({ type: 'spouse', from: pid, to: spouseId });
        console.log('➕ 添加推断配偶关系:', pid, '↔', spouseId);
      }
    }
    
    // v711-51-fix-v200 修复：视角切换问题 - 优先从 storage 读取 currentPersonId，确保切换身份后返回时保持当前人
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
    this.setData({ 
      persons: persons, relationships: relationships, currentPersonId: currentPersonId,
      currentPersonName: currentPerson ? currentPerson.name : '', hasData: true 
    });
    
    if (persons.length > 0 && currentPerson) {
      this.buildFamilyTree(currentPersonId, persons, relationships);
    }
  },

  getSpouseId: function(pid, rels, persons) {
    var spouseId = null;
    // 第一步：从 relationships 查找配偶
    for (var i = 0; i < rels.length; i++) {
      var type = rels[i].type;
      if ((type === 'spouse' || type === '夫妻' || type === '妻子' || type === '丈夫' || type === 'husband' || type === 'wife') && 
          (rels[i].from === pid || rels[i].to === pid)) {
        spouseId = rels[i].from === pid ? rels[i].to : rels[i].from;
        break;
      }
    }
    // 第二步：如果找到的配偶 ID 无效（不存在或姓名为"未知"），反向查找
    if (spouseId) {
      var spousePerson = null;
      for (var i = 0; i < persons.length; i++) {
        if (persons[i].id === spouseId) {
          spousePerson = persons[i];
          break;
        }
      }
      if (!spousePerson || !spousePerson.name || spousePerson.name === '未知') {
        // 反向查找策略 1：检查 relationships 数组中的配偶关系（两个方向）
        for (var i = 0; i < rels.length; i++) {
          var type = rels[i].type;
          if ((type === 'spouse' || type === '夫妻' || type === '妻子' || type === '丈夫' || type === 'husband' || type === 'wife') && 
              rels[i].from !== spouseId && rels[i].to !== spouseId) {
            // 检查正向：from=配偶，to=当前人
            if (rels[i].to === pid) {
              var reverseSpouse = null;
              for (var j = 0; j < persons.length; j++) {
                if (persons[j].id === rels[i].from) {
                  reverseSpouse = persons[j];
                  break;
                }
              }
              if (reverseSpouse && reverseSpouse.name && reverseSpouse.name !== '未知') {
                return rels[i].from;
              }
            }
            // 检查反向：from=当前人，to=配偶
            if (rels[i].from === pid) {
              var reverseSpouse = null;
              for (var j = 0; j < persons.length; j++) {
                if (persons[j].id === rels[i].to) {
                  reverseSpouse = persons[j];
                  break;
                }
              }
              if (reverseSpouse && reverseSpouse.name && reverseSpouse.name !== '未知') {
                return rels[i].to;
              }
            }
          }
        }
        
        // 反向查找策略 2：检查谁的 spouseId 字段指向当前人
        for (var i = 0; i < persons.length; i++) {
          if (persons[i].id !== pid && persons[i].spouseId === pid && 
              persons[i].name && persons[i].name !== '未知') {
            return persons[i].id;
          }
        }
      }
    }
    return spouseId;
  },

  hasSiblings: function(pid, rels) {
    for (var i = 0; i < rels.length; i++) {
      if ((rels[i].type === 'brother' || rels[i].type === 'sister') && 
          (rels[i].from === pid || rels[i].to === pid)) {
        return true;
      }
    }
    return false;
  },

  findConnectionCouple: function(members, rels, persons) {
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      if (!m || !m.member) continue;
      
      var spouseId = this.getSpouseId(m.member.id, rels, persons);
      if (!spouseId) continue;
      
      var memberHasSiblings = this.hasSiblings(m.member.id, rels);
      var spouseHasSiblings = this.hasSiblings(spouseId, rels);
      
      if (memberHasSiblings && spouseHasSiblings) {
        return {
          husband: m.member.gender === 'male' ? m.member : m.spouse,
          wife: m.member.gender === 'male' ? m.spouse : m.member,
          spouseId: spouseId
        };
      }
    }
    return null;
  },

  // v49.0 修复：严格只使用 father/mother 关系
  getParents: function(pid, rels, persons) {
    var ps = { father: null, mother: null };
    var _p = persons.find(function(p) { return p.id === pid; }); var personName = _p ? _p.name : '未知';
    console.log('[getParents] 查找：', pid, '姓名：', personName);
    
    for (var i = 0; i < rels.length; i++) {
      var r = rels[i];
      
      // father/mother: from=子女，to=父母 → pid 是子女，找 to
      if (r.type === 'father' && r.from === pid) {
        ps.father = persons.find(function(p) { return p.id === r.to; });
        console.log('[getParents] 找到父亲：', ps.father.id, ps.father.name, '关系：', r.type);
      }
      if (r.type === 'mother' && r.from === pid) {
        ps.mother = persons.find(function(p) { return p.id === r.to; });
        console.log('[getParents] 找到母亲：', ps.mother.id, ps.mother.name, '关系：', r.type);
      }
      
      // son/daughter/parent-child: from=父母，to=子女 → pid 是子女，找 from
      if ((r.type === 'son' || r.type === 'daughter' || r.type === 'parent-child') && r.to === pid) {
        var parent = persons.find(function(p) { return p.id === r.from; });
        if (parent) {
          // 根据 parent 性别决定是父亲还是母亲
          if (parent.gender === 'male' || parent.gender === '男') {
            ps.father = parent;
            console.log('[getParents] 找到父亲（从子女推断）：', ps.father.id, ps.father.name);
          } else {
            ps.mother = parent;
            console.log('[getParents] 找到母亲（从子女推断）：', ps.mother.id, ps.mother.name);
          }
        }
      }
    }
    
    console.log('[getParents] 结果：父=', ps.father ? (ps.father.name + '(' + ps.father.id + ')') : 'null', '母=', ps.mother ? (ps.mother.name + '(' + ps.mother.id + ')') : 'null');
    return ps;
  },

  // 获取某人的父亲ID（辅助函数）
  getFatherId: function(pid, rels, persons) {
    var ps = this.getParents(pid, rels, persons);
    return ps.father ? ps.father.id : null;
  },

  findFamilyRoot: function(pid, rels, persons) {
    var root = pid, found = true;
    var _p2 = persons.find(function(p) { return p.id === pid; }); console.log('[findFamilyRoot] 开始追溯：', pid, '姓名：', _p2 ? _p2.name : '');
    while (found) {
      found = false;
      var ps = this.getParents(root, rels, persons);
      console.log('[findFamilyRoot] 当前节点：', root, '父母：', ps.father ? (ps.father.name + '(' + ps.father.id + ')') : 'null', '/', ps.mother ? (ps.mother.name + '(' + ps.mother.id + ')') : 'null');
      if (ps.father) { root = ps.father.id; found = true; }
      else if (ps.mother) { root = ps.mother.id; found = true; }
      // v130 修复：当找不到父母时，尝试通过配偶的父母继续追溯
      else {
        var spouseId = this.getSpouseId(root, rels, persons);
        if (spouseId) {
          var spousePs = this.getParents(spouseId, rels, persons);
          console.log('[findFamilyRoot] 当前节点无父母，尝试通过配偶追溯：', spouseId, '配偶父母：', spousePs.father ? (spousePs.father.name + '(' + spousePs.father.id + ')') : 'null', '/', spousePs.mother ? (spousePs.mother.name + '(' + spousePs.mother.id + ')') : 'null');
          if (spousePs.father) { root = spousePs.father.id; found = true; }
          else if (spousePs.mother) { root = spousePs.mother.id; found = true; }
        }
      }
    }
    var _p3 = persons.find(function(p) { return p.id === root; }); console.log('[findFamilyRoot] 根节点：', root, '姓名：', _p3 ? _p3.name : '');
    return root;
  },

  // v711-07 修复：恢复正确的关系方向（与 v710-27 一致）
  getChildren: function(pid, rels, persons) {
    var children = [], seen = {};
    
    // 1. 收集直接子女
    for (var i = 0; i < rels.length; i++) {
      var r = rels[i];
      var cid = null;
      
      // son/daughter/parent-child: from=父母，to=子女 → pid 是父母，找 to
      if ((r.type === 'son' || r.type === 'daughter' || r.type === 'parent-child') && r.from === pid) {
        cid = r.to;
      }
      // father/mother: from=子女，to=父母 → pid 是父母，找 from
      if ((r.type === 'father' || r.type === 'mother') && r.to === pid) {
        cid = r.from;
      }
      
      if (cid && !seen[cid]) {
        seen[cid] = true;
        var c = persons.find(function(p) { return p.id === cid; });
        if (c) { 
          var sid = this.getSpouseId(cid, rels, persons); 
          children.push({ member: c, spouse: sid ? persons.find(function(p) { return p.id === sid; }) : null }); 
        }
      }
    }
    
    // v711-51-fix-v5: 调试日志 - 检查付芊雨的子女
    var p = persons.find(function(x) { return x.id === pid; });
    if (p && p.name === '付芊雨') {
      console.log('[DEBUG getChildren] 付芊雨 的直接子女:', children.map(function(c) { return c.member.name; }));
      console.log('[DEBUG getChildren] 付芊雨 的配偶 ID:', this.getSpouseId(pid, rels, persons));
    }
    
    // 2. v711-51-fix-v3: 通过配偶推断子女（通用逻辑，解决数据缺失问题）
    // 场景：付芊雨→安南的亲子关系缺失，但安文杰→安南的亲子关系存在，且有配偶关系
    var spouseId = this.getSpouseId(pid, rels, persons);
    if (spouseId) {
      for (var i = 0; i < rels.length; i++) {
        var r = rels[i];
        var cid = null;
        
        // 从配偶的亲子关系中推断子女
        if ((r.type === 'son' || r.type === 'daughter' || r.type === 'parent-child') && r.from === spouseId) {
          cid = r.to;
        }
        if ((r.type === 'father' || r.type === 'mother') && r.to === spouseId) {
          cid = r.from;
        }
        
        if (cid && !seen[cid]) {
          seen[cid] = true;
          var c = persons.find(function(p) { return p.id === cid; });
          if (c) {
            var cSpouseId = this.getSpouseId(cid, rels, persons);
            children.push({ member: c, spouse: cSpouseId ? persons.find(function(p) { return p.id === cSpouseId; }) : null });
          }
        }
      }
    }
    
    // v711-51-fix-v5: 调试日志 - 检查付芊雨的最终子女列表
    if (p && p.name === '付芊雨') {
      console.log('[DEBUG getChildren] 付芊雨 的最终子女（含配偶推断）:', children.map(function(c) { return c.member.name; }));
    }
    
    return children;
  },

  getSiblings: function(pid, rels, persons) {
    var sibs = [], seen = {}, pids = [];
    // 1. 收集 pid 的所有父母 ID（father/mother 关系：from=子女 to=父母）
    for (var i = 0; i < rels.length; i++) {
      if ((rels[i].type === 'father' || rels[i].type === 'mother') && rels[i].from === pid && pids.indexOf(rels[i].to) === -1) 
        pids.push(rels[i].to);
    }
    // v711-51-fix-v5: 调试日志 - 检查付芊雨的兄弟姐妹
    var p = persons.find(function(x) { return x.id === pid; });
    if (p && (p.name === '付群芳' || p.name === '付芊雨' || p.name === '付群英' || p.name === '付忠聪' || p.name === '安淑英' || p.name === '安文杰' || p.name === '安淑花' || p.name === '白川' || p.name === '安文东')) {
      console.log('[DEBUG getSiblings] ' + p.name + ' 的父母 IDs:', pids);
    }
    // 2. 查找与 pid 有相同父母的人（即兄弟姐妹）
    // v711-51-fix-v164: 如果当前人没有父母，跳过通过 father/mother 关系找兄弟姐妹（避免占用位置导致的错误识别）
    if (pids.length === 0) {
      // 没有父母的人不可能有同父母的亲兄弟姐妹，但仍需检查显式的 brother/sister 关系
    } else {
    for (var i = 0; i < rels.length; i++) {
      var sid = null;
      var sibRelType = null; // v711-51-fix-v33: 记录关系类型
      // 1. 通过 father/mother 关系找兄弟姐妹（从子女找共同父母）
      if ((rels[i].type === 'father' || rels[i].type === 'mother') && pids.indexOf(rels[i].to) !== -1 && rels[i].from !== pid) {
        // v711-51-fix-v94: 检查 sid 的父母是否也在 pids 中（确保是同一代人）
        var sidParents = [];
        for (var j = 0; j < rels.length; j++) {
          if ((rels[j].type === 'father' || rels[j].type === 'mother') && rels[j].from === rels[i].from) {
            sidParents.push(rels[j].to);
          }
        }
        // 只有当 sid 的父母至少有一个在 pids 中时，才是兄弟姐妹
        var hasCommonParent = false;
        for (var j = 0; j < sidParents.length; j++) {
          if (pids.indexOf(sidParents[j]) !== -1) {
            hasCommonParent = true;
            break;
          }
        }
        if (!hasCommonParent) continue; // 跳过，不是兄弟姐妹
        
        // v711-51-fix-v95: 额外检查 - 确保 sid 不是 pid 的长辈（父母/祖父母等）
        // 方法：检查 pid 是否有到 sid 的 father/mother 关系链
        var isAncestor = false;
        var checkId = pid;
        var visited = {};
        while (checkId) {
          if (visited[checkId]) break; // 防止循环
          visited[checkId] = true;
          if (checkId === rels[i].from) {
            isAncestor = true;
            break;
          }
          // 向上查找父母
          var foundParent = null;
          for (var j = 0; j < rels.length; j++) {
            if ((rels[j].type === 'father' || rels[j].type === 'mother') && rels[j].from === checkId) {
              foundParent = rels[j].to;
              break;
            }
          }
          checkId = foundParent;
        }
        if (isAncestor) continue; // sid 是 pid 的长辈，跳过
        
        sid = rels[i].from;
        // v711-51-fix-v33: 通过父子/母子关系找到的兄弟姐妹，需要查找 brother/sister 关系获取 subtype
        for (var j = 0; j < rels.length; j++) {
          if ((rels[j].type === 'brother' || rels[j].type === 'sister') && 
              ((rels[j].from === pid && rels[j].to === sid) || 
               (rels[j].to === pid && rels[j].from === sid))) {
            var subtype = rels[j].subtype;
            var isFromPid = rels[j].from === pid; // 关系是否从当前人出发
            // v711-51-fix-v35: 如果关系是反向的（从对方出发），需要根据当前人性别修正 subtype
            if (!isFromPid && subtype) {
              // 反向关系：subtype 是对方视角的，需要转换
              // 哥哥→弟弟，弟弟→哥哥，姐姐→妹妹，妹妹→姐姐
              if (subtype === '哥哥') subtype = '弟弟';
              else if (subtype === '弟弟') subtype = '哥哥';
              else if (subtype === '姐姐') subtype = '妹妹';
              else if (subtype === '妹妹') subtype = '姐姐';
            }
            // v711-51-fix-v35: 根据兄弟姐妹的性别确定关系类型（brother/sister），根据 subtype 确定长幼（ob/lb/os/ls）
            var sibPerson = persons.find(function(x) { return x.id === sid; });
            if (sibPerson && sibPerson.gender === 'male') {
              // 男性兄弟姐妹：brother + ob/lb
              if (subtype === '哥哥') sibRelType = 'ob';
              else if (subtype === '弟弟') sibRelType = 'lb';
              // v711-51-fix-v39: 如果 subtype 是"姐姐/妹妹"但性别是男性，说明数据不一致，根据转换后的 subtype 推断
              else if (subtype === '姐姐') sibRelType = 'ob'; // 姐姐→哥哥
              else if (subtype === '妹妹') sibRelType = 'lb'; // 妹妹→弟弟
              else sibRelType = 'ob'; // 默认哥哥
            } else if (sibPerson && sibPerson.gender === 'female') {
              // 女性兄弟姐妹：sister + os/ls
              if (subtype === '姐姐') sibRelType = 'os';
              else if (subtype === '妹妹') sibRelType = 'ls';
              // v711-51-fix-v39: 如果 subtype 是"哥哥/弟弟"但性别是女性，说明数据不一致，根据转换后的 subtype 推断
              else if (subtype === '哥哥') sibRelType = 'os'; // 哥哥→姐姐
              else if (subtype === '弟弟') sibRelType = 'ls'; // 弟弟→妹妹
              else sibRelType = 'os'; // 默认姐姐
            } else {
              // 降级处理：根据 subtype 推断
              if (subtype === '哥哥' || subtype === '弟弟') sibRelType = subtype === '哥哥' ? 'ob' : 'lb';
              else if (subtype === '姐姐' || subtype === '妹妹') sibRelType = subtype === '姐姐' ? 'os' : 'ls';
              else sibRelType = 'ob';
            }
            break;
          }
        }
        // v711-51-fix-v37: 如果找不到 brother/sister 关系，根据兄弟姐妹的性别和年龄推断默认关系类型
        if (sibRelType === null) {
          var sibPerson = persons.find(function(x) { return x.id === sid; });
          // v711-51-fix-v39: 从当前人查找与 sibPerson 的 brother/sister 关系获取 subtype
          var explicitSubtype = null;
          for (var j = 0; j < rels.length; j++) {
            if ((rels[j].type === 'brother' || rels[j].type === 'sister') && 
                rels[j].from === pid && rels[j].to === sid) {
              explicitSubtype = rels[j].subtype;
              break;
            }
          }
          // 如果有显式 subtype，根据性别确定关系类型
          if (explicitSubtype) {
            if (sibPerson && sibPerson.gender === 'male') {
              sibRelType = explicitSubtype === '哥哥' ? 'ob' : 'lb';
            } else if (sibPerson && sibPerson.gender === 'female') {
              sibRelType = explicitSubtype === '姐姐' ? 'os' : 'ls';
            }
          } else if (sibPerson && sibPerson.gender === 'male') {
            sibRelType = 'ob'; // 默认哥哥
          } else if (sibPerson && sibPerson.gender === 'female') {
            sibRelType = 'os'; // 默认姐姐
          } else {
            sibRelType = 'ob';
          }
        }
      }
      // 2. 显式的 brother/sister 关系（双向检查）
      if ((rels[i].type === 'brother' || rels[i].type === 'sister') && (rels[i].from === pid || rels[i].to === pid)) {
        sid = rels[i].from === pid ? rels[i].to : rels[i].from;
        var sib = persons.find(function(x) { return x.id === sid; });
        // v711-51-fix-v33: 直接从 subtype 获取关系类型，需要根据方向转换
        var subtype = rels[i].subtype;
        var isFromPid = rels[i].from === pid; // 关系是否从当前人出发
        // v711-51-fix-v35: 如果关系是反向的（从对方出发），需要根据当前人性别修正 subtype
        if (!isFromPid && subtype) {
          // 反向关系：subtype 是对方视角的，需要转换
          // 哥哥→弟弟，弟弟→哥哥，姐姐→妹妹，妹妹→姐姐
          if (subtype === '哥哥') subtype = '弟弟';
          else if (subtype === '弟弟') subtype = '哥哥';
          else if (subtype === '姐姐') subtype = '妹妹';
          else if (subtype === '妹妹') subtype = '姐姐';
        }
        // v711-51-fix-v35: 根据兄弟姐妹的性别确定关系类型（brother/sister），根据 subtype 确定长幼（ob/lb/os/ls）
        if (sib && sib.gender === 'male') {
          // 男性兄弟姐妹：brother + ob/lb
          if (subtype === '哥哥') sibRelType = 'ob';
          else if (subtype === '弟弟') sibRelType = 'lb';
          // v711-51-fix-v39: 如果 subtype 是"姐姐/妹妹"但性别是男性，说明数据不一致，根据转换后的 subtype 推断
          else if (subtype === '姐姐') sibRelType = 'ob'; // 姐姐→哥哥
          else if (subtype === '妹妹') sibRelType = 'lb'; // 妹妹→弟弟
          else sibRelType = 'ob'; // 默认哥哥
        } else if (sib && sib.gender === 'female') {
          // 女性兄弟姐妹：sister + os/ls
          if (subtype === '姐姐') sibRelType = 'os';
          else if (subtype === '妹妹') sibRelType = 'ls';
          // v711-51-fix-v39: 如果 subtype 是"哥哥/弟弟"但性别是女性，说明数据不一致，根据转换后的 subtype 推断
          else if (subtype === '哥哥') sibRelType = 'os'; // 哥哥→姐姐
          else if (subtype === '弟弟') sibRelType = 'ls'; // 弟弟→妹妹
          else sibRelType = 'os'; // 默认姐姐
        } else {
          // 降级处理：根据 subtype 推断
          if (subtype === '哥哥' || subtype === '弟弟') sibRelType = subtype === '哥哥' ? 'ob' : 'lb';
          else if (subtype === '姐姐' || subtype === '妹妹') sibRelType = subtype === '姐姐' ? 'os' : 'ls';
          else sibRelType = 'ob';
        }
      }
      if (sid && !seen[sid]) {
        seen[sid] = true;
        var s = persons.find(function(p) { return p.id === sid; });
        if (s) {
          // v711-51-fix-v5: 调试日志
          if (p && (p.name === '付群芳' || p.name === '付芊雨' || p.name === '付群英' || p.name === '付忠聪' || p.name === '安淑英' || p.name === '安文杰' || p.name === '安淑花' || p.name === '白川' || p.name === '安文东')) {
            console.log('[DEBUG getSiblings] ' + p.name + ' 找到兄弟姐妹:', s.name, '关系类型:', rels[i].type, 'subtype:', rels[i].subtype, 'sibRelType:', sibRelType);
          }
          var spid = this.getSpouseId(sid, rels, persons); 
          sibs.push({ member: s, spouse: spid ? persons.find(function(p) { return p.id === spid; }) : null, relationType: sibRelType }); 
        }
      }
    }
    } // v711-51-fix-v164: 闭合 if (pids.length === 0) else
    return sibs;
  },

  // ========== v711-51 新增：通用关系链查找（BFS） ==========
  findRelationChain: function(fromId, toId, rels, persons) {
    if (fromId === toId) return [];
    
    var queue = [{ id: fromId, chain: [] }];
    var visited = {};
    visited[fromId] = true;
    
    while (queue.length > 0) {
      var current = queue.shift();
      var currentId = current.id;
      var currentChain = current.chain;
      
      // 查找当前人的所有关系
      var neighbors = [];
      
      // 1. 查找父母
      var ps = this.getParents(currentId, rels, persons);
      if (ps.father && !visited[ps.father.id]) {
        neighbors.push({ id: ps.father.id, relation: 'f', person: ps.father });
      }
      if (ps.mother && !visited[ps.mother.id]) {
        neighbors.push({ id: ps.mother.id, relation: 'm', person: ps.mother });
      }
      
      // 2. 查找子女
      var children = this.getChildren(currentId, rels, persons);
      for (var i = 0; i < children.length; i++) {
        if (children[i].member && !visited[children[i].member.id]) {
          neighbors.push({ id: children[i].member.id, relation: children[i].member.gender === 'male' ? 's' : 'd', person: children[i].member });
        }
      }
      
      // 3. 查找配偶
      var spouseId = this.getSpouseId(currentId, rels, persons);
      if (spouseId && !visited[spouseId]) {
        var spouse = persons.find(function(p) { return p.id === spouseId; });
        if (spouse) {
          neighbors.push({ id: spouseId, relation: spouse.gender === 'male' ? 'h' : 'w', person: spouse });
        }
      }
      
      // 4. 查找兄弟姐妹
      var sibs = this.getSiblings(currentId, rels, persons);
      for (var i = 0; i < sibs.length; i++) {
        if (sibs[i].member && !visited[sibs[i].member.id]) {
          var sib = sibs[i].member;
          // v711-51-fix-v33: 直接使用 getSiblings 返回的 relationType
          var sibRel = sibs[i].relationType || 'ob'; // 降级为 'ob'
          neighbors.push({ id: sib.id, relation: sibRel, person: sib });
        }
      }
      
      // 处理所有邻居
      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        if (visited[n.id]) continue;
        
        var newChain = currentChain.concat([n.relation]);
        
        if (n.id === toId) {
          return newChain;
        }
        
        visited[n.id] = true;
        queue.push({ id: n.id, chain: newChain });
      }
    }
    
    return null; // 未找到关系链
  },

  // ========== v711-51 新增：通用称谓计算（基于关系链，v8 修复版） ==========
  calculateUniversalTitle: function(chain, memberGender) {
    if (!chain || chain.length === 0) return null;
    
    // v711-51-fix-v2: 纯兄弟姐妹关系（无祖先 f/m，无向下 s/d）返回 null，让原有逻辑处理
    // 修复：安文杰视角下哥哥安文东显示为远祖父的问题
    // v711-51-fix-v8: 纯后代关系链（只有 s/d）不应该返回 null，应该继续处理
    // v711-51-fix-v23: 纯兄弟姐妹关系（os/ls/ob/lb）也不应该返回 null，应该由模式 0b 处理
    // 修复付芊雨视角下姐姐显示为 null 的问题
    var hasAncestor = false;
    var hasDescendant = false;
    var hasSibling = false;
    for (var i = 0; i < chain.length; i++) {
      if (chain[i] === 'f' || chain[i] === 'm') {
        hasAncestor = true;
        break;
      }
      if (chain[i] === 's' || chain[i] === 'd') {
        hasDescendant = true;
      }
      if (chain[i] === 'os' || chain[i] === 'ls' || chain[i] === 'ob' || chain[i] === 'lb') {
        hasSibling = true;
      }
    }
    // 只有纯兄弟姐妹关系（无祖先、无后代、无兄弟姐妹）才返回 null
    // 但如果有兄弟姐妹关系（os/ls/ob/lb），应该继续由模式 0b 处理
    if (!hasAncestor && !hasDescendant && !hasSibling) return null;
    
    // 辈分称谓前缀（按向上代数）- 单字版本
    var genPrefixSingle = ['', '父', '祖', '曾', '高', '天', '烈', '太', '远'];
    // 辈分称谓前缀（按向上代数）- 完整版本
    var genPrefixFull = ['', '父', '祖', '曾祖', '高祖', '天祖', '烈祖', '太祖', '远祖'];
    
    // 分析关系链
    var genUp = 0, genDown = 0, lastGender = 'male', maternalCount = 0;
    for (var i = 0; i < chain.length; i++) {
      var rel = chain[i];
      if (rel === 'f') { genUp++; lastGender = 'male'; }
      else if (rel === 'm') { genUp++; maternalCount++; lastGender = 'female'; }
      else if (rel === 's') { genDown++; lastGender = 'male'; }
      else if (rel === 'd') { genDown++; lastGender = 'female'; }
      else if (rel === 'ob' || rel === 'lb') { lastGender = 'male'; }
      else if (rel === 'os' || rel === 'ls') { lastGender = 'female'; }
      else if (rel === 'h') { lastGender = 'male'; }
      else if (rel === 'w') { lastGender = 'female'; }
    }
    
    // 找到姐妹位置（第一个 os/ls）
    var sisterIndex = -1;
    for (var i = 0; i < chain.length; i++) {
      if (chain[i] === 'os' || chain[i] === 'ls') { sisterIndex = i; break; }
    }
    
    // 找到配偶位置（第一个 h/w）
    var spouseIndex = -1;
    for (var i = 0; i < chain.length; i++) {
      if (chain[i] === 'h' || chain[i] === 'w') { spouseIndex = i; break; }
    }
    
    // 判断是否有"姐妹的配偶"（配偶在姐妹之后）
    var hasSibSpouse = (spouseIndex >= 0 && sisterIndex >= 0 && spouseIndex > sisterIndex);
    // 判断配偶后是否有其他关系
    var spouseHasAfter = (spouseIndex >= 0 && spouseIndex < chain.length - 1);
    
    // ========== 模式 0：女性视角称谓（丈夫方亲属） ==========
    // 修复付芊雨视角：公公/婆婆/爷爷/奶奶/姐姐/姐夫/外甥/外甥女/侄子等
    // 余泽友视角特殊处理：妻子的妹妹的丈夫的儿子 = 姻侄
    if (chain.length === 4 && chain[0] === 'w' && chain[1] === 'ls' && chain[2] === 'h' && chain[3] === 's') {
      return '姻侄';
    }
    
    // 余泽友视角特殊处理：妻子的妹妹的丈夫的哥哥的儿子 = 姻侄
    if (chain.length === 5 && chain[0] === 'w' && chain[1] === 'ls' && chain[2] === 'h' && (chain[3] === 'ob' || chain[3] === 'lb') && chain[4] === 's') {
      return '姻侄';
    }
    
    // v711-51-fix-v29: 处理丈夫方亲属
    // 排除：丈夫的妈妈的亲属（由模式 0g-3 处理）
    if (chain[0] === 'h') {
      // 排除丈夫的妈妈的亲属系列（由模式 0g-3 处理）
      if (chain.length >= 2 && chain[1] === 'm') {
        // 让模式 0g-3 处理，不在此返回
      }
      // 排除丈夫的兄弟姐妹的妻子的亲属（由模式 0g 处理）
      else if (chain.length >= 3 && (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 'w') {
        // 让模式 0g 处理，不在此返回
      } else {
      // 关系链以丈夫开始，说明是女性视角看丈夫方亲属
      var afterHusbandChain = chain.slice(1); // 去掉'h'后的关系链
      
      // 分析丈夫后的关系
      var hGenUp = 0, hGenDown = 0;
      var hSisterIndex = -1, hBrotherIndex = -1, hSpouseIndex = -1;
      for (var i = 0; i < afterHusbandChain.length; i++) {
        var rel = afterHusbandChain[i];
        if (rel === 'f' || rel === 'm') hGenUp++;
        else if (rel === 's' || rel === 'd') hGenDown++;
        else if (rel === 'os' || rel === 'ls') {
          if (hSisterIndex < 0) hSisterIndex = i;
        }
        else if (rel === 'ob' || rel === 'lb') {
          if (hBrotherIndex < 0) hBrotherIndex = i;
        }
      }
      for (var i = 0; i < afterHusbandChain.length; i++) {
        if (afterHusbandChain[i] === 'h' || afterHusbandChain[i] === 'w') {
          hSpouseIndex = i; break;
        }
      }
      
      // 公公/婆婆：我的丈夫的爸爸/妈妈
      if (afterHusbandChain.length === 1) {
        if (afterHusbandChain[0] === 'f') return '公公';
        if (afterHusbandChain[0] === 'm') return '婆婆';
      }
      
      // 爷爷/奶奶：我的丈夫的爸爸的爸爸/妈妈
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f') {
        if (afterHusbandChain[1] === 'f') return '爷爷';
        if (afterHusbandChain[1] === 'm') return '奶奶';
      }
      
      // ========== 模式 0a-1a：丈夫的爸爸的姐妹系列（姑妈系列） ==========
      // 处理：丈夫的爸爸的姐妹及其后代（h-f-[os/ls]）
      if (afterHusbandChain.length >= 2 && afterHusbandChain[0] === 'f' && 
          (afterHusbandChain[1] === 'os' || afterHusbandChain[1] === 'ls')) {
        var husbandAuntRel = afterHusbandChain[1]; // os/ls
        var afterHusbandAuntChain = afterHusbandChain.slice(2); // 去掉 [f, os/ls] 后的关系链
        
        // 丈夫的爸爸的姐姐：姑妈
        if (afterHusbandAuntChain.length === 0 && husbandAuntRel === 'os') {
          return '姑妈';
        }
        // 丈夫的爸爸的妹妹：姑妈
        if (afterHusbandAuntChain.length === 0 && husbandAuntRel === 'ls') {
          return '姑妈';
        }
        
        // 丈夫的爸爸的姐妹的丈夫：姑父
        if (afterHusbandAuntChain.length === 1 && afterHusbandAuntChain[0] === 'h') {
          return '姑父';
        }
        
        // 丈夫的爸爸的姐妹的子女：表兄弟/表姐妹
        if (afterHusbandAuntChain.length === 1) {
          if (afterHusbandAuntChain[0] === 's') {
            return '表兄弟';
          }
          if (afterHusbandAuntChain[0] === 'd') {
            return '表姐妹';
          }
        }
        
        // 丈夫的爸爸的姐妹的子女的配偶
        if (afterHusbandAuntChain.length === 2) {
          if (afterHusbandAuntChain[0] === 's' && afterHusbandAuntChain[1] === 'w') {
            return '表兄弟媳';
          }
          if (afterHusbandAuntChain[0] === 'd' && afterHusbandAuntChain[1] === 'h') {
            return '表姐妹夫';
          }
        }
        
        // 丈夫的爸爸的姐妹的子女的后代
        if (afterHusbandAuntChain.length >= 2) {
          var lastGenGender = 'male';
          for (var i = afterHusbandAuntChain.length - 1; i >= 0; i--) {
            if (afterHusbandAuntChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterHusbandAuntChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 表兄弟的子女 = 表侄/表侄女
          if (afterHusbandAuntChain[0] === 's' && afterHusbandAuntChain.length === 2) {
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          // 表姐妹的子女 = 表外甥/表外甥女
          if (afterHusbandAuntChain[0] === 'd' && afterHusbandAuntChain.length === 2) {
            return lastGenGender === 'male' ? '表外甥' : '表外甥女';
          }
          // 表姐妹的子女的配偶：表外甥媳/表外甥女婿
          if (afterHusbandAuntChain[0] === 'd' && afterHusbandAuntChain.length === 3) {
            if (afterHusbandAuntChain[1] === 's' && afterHusbandAuntChain[2] === 'w') {
              return '表外甥媳';
            }
            if (afterHusbandAuntChain[1] === 'd' && afterHusbandAuntChain[2] === 'h') {
              return '表外甥女婿';
            }
          }
          if (afterHusbandAuntChain.length === 3) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
          if (afterHusbandAuntChain.length === 4) {
            return lastGenGender === 'male' ? '表侄曾孙' : '表侄曾孙女';
          }
        }
      }
      
      // ========== 模式 0a-1：丈夫的爸爸的兄弟系列 ==========
      // 处理：丈夫的爸爸的兄弟及其后代
      if (afterHusbandChain.length >= 2 && afterHusbandChain[0] === 'f' && 
          (afterHusbandChain[1] === 'ob' || afterHusbandChain[1] === 'lb')) {
        var husbandUncleRel = afterHusbandChain[1]; // ob/lb
        var afterHusbandUncleChain = afterHusbandChain.slice(2); // 去掉 [f, ob/lb] 后的关系链
        
        // 丈夫的爸爸的哥哥：伯父
        if (afterHusbandUncleChain.length === 0 && husbandUncleRel === 'ob') {
          return '伯父';
        }
        // 丈夫的爸爸的弟弟：叔父
        if (afterHusbandUncleChain.length === 0 && husbandUncleRel === 'lb') {
          return '叔父';
        }
        
        // 丈夫的爸爸的兄弟的妻子：伯母/叔母
        if (afterHusbandUncleChain.length === 1 && afterHusbandUncleChain[0] === 'w') {
          return husbandUncleRel === 'ob' ? '伯母' : '叔母';
        }
        
        // 丈夫的爸爸的兄弟的子女：堂兄弟/堂姐妹
        if (afterHusbandUncleChain.length === 1) {
          if (afterHusbandUncleChain[0] === 's') {
            return '堂兄弟';
          }
          if (afterHusbandUncleChain[0] === 'd') {
            return '堂姐妹';
          }
        }
        
        // 丈夫的爸爸的兄弟的子女的配偶
        if (afterHusbandUncleChain.length === 2) {
          if (afterHusbandUncleChain[0] === 's' && afterHusbandUncleChain[1] === 'w') {
            return '堂兄弟媳';
          }
          if (afterHusbandUncleChain[0] === 'd' && afterHusbandUncleChain[1] === 'h') {
            return '堂姐妹夫';
          }
        }
        
        // 丈夫的爸爸的兄弟的子女的后代
        if (afterHusbandUncleChain.length >= 2) {
          var lastGenGender = 'male';
          for (var i = afterHusbandUncleChain.length - 1; i >= 0; i--) {
            if (afterHusbandUncleChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterHusbandUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 堂兄弟的子女 = 堂侄/堂侄女
          if (afterHusbandUncleChain[0] === 's' && afterHusbandUncleChain.length === 2) {
            return lastGenGender === 'male' ? '堂侄' : '堂侄女';
          }
          // 堂姐妹的子女 = 堂外甥/堂外甥女（付芊雨视角修复：丈夫的堂姐妹的子女）
          if (afterHusbandUncleChain[0] === 'd' && afterHusbandUncleChain.length === 2) {
            return lastGenGender === 'male' ? '堂外甥' : '堂外甥女';
          }
          // 堂姐妹的子女的配偶：堂外甥媳/堂外甥女婿
          if (afterHusbandUncleChain[0] === 'd' && afterHusbandUncleChain.length === 3) {
            if (afterHusbandUncleChain[1] === 's' && afterHusbandUncleChain[2] === 'w') {
              return '堂外甥媳';
            }
            if (afterHusbandUncleChain[1] === 'd' && afterHusbandUncleChain[2] === 'h') {
              return '堂外甥女婿';
            }
          }
          // 修复 v711-51-fix-v135: 堂兄弟/堂姐妹的女儿的丈夫 = 堂侄女婿/堂外甥女婿
          if (afterHusbandUncleChain.length === 3 && afterHusbandUncleChain[2] === 'h') {
            if (afterHusbandUncleChain[0] === 's' && afterHusbandUncleChain[1] === 'd') {
              // 堂兄弟的女儿的丈夫 = 堂侄女婿
              return '堂侄女婿';
            }
            if (afterHusbandUncleChain[0] === 'd' && afterHusbandUncleChain[1] === 'd') {
              // 堂姐妹的女儿的丈夫 = 堂外甥女婿
              return '堂外甥女婿';
            }
          }
          // 修复 v711-51-fix-v137: 丈夫的弟弟的儿子的女儿的丈夫 = 侄孙女婿
          if (afterHusbandUncleChain.length === 3 && afterHusbandUncleChain[2] === 'h') {
            if (afterHusbandUncleChain[0] === 's' && afterHusbandUncleChain[1] === 'd') {
              // 丈夫的弟弟/哥哥的儿子的女儿的丈夫 = 侄孙女婿
              return '侄孙女婿';
            }
          }
          if (afterHusbandUncleChain.length === 3) {
            // 向下 2 代：堂侄孙/堂侄孙女
            return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
          }
          if (afterHusbandUncleChain.length === 4) {
            // 向下 3 代：堂侄曾孙/堂侄曾孙女
            return lastGenGender === 'male' ? '堂侄曾孙' : '堂侄曾孙女';
          }
        }
      }
      
      // ========== 模式 0a-2：丈夫的爸爸的爸爸的兄弟系列 ==========
      // 处理：丈夫的爸爸的爸爸的兄弟及其后代（h-f-f-[ob/lb]）
      if (afterHusbandChain.length >= 3 && afterHusbandChain[0] === 'f' && 
          afterHusbandChain[1] === 'f' && 
          (afterHusbandChain[2] === 'ob' || afterHusbandChain[2] === 'lb')) {
        var husbandGreatUncleRel = afterHusbandChain[2]; // ob/lb
        var afterHusbandGreatUncleChain = afterHusbandChain.slice(3); // 去掉 [f, f, ob/lb] 后的关系链
        
        // 丈夫的爸爸的爸爸的哥哥：伯祖父
        if (afterHusbandGreatUncleChain.length === 0 && husbandGreatUncleRel === 'ob') {
          return '伯祖父';
        }
        // 丈夫的爸爸的爸爸的弟弟：叔祖父
        if (afterHusbandGreatUncleChain.length === 0 && husbandGreatUncleRel === 'lb') {
          return '叔祖父';
        }
        
        // 丈夫的爸爸的爸爸的兄弟的妻子：伯祖母/叔祖母
        if (afterHusbandGreatUncleChain.length === 1 && afterHusbandGreatUncleChain[0] === 'w') {
          return husbandGreatUncleRel === 'ob' ? '伯祖母' : '叔祖母';
        }
        
        // 丈夫的爸爸的爸爸的兄弟的子女（堂伯父/堂叔父/堂姑母系列）
        if (afterHusbandGreatUncleChain.length === 1) {
          if (afterHusbandGreatUncleChain[0] === 's') {
            // 叔祖父的儿子 = 父亲的堂兄弟 = 堂伯父/堂叔父
            return husbandGreatUncleRel === 'ob' ? '堂伯父' : '堂叔父';
          }
          if (afterHusbandGreatUncleChain[0] === 'd') {
            // 叔祖父的女儿 = 父亲的堂姐妹 = 堂姑母
            return '堂姑母';
          }
        }
        
        // 丈夫的爸爸的爸爸的兄弟的子女的配偶
        if (afterHusbandGreatUncleChain.length === 2) {
          if (afterHusbandGreatUncleChain[0] === 's' && afterHusbandGreatUncleChain[1] === 'w') {
            return husbandGreatUncleRel === 'ob' ? '堂伯母' : '堂叔母';
          }
          if (afterHusbandGreatUncleChain[0] === 'd' && afterHusbandGreatUncleChain[1] === 'h') {
            return '堂姑父';
          }
        }
        
        // 丈夫的爸爸的爸爸的兄弟的子女的后代（堂兄弟姐妹/表兄弟姐妹系列）
        if (afterHusbandGreatUncleChain.length >= 2) {
          var lastGenGender = 'male';
          for (var i = afterHusbandGreatUncleChain.length - 1; i >= 0; i--) {
            if (afterHusbandGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterHusbandGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 儿子的子女：堂兄弟/堂姐妹
          if (afterHusbandGreatUncleChain[0] === 's' && afterHusbandGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? '堂兄弟' : '堂姐妹';
          }
          // 女儿的子女：表兄弟/表姐妹（因为女儿嫁出去了）
          if (afterHusbandGreatUncleChain[0] === 'd' && afterHusbandGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
          }
          
          // 更深后代
          if (afterHusbandGreatUncleChain.length === 3) {
            return lastGenGender === 'male' ? '堂侄' : '堂侄女';
          }
          if (afterHusbandGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
          }
        }
      }
      
      // 姐姐/妹妹/哥哥/弟弟：我的丈夫的姐姐/妹妹/哥哥/弟弟（无后代）
      if (afterHusbandChain.length === 1) {
        var firstRel = afterHusbandChain[0];
        if (firstRel === 'os') return '姐姐';
        if (firstRel === 'ls') return '妹妹';
        if (firstRel === 'ob') return '哥哥';
        if (firstRel === 'lb') return '弟弟';
      }
      
      // 姐夫/嫂子：我的丈夫的姐姐/哥哥的配偶
      if (hSpouseIndex >= 0 && hSpouseIndex === 1) {
        if (hSisterIndex === 0 && (afterHusbandChain[1] === 'h')) return '姐夫';
        if (hBrotherIndex === 0 && (afterHusbandChain[1] === 'w')) return '嫂子';
      }
      
      // 外甥/外甥女：我的丈夫的姐姐的儿子/女儿（仅姐妹的子女）
      // 关系链：h, os/ls, s/d（长度为 2：去掉 h 后是 [os/ls, s/d]）
      if (hSisterIndex === 0 && hGenDown === 1 && hGenUp === 0 && hSpouseIndex < 0 && afterHusbandChain.length === 2) {
        var childRel = afterHusbandChain[1];
        if (childRel === 's') return '外甥';
        if (childRel === 'd') return '外甥女';
      }
      
      // 侄子/侄女：我的丈夫的哥哥的儿子/女儿（仅哥哥的子女）
      // 关系链：h, ob/lb, s/d（长度为 2：去掉 h 后是 [ob/lb, s/d]）
      if (hBrotherIndex === 0 && hGenDown === 1 && hGenUp === 0 && hSpouseIndex < 0 && afterHusbandChain.length === 2) {
        var childRel = afterHusbandChain[1];
        if (childRel === 's') return '侄子';
        if (childRel === 'd') return '侄女';
      }
      
      // ========== 新增：丈夫的兄弟姐妹的子女的配偶及后代 ==========
      // 侄媳/侄女婿：我的丈夫的哥哥/弟弟的子女的配偶
      // 关系链：h, ob/lb, s, w（儿子的妻子）或 h, ob/lb, d, h（女儿的丈夫）
      if (hBrotherIndex === 0 && afterHusbandChain.length === 3) {
        if (afterHusbandChain[1] === 's' && afterHusbandChain[2] === 'w') return '侄媳';
        if (afterHusbandChain[1] === 'd' && afterHusbandChain[2] === 'h') return '侄女婿';
      }
      
      // 侄孙/侄孙女：我的丈夫的哥哥/弟弟的孙子/孙女（儿子的子女）
      // 关系链：h, ob/lb, s, s/d（长度为 3）
      if (hBrotherIndex === 0 && afterHusbandChain.length === 3 && afterHusbandChain[1] === 's') {
        var grandchildRel = afterHusbandChain[2];
        if (grandchildRel === 's') return '侄孙';
        if (grandchildRel === 'd') return '侄孙女';
      }
      
      // 修复 v711-51-fix-v138：侄孙女婿/外甥孙女婿
      // 关系链：h, ob/lb, s, d, h（长度为 4）或 h, ob/lb, d, d, h
      if (hBrotherIndex === 0 && afterHusbandChain.length === 4 && afterHusbandChain[3] === 'h') {
        if (afterHusbandChain[1] === 's' && afterHusbandChain[2] === 'd') {
          return '侄孙女婿';
        }
      }
      if (hBrotherIndex === 0 && afterHusbandChain.length === 4 && afterHusbandChain[3] === 'h') {
        if (afterHusbandChain[1] === 'd' && afterHusbandChain[2] === 'd') {
          return '外甥孙女婿';
        }
      }
      if (hSisterIndex === 0 && afterHusbandChain.length === 4 && afterHusbandChain[3] === 'h') {
        if (afterHusbandChain[1] === 's' && afterHusbandChain[2] === 'd') {
          return '外甥孙女婿';
        }
        if (afterHusbandChain[1] === 'd' && afterHusbandChain[2] === 'd') {
          return '外甥孙女婿';
        }
      }
      
      // 外甥媳/外甥女婿：我的丈夫的姐姐/妹妹的子女的配偶
      // 关系链：h, os/ls, s, w（儿子的妻子）或 h, os/ls, d, h（女儿的丈夫）
      if (hSisterIndex === 0 && afterHusbandChain.length === 3) {
        if (afterHusbandChain[1] === 's' && afterHusbandChain[2] === 'w') return '外甥媳';
        if (afterHusbandChain[1] === 'd' && afterHusbandChain[2] === 'h') return '外甥女婿';
      }
      
      // 外甥孙/外甥孙女：我的丈夫的姐姐/妹妹的孙子/孙女（儿子的子女）
      // 关系链：h, os/ls, s, s/d（长度为 3）
      if (hSisterIndex === 0 && afterHusbandChain.length === 3 && afterHusbandChain[1] === 's') {
        var grandchildRel = afterHusbandChain[2];
        if (grandchildRel === 's') return '外甥孙';
        if (grandchildRel === 'd') return '外甥孙女';
      }
      
      // 新增：兄弟的女儿的子女也是外甥孙/外甥孙女（女儿嫁出去了）
      // 关系链：h, ob/lb, d, s/d（长度为 3）
      if (hBrotherIndex === 0 && afterHusbandChain.length === 3 && afterHusbandChain[1] === 'd') {
        var grandchildRel = afterHusbandChain[2];
        if (grandchildRel === 's') return '外甥孙';
        if (grandchildRel === 'd') return '外甥孙女';
      }
      
      // 丈夫的兄弟姐妹的更远后代（曾孙、玄孙、来孙）
      // 通用逻辑：根据代数判断称谓
      if (hBrotherIndex === 0 || hSisterIndex === 0) {
        var isBrother = (hBrotherIndex === 0);
        var hGenDownTotal = 0;
        for (var i = 0; i < afterHusbandChain.length; i++) {
          if (afterHusbandChain[i] === 's' || afterHusbandChain[i] === 'd') hGenDownTotal++;
        }
        
        // 曾孙辈（+2 代）：关系链长度为 4
        if (hGenDownTotal === 3 && afterHusbandChain.length === 4) {
          var greatGrandchildRel = afterHusbandChain[3];
          if (isBrother) {
            if (greatGrandchildRel === 's') return '侄曾孙';
            if (greatGrandchildRel === 'd') return '侄曾孙女';
          } else {
            if (greatGrandchildRel === 's') return '外甥曾孙';
            if (greatGrandchildRel === 'd') return '外甥曾孙女';
          }
        }
        
        // 玄孙辈（+3 代）：关系链长度为 5
        if (hGenDownTotal === 4 && afterHusbandChain.length === 5) {
          var pxGrandchildRel = afterHusbandChain[4];
          if (isBrother) {
            if (pxGrandchildRel === 's') return '侄玄孙';
            if (pxGrandchildRel === 'd') return '侄玄孙女';
          } else {
            if (pxGrandchildRel === 's') return '外甥玄孙';
            if (pxGrandchildRel === 'd') return '外甥玄孙女';
          }
        }
        
        // 来孙辈（+4 代）：关系链长度为 6
        if (hGenDownTotal === 5 && afterHusbandChain.length === 6) {
          var lsGrandchildRel = afterHusbandChain[5];
          if (isBrother) {
            if (lsGrandchildRel === 's') return '侄来孙';
            if (lsGrandchildRel === 'd') return '侄来孙女';
          } else {
            if (lsGrandchildRel === 's') return '外甥来孙';
            if (lsGrandchildRel === 'd') return '外甥来孙女';
          }
        }
      }
      } // 结束 else 块
    } // v711-51-fix-v29: 结束模式 0（丈夫方亲属）
    
    // ========== 模式 0b：女性视角称谓（自己的兄弟姐妹及其子女） ==========
    // 修复付芊雨视角：姐姐/哥哥/弟弟/妹妹/外甥/外甥女/外甥孙/外甥曾孙等
    console.log('[模式 0b 检查] chain[0] =', chain[0], 'chain =', chain);
    if (chain[0] === 'os' || chain[0] === 'ls' || chain[0] === 'ob' || chain[0] === 'lb') {
      console.log('[模式 0b 匹配] sibRel =', chain[0]);
      // 关系链以兄弟姐妹开始，说明是自己的兄弟姐妹或其子女
      var sibRel = chain[0]; // os/ls/ob/lb
      var afterSibChain = chain.slice(1); // 去掉第一个兄弟姐妹后的关系链
      console.log('[模式 0b] afterSibChain =', afterSibChain, 'length =', afterSibChain.length);
      
      // 兄弟姐妹称谓（无后代）- 区分长幼
      if (afterSibChain.length === 0) {
        console.log('[模式 0b 兄弟姐妹] sibRel =', sibRel);
        if (sibRel === 'os') return '姐姐';
        if (sibRel === 'ls') return '妹妹';
        if (sibRel === 'ob') return '哥哥';
        if (sibRel === 'lb') return '弟弟';
      }
      
      // 兄弟姐妹的配偶
      if (afterSibChain.length === 1 && (afterSibChain[0] === 'h' || afterSibChain[0] === 'w')) {
        if (sibRel === 'os') {
          if (afterSibChain[0] === 'h') return '姐夫';
          if (afterSibChain[0] === 'w') return '嫂子'; // 女同场景
        }
        if (sibRel === 'ls') {
          if (afterSibChain[0] === 'h') return '妹夫';
          if (afterSibChain[0] === 'w') return '嫂子'; // 女同场景（妹妹的妻子）
        }
        if (sibRel === 'ob') {
          if (afterSibChain[0] === 'w') return '嫂子';
          if (afterSibChain[0] === 'h') return '姐夫'; // 男同场景
        }
        if (sibRel === 'lb') {
          if (afterSibChain[0] === 'w') return '弟媳';
          if (afterSibChain[0] === 'h') return '妹夫'; // 男同场景（弟弟的丈夫）
        }
      }
      
      // 分析兄弟姐妹后的关系
      var sibGenDown = 0;
      for (var i = 0; i < afterSibChain.length; i++) {
        if (afterSibChain[i] === 's' || afterSibChain[i] === 'd') sibGenDown++;
      }
      
      // 判断最后一代性别
      var lastGenGender = 'male';
      for (var i = chain.length - 1; i >= 0; i--) {
        if (chain[i] === 's' || chain[i] === 'ob' || chain[i] === 'lb') { lastGenGender = 'male'; break; }
        else if (chain[i] === 'd' || chain[i] === 'os' || chain[i] === 'ls') { lastGenGender = 'female'; break; }
      }
      
      // 侄子/侄女：我的哥哥/弟弟的儿子/女儿（兄弟的子女）
      // 外甥/外甥女：我的姐姐/妹妹的儿子/女儿（姐妹的子女）
      if (sibGenDown === 1 && afterSibChain.length >= 1) {
        var childRel = afterSibChain[0];
        // 兄弟（哥哥/弟弟）的子女 = 侄子/侄女
        if (sibRel === 'ob' || sibRel === 'lb') {
          if (childRel === 's') return '侄子';
          if (childRel === 'd') return '侄女';
        }
        // 姐妹（姐姐/妹妹）的子女 = 外甥/外甥女
        if (sibRel === 'os' || sibRel === 'ls') {
          if (childRel === 's') return '外甥';
          if (childRel === 'd') return '外甥女';
        }
      }
      
      // 侄孙/侄孙女：我的哥哥/弟弟的儿子的儿子/女儿
      // 外甥孙/外甥孙女：我的哥哥/弟弟的女儿的儿子/女儿，或我的姐姐/妹妹的儿子的儿子/女儿
      if (sibGenDown === 2 && afterSibChain.length >= 2) {
        // 兄弟的儿子的子女 = 侄孙/侄孙女（排除儿子的女儿的丈夫：侄孙女婿）
        if ((sibRel === 'ob' || sibRel === 'lb') && afterSibChain[0] === 's') {
          // 修复 v711-51-fix-v138：排除 s,d,h（侄孙女婿）的情况
          if (afterSibChain.length === 3 && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
            // 不处理，让后面的代码处理侄孙女婿
          } else {
            var grandchildRel = afterSibChain[1];
            if (grandchildRel === 's') return '侄孙';
            if (grandchildRel === 'd') return '侄孙女';
          }
        }
        // 兄弟的女儿的子女 = 外甥孙/外甥孙女（排除女儿的女儿的丈夫：外孙女婿；女儿的女儿的儿子：外孙媳）
        if ((sibRel === 'ob' || sibRel === 'lb') && afterSibChain[0] === 'd') {
          // 修复 v711-51-fix-v138：排除 d,d,h（外孙女婿）和 d,s,w（外甥孙媳）的情况
          if (afterSibChain.length === 3 && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
            // 不处理，让后面的代码处理外孙女婿
          } else if (afterSibChain.length === 3 && afterSibChain[1] === 's' && afterSibChain[2] === 'w') {
            // 不处理，让后面的代码处理外甥孙媳
          } else {
            var grandchildRel = afterSibChain[1];
            if (grandchildRel === 's') return '外甥孙';
            if (grandchildRel === 'd') return '外甥孙女';
          }
        }
        // 姐妹的儿子的子女 = 外甥孙/外甥孙女
        if ((sibRel === 'os' || sibRel === 'ls') && afterSibChain[0] === 's') {
          var grandchildRel = afterSibChain[1];
          if (grandchildRel === 's') return '外甥孙';
          if (grandchildRel === 'd') return '外甥孙女';
        }
        // 姐妹的女儿的子女 = 外甥外甥孙/外甥外甥孙女
        if ((sibRel === 'os' || sibRel === 'ls') && afterSibChain[0] === 'd') {
          var grandchildRel = afterSibChain[1];
          if (grandchildRel === 's') return '外甥外甥孙';
          if (grandchildRel === 'd') return '外甥外甥孙女';
        }
      }
      
      // 外甥曾孙/外甥曾孙女/侄曾孙/侄曾孙女：+2 代
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 's') {
        var greatGrandchildRel = afterSibChain[2];
        if (sibRel === 'ob' || sibRel === 'os') {
          if (greatGrandchildRel === 's') return '外甥曾孙';
          if (greatGrandchildRel === 'd') return '外甥曾孙女';
        }
        if (sibRel === 'lb' || sibRel === 'ls') {
          if (greatGrandchildRel === 's') return '侄曾孙';
          if (greatGrandchildRel === 'd') return '侄曾孙女';
        }
      }
      
      // 外甥玄孙/外甥玄孙女/侄玄孙/侄玄孙女：+3 代
      if (sibGenDown === 4 && afterSibChain.length >= 4 && afterSibChain[0] === 's') {
        var pxRel = afterSibChain[3];
        if (sibRel === 'ob' || sibRel === 'os') {
          if (pxRel === 's') return '外甥玄孙';
          if (pxRel === 'd') return '外甥玄孙女';
        }
        if (sibRel === 'lb' || sibRel === 'ls') {
          if (pxRel === 's') return '侄玄孙';
          if (pxRel === 'd') return '侄玄孙女';
        }
      }
      
      // 外甥来孙/外甥来孙女/侄来孙/侄来孙女：+4 代
      if (sibGenDown === 5 && afterSibChain.length >= 5 && afterSibChain[0] === 's') {
        var lsRel = afterSibChain[4];
        if (sibRel === 'ob' || sibRel === 'os') {
          if (lsRel === 's') return '外甥来孙';
          if (lsRel === 'd') return '外甥来孙女';
        }
        if (sibRel === 'lb' || sibRel === 'ls') {
          if (lsRel === 's') return '侄来孙';
          if (lsRel === 'd') return '侄来孙女';
        }
      }
      
      // 侄媳/侄女婿：我的哥哥/弟弟的儿子的妻子/女儿的丈夫
      // 外甥媳/外甥女婿：我的姐姐/妹妹的儿子的妻子/女儿的丈夫
      if (sibGenDown === 2 && afterSibChain.length >= 2 && afterSibChain[0] === 's' && afterSibChain[1] === 'w') {
        if (sibRel === 'ob' || sibRel === 'lb') return '侄媳';
        if (sibRel === 'os' || sibRel === 'ls') return '外甥媳';
      }
      
      if (sibGenDown === 2 && afterSibChain.length >= 2 && afterSibChain[0] === 'd' && afterSibChain[1] === 'h') {
        if (sibRel === 'ob' || sibRel === 'lb') return '侄女婿';
        if (sibRel === 'os' || sibRel === 'ls') return '外甥女婿';
      }
      
      // 外甥孙媳/侄孙媳：我的兄弟姐妹的儿子的儿子的妻子
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 's' && afterSibChain[1] === 's' && afterSibChain[2] === 'w') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥孙媳';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄孙媳';
      }
      
      // 外甥孙女女婿/侄孙女女婿：我的兄弟姐妹的儿子的女儿的丈夫
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 's' && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥孙女女婿';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄孙女女婿';
      }
      
      // 外甥孙女婿/侄孙女婿：我的兄弟姐妹的女儿的儿子的妻子（女儿嫁出，子女随外姓）
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's' && afterSibChain[2] === 'w') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥孙女婿';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄孙女婿';
      }
      
      // 修复 v711-51-fix-v137: 弟弟/哥哥的儿子的女儿的丈夫 = 侄孙女婿
      if (sibGenDown === 2 && afterSibChain.length === 3 && afterSibChain[0] === 's' && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
        if (sibRel === 'ob' || sibRel === 'lb') return '侄孙女婿';
        if (sibRel === 'os' || sibRel === 'ls') return '外孙女婿';
      }
      
      // 修复 v711-51-fix-v138: 弟弟/哥哥的女儿的儿子的丈夫 = 外孙女婿
      if (sibGenDown === 2 && afterSibChain.length === 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
        if (sibRel === 'ob' || sibRel === 'lb') return '外孙女婿';
        if (sibRel === 'os' || sibRel === 'ls') return '外孙女婿';
      }
      
      // 修复 v711-51-fix-v137: 弟弟/哥哥的女儿的儿子的妻子 = 外孙媳
      if (sibGenDown === 2 && afterSibChain.length === 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's' && afterSibChain[2] === 'w') {
        if (sibRel === 'ob' || sibRel === 'lb') return '外孙媳';
        if (sibRel === 'os' || sibRel === 'ls') return '外甥孙媳';
      }
      
      // 外甥外甥孙/侄外甥孙：我的兄弟姐妹的女儿的儿子
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥外甥孙';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄外甥孙';
      }
      
      // 外甥外甥女/侄外甥女：我的兄弟姐妹的女儿的女儿
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 'd') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥外甥女';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄外甥女';
      }
    }
    
    // ========== 模式 0c：姻亲系列（兄弟姐妹的妻子的亲属）==========
    // 处理：弟弟/哥哥的妻子的姐姐/爸爸/妈妈等
    // 关系链：ob/lb/os/ls, w, ...
    if (chain.length >= 2 && (chain[0] === 'ob' || chain[0] === 'lb' || chain[0] === 'os' || chain[0] === 'ls') && chain[1] === 'w') {
      var sibRel = chain[0]; // ob/lb/os/ls
      var afterWifeChain = chain.slice(2); // 去掉 [sib, w] 后的关系链
      var isElderBrother = (chain[0] === 'ob' || chain[0] === 'os'); // 哥哥/姐姐
      var isYoungerBrother = (chain[0] === 'lb' || chain[0] === 'ls'); // 弟弟/妹妹
      var isMaleSib = (chain[0] === 'ob' || chain[0] === 'lb'); // 哥哥/弟弟
      var isFemaleSib = (chain[0] === 'os' || chain[0] === 'ls'); // 姐姐/妹妹
      
      // 弟弟/哥哥/姐姐/妹妹的妻子（afterWifeChain 为空）
      if (afterWifeChain.length === 0) {
        if (sibRel === 'ob') return '嫂子';
        if (sibRel === 'lb') return '弟媳';
        if (sibRel === 'os') return '嫂子'; // 女同场景
        if (sibRel === 'ls') return '弟媳'; // 女同场景（妹妹的妻子）
      }
      
      // 妻子的兄弟姐妹的子女的配偶：姻外甥媳/姻外甥女婿（优先检查，避免被下面的逻辑覆盖）
      if (afterWifeChain.length >= 3 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls' || afterWifeChain[0] === 'ob' || afterWifeChain[0] === 'lb')) {
        if (afterWifeChain[1] === 's' && afterWifeChain[2] === 'w') return '姻外甥媳';
        if (afterWifeChain[1] === 'd' && afterWifeChain[2] === 'h') return '姻外甥女婿';
      }
      
      // 妻子的兄弟姐妹的子女：姻外甥/姻外甥女（仅当关系链长度为 2 时匹配，避免覆盖更长的关系链）
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls' || afterWifeChain[0] === 'ob' || afterWifeChain[0] === 'lb')) {
        var childRel = afterWifeChain[1];
        if (childRel === 's') return '姻外甥';
        if (childRel === 'd') return '姻外甥女';
      }
      
      // 妻子的父母：姻伯/姻伯母
      if (afterWifeChain.length === 1) {
        if (afterWifeChain[0] === 'f') return '姻伯';
        if (afterWifeChain[0] === 'm') return '姻伯母';
      }
      
      // 妻子的兄弟姐妹：姻姐/姻妹/姻兄/姻弟
      if (afterWifeChain.length === 1) {
        if (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') {
          // 妻子的姐姐：姻姐
          return '姻姐';
        }
        if (afterWifeChain[0] === 'ob' || afterWifeChain[0] === 'lb') {
          // 妻子的哥哥：姻兄
          return '姻兄';
        }
      }
      
      // 妻子的姐妹的丈夫：姻姐夫/姻妹夫
      if (afterWifeChain.length === 2 && afterWifeChain[1] === 'h') {
        if (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') {
          return '姻姐夫';
        }
      }
      
      // 妻子的姐妹的子女：姻侄/姻侄女
      if (afterWifeChain.length === 1 && (afterWifeChain[0] === 's' || afterWifeChain[0] === 'd')) {
        if (afterWifeChain[0] === 's') return '姻侄';
        if (afterWifeChain[0] === 'd') return '姻侄女';
      }
      
      // 妻子的兄弟的子女：姻侄/姻侄女（修复余泽友视角：妻子的妹妹的丈夫的儿子）
      if (afterWifeChain.length === 2 && afterWifeChain[0] === 'h' && (afterWifeChain[1] === 's' || afterWifeChain[1] === 'd')) {
        if (afterWifeChain[1] === 's') return '姻侄';
        if (afterWifeChain[1] === 'd') return '姻侄女';
      }
      
      // 妻子的姐妹的后代：通用公式计算称谓
      // 基础称谓：genDown=1→外甥，2→外甥孙，3→外甥曾孙，4→外甥玄孙，5→外甥来孙
      // 性别后缀：最后一代是女性则加"女"
      // 配偶后缀：最后是 h→女婿，w→媳
      if (afterWifeChain.length >= 1 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls')) {
        var genDown = 0;
        for (var i = 1; i < afterWifeChain.length; i++) {
          if (afterWifeChain[i] === 's' || afterWifeChain[i] === 'd') genDown++;
        }
        // 判断最后一代性别（排除配偶 h/w）
        var lastGender = 'male';
        for (var i = afterWifeChain.length - 1; i >= 0; i--) {
          if (afterWifeChain[i] === 's' || afterWifeChain[i] === 'ob' || afterWifeChain[i] === 'lb') {
            lastGender = 'male'; break;
          } else if (afterWifeChain[i] === 'd' || afterWifeChain[i] === 'os' || afterWifeChain[i] === 'ls') {
            lastGender = 'female'; break;
          }
        }
        // 判断是否有配偶关系（最后一个是 h 或 w）
        var lastRel = afterWifeChain[afterWifeChain.length - 1];
        var hasSpouseAtEnd = (lastRel === 'h' || lastRel === 'w');
        
        // 基础称谓映射
        var baseTitle = '';
        if (genDown === 1) baseTitle = '姻外甥';
        else if (genDown === 2) baseTitle = '姻外甥孙';
        else if (genDown === 3) baseTitle = '姻外甥曾孙';
        else if (genDown === 4) baseTitle = '姻外甥玄孙';
        else if (genDown === 5) baseTitle = '姻外甥来孙';
        
        if (baseTitle !== '') {
          // 有配偶后缀
          if (hasSpouseAtEnd) {
            if (lastRel === 'h') return baseTitle + '女婿';
            if (lastRel === 'w') return baseTitle + '媳';
          }
          // 无配偶后缀，加性别
          return lastGender === 'male' ? baseTitle : baseTitle + '女';
        }
      }
    }
    
    // ========== 模式 0d：姻亲系列（姐妹/女儿的丈夫的亲属）==========
    // 处理：姐姐/妹妹/女儿的丈夫的爸爸/妈妈/哥哥/弟弟/子女等
    // 关系链：os/ls/d, h, ...
    if (chain.length >= 2 && (chain[0] === 'os' || chain[0] === 'ls' || chain[0] === 'd') && chain[1] === 'h') {
      var sibRel = chain[0]; // os/ls/d
      var afterHusbandChain = chain.slice(2); // 去掉 [sib, h] 后的关系链
      var isElderSister = (chain[0] === 'os'); // 姐姐
      var isYoungerSister = (chain[0] === 'ls'); // 妹妹
      var isDaughter = (chain[0] === 'd'); // 女儿
      
      // 女儿的丈夫的亲属：亲家系列
      if (isDaughter) {
        // 女儿的丈夫的爸爸：亲家公
        if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'f') {
          return '亲家公';
        }
        // 女儿的丈夫的妈妈：亲家母
        if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'm') {
          return '亲家母';
        }
        // 女儿的丈夫的爸爸的爸爸：亲家爷爷/姻伯祖父
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f' && afterHusbandChain[1] === 'f') {
          return '亲家爷爷';
        }
        // 女儿的丈夫的哥哥：姻侄
        if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'ob') {
          return '姻侄';
        }
        // 女儿的丈夫的哥哥的妻子：姻侄媳
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'ob' && afterHusbandChain[1] === 'w') {
          return '姻侄媳';
        }
        // 女儿的丈夫的姐姐：姻侄女
        if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'os') {
          return '姻侄女';
        }
        // 女儿的丈夫的姐姐的丈夫：姻侄女婿
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'os' && afterHusbandChain[1] === 'h') {
          return '姻侄女婿';
        }
        // 女儿的丈夫的姐姐的儿子：姻侄外孙
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'os' && afterHusbandChain[1] === 's') {
          return '姻侄外孙';
        }
        // 女儿的丈夫的姐姐的女儿：姻侄外孙女
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'os' && afterHusbandChain[1] === 'd') {
          return '姻侄外孙女';
        }
        // 女儿的丈夫的哥哥的儿子：姻侄孙
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'ob' && afterHusbandChain[1] === 's') {
          return '姻侄孙';
        }
      }
      
      // 姐妹的丈夫的子女：姻侄/姻侄女
      if (afterHusbandChain.length === 1) {
        if (afterHusbandChain[0] === 's') return '姻侄';
        if (afterHusbandChain[0] === 'd') return '姻侄女';
      }
      
      // 姐妹的丈夫的爸爸：姻伯
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'f') {
        return '姻伯';
      }
      
      // 姐妹的丈夫的妈妈：姻伯母
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'm') {
        return '姻伯母';
      }
      
      // 姐妹的丈夫的爸爸的爸爸：姻爷爷
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f' && afterHusbandChain[1] === 'f') {
        return '姻爷爷';
      }
      
      // 姐妹的丈夫的爸爸的妈妈：姻奶奶
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f' && afterHusbandChain[1] === 'm') {
        return '姻奶奶';
      }
      
      // 姐妹的丈夫的哥哥/弟弟/姐姐/妹妹：姻兄/姻弟/姻姐/姻妹
      if (afterHusbandChain.length === 1) {
        if (afterHusbandChain[0] === 'ob') return '姻兄';
        if (afterHusbandChain[0] === 'lb') return '姻弟';
        if (afterHusbandChain[0] === 'os') return '姻姐';
        if (afterHusbandChain[0] === 'ls') return '姻妹';
      }
      
      // 姐妹的丈夫的姐姐的丈夫：姻姐夫
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'os' && afterHusbandChain[1] === 'h') {
        return '姻姐夫';
      }
      
      // 姐妹的丈夫的姐姐的子女：姻外甥/姻外甥女
      if (afterHusbandChain.length >= 2 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls')) {
        if (afterHusbandChain[1] === 's') return '姻外甥';
        if (afterHusbandChain[1] === 'd') return '姻外甥女';
      }
      
      // 姐妹的丈夫的哥哥的妻子：姻兄媳
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'ob' && afterHusbandChain[1] === 'w') {
        return '姻兄媳';
      }
      
      // 姐妹的丈夫的哥哥的子女：姻外甥/姻外甥女
      if (afterHusbandChain.length >= 2 && afterHusbandChain[0] === 'ob') {
        if (afterHusbandChain[1] === 's') return '姻外甥';
        if (afterHusbandChain[1] === 'd') return '姻外甥女';
      }
    }
    
    // ========== 模式 0e：儿子的妻子的亲属系列 ==========
    // 处理：儿子的妻子的爸爸/妈妈/哥哥/姐姐/子女等
    // 关系链：s, w, ...
    if (chain.length >= 2 && chain[0] === 's' && chain[1] === 'w') {
      var afterWifeChain = chain.slice(2); // 去掉 [s, w] 后的关系链
      
      // 儿子的妻子的爸爸：亲家公
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'f') {
        return '亲家公';
      }
      
      // 儿子的妻子的妈妈：亲家母
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'm') {
        return '亲家母';
      }
      
      // 儿子的妻子的姐姐/妹妹：姻侄女/姻侄妹
      if (afterWifeChain.length === 1 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls')) {
        return '姻侄女';
      }
      
      // 儿子的妻子的姐姐的丈夫：姻侄女婿
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 'h') {
        return '姻侄女婿';
      }
      
      // 儿子的妻子的姐姐/妹妹的儿子：姻侄孙/姻侄外孙
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 's') {
        return '姻侄孙';
      }
      
      // 儿子的妻子的姐姐/妹妹的女儿：姻侄孙女/姻侄外孙女
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 'd') {
        return '姻侄孙女';
      }
      
      // 儿子的妻子的姐姐的儿子的妻子：姻侄孙媳
      if (afterWifeChain.length === 3 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 's' && afterWifeChain[2] === 'w') {
        return '姻侄孙媳';
      }
      
      // 儿子的妻子的姐姐的儿子的女儿的儿子的儿子：姻侄昆孙
      if (afterWifeChain.length >= 4 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 's') {
        return '姻侄昆孙';
      }
    }
    
        // ========== 模式 0e-1：妻子的父祖系列 ==========
    // 处理：妻子的爸爸/妈妈/爷爷/奶奶
    // 关系链：w, f/m, ...
    if (chain.length >= 2 && chain[0] === 'w' && (chain[1] === 'f' || chain[1] === 'm')) {
      var afterWifeFatherChain = chain.slice(2); // 去掉 [w, f/m] 后的关系链
      
      // 妻子的爸爸：岳父
      if (afterWifeFatherChain.length === 0 && chain[1] === 'f') {
        return '岳父';
      }
      // 妻子的妈妈：岳母
      if (afterWifeFatherChain.length === 0 && chain[1] === 'm') {
        return '岳母';
      }
      // 妻子的爸爸的爸爸：爷爷
      if (afterWifeFatherChain.length === 1 && afterWifeFatherChain[0] === 'f' && chain[1] === 'f') {
        return '爷爷';
      }
      // 妻子的爸爸的妈妈：奶奶
      if (afterWifeFatherChain.length === 1 && afterWifeFatherChain[0] === 'm' && chain[1] === 'f') {
        return '奶奶';
      }
      // 妻子的爸爸的爸爸的爸爸：表曾祖父
      if (afterWifeFatherChain.length === 2 && afterWifeFatherChain[0] === 'f' && afterWifeFatherChain[1] === 'f' && chain[1] === 'f') {
        return '表曾祖父';
      }
      // 妻子的爸爸的爸爸的妈妈：表曾祖母
      if (afterWifeFatherChain.length === 2 && afterWifeFatherChain[0] === 'f' && afterWifeFatherChain[1] === 'm' && chain[1] === 'f') {
        return '表曾祖母';
      }
      
      // ========== 模式 0e-1a-2：妻子的爸爸的爸爸的兄弟系列 ==========
      // 处理：妻子的爸爸的爸爸的哥哥/弟弟及其后代（关系链：w,f,f,[ob/lb],...）
      if (chain[1] === 'f' && afterWifeFatherChain.length >= 2 && afterWifeFatherChain[0] === 'f' &&
          (afterWifeFatherChain[1] === 'ob' || afterWifeFatherChain[1] === 'lb')) {
        var wifeFatherFatherBrotherRel = afterWifeFatherChain[1]; // ob/lb
        var afterWifeFatherFatherBrotherChain = afterWifeFatherChain.slice(2); // 去掉 [f, ob/lb] 后的关系链
        
        // 妻子的爸爸的爸爸的哥哥：伯祖父
        if (afterWifeFatherFatherBrotherChain.length === 0 && wifeFatherFatherBrotherRel === 'ob') {
          return '伯祖父';
        }
        // 妻子的爸爸的爸爸的弟弟：叔祖父
        if (afterWifeFatherFatherBrotherChain.length === 0 && wifeFatherFatherBrotherRel === 'lb') {
          return '叔祖父';
        }
        
        // 妻子的爸爸的爸爸的兄弟的妻子：伯祖母/叔祖母
        if (afterWifeFatherFatherBrotherChain.length === 1 && afterWifeFatherFatherBrotherChain[0] === 'w') {
          return wifeFatherFatherBrotherRel === 'ob' ? '伯祖母' : '叔祖母';
        }
        
        // 妻子的爸爸的爸爸的兄弟的子女：堂伯父/堂叔父/堂姑母
        if (afterWifeFatherFatherBrotherChain.length === 1) {
          if (afterWifeFatherFatherBrotherChain[0] === 's') {
            return wifeFatherFatherBrotherRel === 'ob' ? '堂伯父' : '堂叔父';
          }
          if (afterWifeFatherFatherBrotherChain[0] === 'd') {
            return '堂姑母';
          }
        }
        
        // 妻子的爸爸的爸爸的兄弟的子女的配偶
        if (afterWifeFatherFatherBrotherChain.length === 2) {
          if (afterWifeFatherFatherBrotherChain[0] === 's' && afterWifeFatherFatherBrotherChain[1] === 'w') {
            return wifeFatherFatherBrotherRel === 'ob' ? '堂伯母' : '堂叔母';
          }
          if (afterWifeFatherFatherBrotherChain[0] === 'd' && afterWifeFatherFatherBrotherChain[1] === 'h') {
            return '堂姑父';
          }
        }
        
        // 妻子的爸爸的爸爸的兄弟的子女的后代（堂兄弟姐妹系列）
        if (afterWifeFatherFatherBrotherChain.length >= 2) {
          var lastGenGender = 'male';
          for (var i = afterWifeFatherFatherBrotherChain.length - 1; i >= 0; i--) {
            if (afterWifeFatherFatherBrotherChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterWifeFatherFatherBrotherChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 堂兄弟的子女 = 堂侄/堂侄女
          if (afterWifeFatherFatherBrotherChain[0] === 's' && afterWifeFatherFatherBrotherChain.length === 2) {
            return lastGenGender === 'male' ? '堂侄' : '堂侄女';
          }
          // 堂姐妹的子女 = 表外甥/表外甥女
          if (afterWifeFatherFatherBrotherChain[0] === 'd' && afterWifeFatherFatherBrotherChain.length === 2) {
            return lastGenGender === 'male' ? '表外甥' : '表外甥女';
          }
        }
      }
      
      // ========== 模式 0e-1b-2：妻子的爸爸的爸爸的姐妹系列 ==========
      // 处理：妻子的爸爸的爸爸的姐姐/妹妹及其后代（关系链：w,f,f,[os/ls],...）
      if (chain[1] === 'f' && afterWifeFatherChain.length >= 2 && afterWifeFatherChain[0] === 'f' &&
          (afterWifeFatherChain[1] === 'os' || afterWifeFatherChain[1] === 'ls')) {
        var wifeFatherFatherSisterRel = afterWifeFatherChain[1]; // os/ls
        var afterWifeFatherFatherSisterChain = afterWifeFatherChain.slice(2); // 去掉 [f, os/ls] 后的关系链
        
        // 妻子的爸爸的爸爸的姐姐/妹妹：姑祖母
        if (afterWifeFatherFatherSisterChain.length === 0) {
          return '姑祖母';
        }
        
        // 妻子的爸爸的爸爸的姐妹的丈夫：姑祖父
        if (afterWifeFatherFatherSisterChain.length === 1 && afterWifeFatherFatherSisterChain[0] === 'h') {
          return '姑祖父';
        }
        
        // 妻子的爸爸的爸爸的姐妹的子女：表伯父/表姑母
        if (afterWifeFatherFatherSisterChain.length === 1) {
          if (afterWifeFatherFatherSisterChain[0] === 's') {
            return '表伯父';
          }
          if (afterWifeFatherFatherSisterChain[0] === 'd') {
            return '表姑母';
          }
        }
        
        // 妻子的爸爸的爸爸的姐妹的子女的配偶
        if (afterWifeFatherFatherSisterChain.length === 2) {
          if (afterWifeFatherFatherSisterChain[0] === 's' && afterWifeFatherFatherSisterChain[1] === 'w') {
            return '表伯母';
          }
          if (afterWifeFatherFatherSisterChain[0] === 'd' && afterWifeFatherFatherSisterChain[1] === 'h') {
            return '表姑父';
          }
        }
        
        // 妻子的爸爸的爸爸的姐妹的子女的后代（表兄弟姐妹系列）
        if (afterWifeFatherFatherSisterChain.length >= 2) {
          var lastGenGender = 'male';
          for (var i = afterWifeFatherFatherSisterChain.length - 1; i >= 0; i--) {
            if (afterWifeFatherFatherSisterChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterWifeFatherFatherSisterChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 表兄弟的子女 = 表侄/表侄女
          if (afterWifeFatherFatherSisterChain[0] === 's' && afterWifeFatherFatherSisterChain.length === 2) {
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          // 表姐妹的子女 = 表外甥/表外甥女
          if (afterWifeFatherFatherSisterChain[0] === 'd' && afterWifeFatherFatherSisterChain.length === 2) {
            return lastGenGender === 'male' ? '表外甥' : '表外甥女';
          }
        }
      }
      
      // ========== 模式 0e-1a：妻子的爸爸的兄弟系列 ==========
      // 处理：妻子的爸爸的哥哥/弟弟及其后代（仅当 chain[1] === 'f' 时）
      if (chain[1] === 'f' && afterWifeFatherChain.length >= 1 && (afterWifeFatherChain[0] === 'ob' || afterWifeFatherChain[0] === 'lb')) {
        var wifeFatherBrotherRel = afterWifeFatherChain[0]; // ob/lb
        var afterWifeFatherBrotherChain = afterWifeFatherChain.slice(1); // 去掉 [ob/lb] 后的关系链
        
        // 妻子的爸爸的哥哥：伯伯
        if (afterWifeFatherBrotherChain.length === 0 && wifeFatherBrotherRel === 'ob') {
          return '伯伯';
        }
        // 妻子的爸爸的弟弟：叔叔
        if (afterWifeFatherBrotherChain.length === 0 && wifeFatherBrotherRel === 'lb') {
          return '叔叔';
        }
        
        // 妻子的爸爸的兄弟的妻子：伯母/婶婶
        if (afterWifeFatherBrotherChain.length === 1 && afterWifeFatherBrotherChain[0] === 'w') {
          return wifeFatherBrotherRel === 'ob' ? '伯母' : '婶婶';
        }
        
        // 妻子的爸爸的兄弟的子女：堂兄弟/堂姐妹
        if (afterWifeFatherBrotherChain.length === 1) {
          if (afterWifeFatherBrotherChain[0] === 's') return '堂兄弟';
          if (afterWifeFatherBrotherChain[0] === 'd') return '堂姐妹';
        }
        
        // 妻子的爸爸的兄弟的子女的配偶
        if (afterWifeFatherBrotherChain.length === 2) {
          if (afterWifeFatherBrotherChain[0] === 's' && afterWifeFatherBrotherChain[1] === 'w') {
            return '堂兄弟媳';
          }
          if (afterWifeFatherBrotherChain[0] === 'd' && afterWifeFatherBrotherChain[1] === 'h') {
            return '堂姐妹夫';
          }
        }
        
        // 妻子的爸爸的兄弟的子女的后代
        if (afterWifeFatherBrotherChain.length >= 2) {
          var lastGenGender = 'male';
          for (var i = afterWifeFatherBrotherChain.length - 1; i >= 0; i--) {
            if (afterWifeFatherBrotherChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterWifeFatherBrotherChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 堂兄弟的子女 = 堂侄/堂侄女
          if (afterWifeFatherBrotherChain[0] === 's' && afterWifeFatherBrotherChain.length === 2) {
            return lastGenGender === 'male' ? '堂侄' : '堂侄女';
          }
          // 堂姐妹的子女 = 堂外甥/堂外甥女（修复：不是表外甥/表外甥女）
          if (afterWifeFatherBrotherChain[0] === 'd' && afterWifeFatherBrotherChain.length === 2) {
            return lastGenGender === 'male' ? '堂外甥' : '堂外甥女';
          }
          // 堂兄弟的儿子的女儿的丈夫 = 堂侄女婿
          if (afterWifeFatherBrotherChain.length === 3 && afterWifeFatherBrotherChain[0] === 's' && 
              afterWifeFatherBrotherChain[1] === 'd' && afterWifeFatherBrotherChain[2] === 'h') {
            return '堂侄女婿';
          }
          // 堂姐妹的女儿的丈夫 = 堂外甥女婿
          if (afterWifeFatherBrotherChain.length === 3 && afterWifeFatherBrotherChain[0] === 'd' && 
              afterWifeFatherBrotherChain[1] === 'd' && afterWifeFatherBrotherChain[2] === 'h') {
            return '堂外甥女婿';
          }
          // 堂兄弟的孙子女 = 堂侄孙/堂侄孙女
          if (afterWifeFatherBrotherChain[0] === 's' && afterWifeFatherBrotherChain.length === 3) {
            return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
          }
          // 堂姐妹的孙子女 = 堂外甥孙/堂外甥孙女
          if (afterWifeFatherBrotherChain[0] === 'd' && afterWifeFatherBrotherChain.length === 3) {
            return lastGenGender === 'male' ? '堂外甥孙' : '堂外甥孙女';
          }
        }
      }
      
      // ========== 模式 0e-1b：妻子的爸爸的姐妹系列 ==========
      // 处理：妻子的爸爸的姐姐/妹妹及其后代（仅当 chain[1] === 'f' 时）
      // 关系链：w, f, [os/ls], ...
      if (chain[1] === 'f' && afterWifeFatherChain.length >= 1 && 
          (afterWifeFatherChain[0] === 'os' || afterWifeFatherChain[0] === 'ls')) {
        var wifeFatherSisterRel = afterWifeFatherChain[0]; // os/ls
        var afterWifeFatherSisterChain = afterWifeFatherChain.slice(1); // 去掉 [os/ls] 后的关系链
        
        // 妻子的爸爸的姐姐：姑母
        if (afterWifeFatherSisterChain.length === 0 && wifeFatherSisterRel === 'os') {
          return '姑母';
        }
        // 妻子的爸爸的妹妹：姑母
        if (afterWifeFatherSisterChain.length === 0 && wifeFatherSisterRel === 'ls') {
          return '姑母';
        }
        
        // 妻子的爸爸的姐妹的丈夫：姑父
        if (afterWifeFatherSisterChain.length === 1 && afterWifeFatherSisterChain[0] === 'h') {
          return '姑父';
        }
        
        // 妻子的爸爸的姐妹的子女：表兄弟/表姐妹
        if (afterWifeFatherSisterChain.length === 1) {
          if (afterWifeFatherSisterChain[0] === 's') return '表兄弟';
          if (afterWifeFatherSisterChain[0] === 'd') return '表姐妹';
        }
        
        // 妻子的爸爸的姐妹的子女的配偶
        if (afterWifeFatherSisterChain.length === 2) {
          if (afterWifeFatherSisterChain[0] === 's' && afterWifeFatherSisterChain[1] === 'w') {
            return '表兄弟媳';
          }
          if (afterWifeFatherSisterChain[0] === 'd' && afterWifeFatherSisterChain[1] === 'h') {
            return '表姐妹夫';
          }
        }
        
        // 妻子的爸爸的姐妹的子女的后代
        if (afterWifeFatherSisterChain.length >= 2) {
          var lastGenGender = 'male';
          for (var i = afterWifeFatherSisterChain.length - 1; i >= 0; i--) {
            if (afterWifeFatherSisterChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterWifeFatherSisterChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 表兄弟的子女 = 表侄/表侄女
          if (afterWifeFatherSisterChain[0] === 's' && afterWifeFatherSisterChain.length === 2) {
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          // 表姐妹的子女 = 表外甥/表外甥女
          if (afterWifeFatherSisterChain[0] === 'd' && afterWifeFatherSisterChain.length === 2) {
            return lastGenGender === 'male' ? '表外甥' : '表外甥女';
          }
        }
      }
      
      // ========== 模式 0e-1c：妻子的妈妈的爸爸系列 ==========
      // 处理：妻子的妈妈的爸爸/妈妈及其后代
      if (chain[1] === 'm') {
        var afterWifeMotherChain = chain.slice(2); // 去掉 [w, m] 后的关系链
        
        // 妻子的妈妈的爸爸：外公
        if (afterWifeMotherChain.length === 1 && afterWifeMotherChain[0] === 'f') {
          return '外公';
        }
        // 妻子的妈妈的妈妈：外婆
        if (afterWifeMotherChain.length === 1 && afterWifeMotherChain[0] === 'm') {
          return '外婆';
        }
        // 妻子的妈妈的爸爸的爸爸：曾祖父
        if (afterWifeMotherChain.length === 2 && afterWifeMotherChain[0] === 'f' && afterWifeMotherChain[1] === 'f') {
          return '曾祖父';
        }
        // 妻子的妈妈的爸爸的妈妈：曾祖母
        if (afterWifeMotherChain.length === 2 && afterWifeMotherChain[0] === 'f' && afterWifeMotherChain[1] === 'm') {
          return '曾祖母';
        }
        
        // ========== 模式 0e-1b-1：妻子的妈妈的兄弟姐妹系列（舅舅/姨妈） ==========
        // 处理：妻子的妈妈的哥哥/弟弟/姐姐/妹妹及其后代
        if (afterWifeMotherChain.length >= 1 && 
            (afterWifeMotherChain[0] === 'ob' || afterWifeMotherChain[0] === 'lb' || 
             afterWifeMotherChain[0] === 'os' || afterWifeMotherChain[0] === 'ls')) {
          var wifeMotherSibRel = afterWifeMotherChain[0]; // ob/lb/os/ls
          var afterWifeMotherSibChain = afterWifeMotherChain.slice(1); // 去掉 [ob/lb/os/ls] 后的关系链
          
          // 妻子的妈妈的哥哥/弟弟：舅舅
          if (afterWifeMotherSibChain.length === 0 && (wifeMotherSibRel === 'ob' || wifeMotherSibRel === 'lb')) {
            return '舅舅';
          }
          // 妻子的妈妈的姐姐/妹妹：姨妈
          if (afterWifeMotherSibChain.length === 0 && (wifeMotherSibRel === 'os' || wifeMotherSibRel === 'ls')) {
            return '姨妈';
          }
          
          // 妻子的妈妈的哥哥/弟弟的妻子：舅母
          if (afterWifeMotherSibChain.length === 1 && afterWifeMotherSibChain[0] === 'w' && 
              (wifeMotherSibRel === 'ob' || wifeMotherSibRel === 'lb')) {
            return '舅母';
          }
          // 妻子的妈妈的姐姐/妹妹的丈夫：姨父
          if (afterWifeMotherSibChain.length === 1 && afterWifeMotherSibChain[0] === 'h' && 
              (wifeMotherSibRel === 'os' || wifeMotherSibRel === 'ls')) {
            return '姨父';
          }
          
          // 妻子的妈妈的兄弟姐妹的子女：表兄弟/表姐妹
          if (afterWifeMotherSibChain.length >= 1 && 
              (afterWifeMotherSibChain[0] === 's' || afterWifeMotherSibChain[0] === 'd')) {
            var cousinChildRel = afterWifeMotherSibChain[0]; // s/d
            var afterCousinChildChain = afterWifeMotherSibChain.slice(1); // 去掉 [s/d] 后的关系链
            
            // 表兄弟/表姐妹（无后代）
            if (afterCousinChildChain.length === 0) {
              if (cousinChildRel === 's') return '表兄弟';
              if (cousinChildRel === 'd') return '表姐妹';
            }
            
            // 表兄弟的子女：表侄/表侄女
            if (afterCousinChildChain.length === 1 && cousinChildRel === 's') {
              if (afterCousinChildChain[0] === 's') return '表侄';
              if (afterCousinChildChain[0] === 'd') return '表侄女';
            }
            
            // 表姐妹的子女：表外甥/表外甥女
            if (afterCousinChildChain.length === 1 && cousinChildRel === 'd') {
              if (afterCousinChildChain[0] === 's') return '表外甥';
              if (afterCousinChildChain[0] === 'd') return '表外甥女';
            }
            
            // 表兄弟媳：[s, w] - 表兄弟的妻子
            if (afterCousinChildChain.length === 1 && cousinChildRel === 's' && afterCousinChildChain[0] === 'w') {
              return '表兄弟媳';
            }
            
            // 表姐妹夫：[d, h] - 表姐妹的丈夫
            if (afterCousinChildChain.length === 1 && cousinChildRel === 'd' && afterCousinChildChain[0] === 'h') {
              return '表姐妹夫';
            }
          }
        }
        
        // 妻子的妈妈的爸爸的兄弟（外叔祖父/外伯祖父系列）
        if (afterWifeMotherChain.length >= 2 && afterWifeMotherChain[0] === 'f' && 
            (afterWifeMotherChain[1] === 'ob' || afterWifeMotherChain[1] === 'lb')) {
          var wifeMomGreatUncleRel = afterWifeMotherChain[1]; // ob/lb
          var afterWifeMomGreatUncleChain = afterWifeMotherChain.slice(2); // 去掉 [f, ob/lb] 后的关系链
          
          // 妻子的妈妈的爸爸的哥哥：外伯祖父
          if (afterWifeMomGreatUncleChain.length === 0 && wifeMomGreatUncleRel === 'ob') {
            return '外伯祖父';
          }
          // 妻子的妈妈的爸爸的弟弟：外叔祖父
          if (afterWifeMomGreatUncleChain.length === 0 && wifeMomGreatUncleRel === 'lb') {
            return '外叔祖父';
          }
          
          // 妻子的妈妈的爸爸的兄弟的妻子：外伯祖母/外叔祖母
          if (afterWifeMomGreatUncleChain.length === 1 && afterWifeMomGreatUncleChain[0] === 'w') {
            return wifeMomGreatUncleRel === 'ob' ? '外伯祖母' : '外叔祖母';
          }
          
          // 妻子的妈妈的爸爸的兄弟的子女：表舅父/表姨母
          if (afterWifeMomGreatUncleChain.length === 1) {
            if (afterWifeMomGreatUncleChain[0] === 's') {
              return '表舅父';
            }
            if (afterWifeMomGreatUncleChain[0] === 'd') {
              return '表姨母';
            }
          }
          
          // 妻子的妈妈的爸爸的兄弟的子女的配偶
          if (afterWifeMomGreatUncleChain.length === 2) {
            if (afterWifeMomGreatUncleChain[0] === 's' && afterWifeMomGreatUncleChain[1] === 'w') {
              return '表舅母';
            }
            if (afterWifeMomGreatUncleChain[0] === 'd' && afterWifeMomGreatUncleChain[1] === 'h') {
              return '表姨父';
            }
          }
          
          // 妻子的妈妈的爸爸的兄弟的子女的后代（表兄弟姐妹系列）
          // 关系链长度 2：[s,s]/[s,d]/[d,s]/[d,d] = 表兄弟/表姐妹
          // 关系链长度 3：[s,s,s]/[s,s,d]/[d,s,s]/[d,s,w]/[s,d,h] = 表侄/表侄女/表兄弟媳/表姐妹夫
          // 关系链长度 4：[s,s,s,s]/... = 表侄孙/表侄孙女
          if (afterWifeMomGreatUncleChain.length >= 2) {
            var lastGenGender = 'male';
            for (var i = afterWifeMomGreatUncleChain.length - 1; i >= 0; i--) {
              if (afterWifeMomGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
              else if (afterWifeMomGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
            }
            
            // 表姐妹夫：[s, d, h] - 表姐妹的丈夫
            if (afterWifeMomGreatUncleChain.length === 3 && 
                afterWifeMomGreatUncleChain[0] === 's' && 
                afterWifeMomGreatUncleChain[1] === 'd' && 
                afterWifeMomGreatUncleChain[2] === 'h') {
              return '表姐妹夫';
            }
            
            // 表姐妹夫：[d, d, h] - 表姨母的女儿的丈夫
            if (afterWifeMomGreatUncleChain.length === 3 && 
                afterWifeMomGreatUncleChain[0] === 'd' && 
                afterWifeMomGreatUncleChain[1] === 'd' && 
                afterWifeMomGreatUncleChain[2] === 'h') {
              return '表姐妹夫';
            }
            
            // 表兄弟媳：[d, s, w] - 表兄弟的妻子
            if (afterWifeMomGreatUncleChain.length === 3 && 
                afterWifeMomGreatUncleChain[0] === 'd' && 
                afterWifeMomGreatUncleChain[1] === 's' && 
                afterWifeMomGreatUncleChain[2] === 'w') {
              return '表兄弟媳';
            }
            
            if (afterWifeMomGreatUncleChain.length === 2) {
              return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
            }
            if (afterWifeMomGreatUncleChain.length === 3) {
              return lastGenGender === 'male' ? '表侄' : '表侄女';
            }
            if (afterWifeMomGreatUncleChain.length === 4) {
              return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
            }
          }
        }
      }
    }
    
    // ========== 模式 0e：妻子的兄弟姐妹系列 ==========
    // 处理：妻子的姐姐/妹妹/哥哥/弟弟及其子女（不含配偶，配偶由模式 0f 处理）
    // 关系链：w, os/ls/ob/lb, ...
    if (chain.length >= 2 && chain[0] === 'w' && (chain[1] === 'os' || chain[1] === 'ls' || chain[1] === 'ob' || chain[1] === 'lb')) {
      var sibRel = chain[1]; // os/ls/ob/lb
      var afterSibChain = chain.slice(2); // 去掉 [w, sib] 后的关系链
      
      // 如果 afterSibChain 以 h 开始（妻子的姐妹的丈夫），让模式 0f 处理
      if (afterSibChain.length > 0 && afterSibChain[0] === 'h') {
        // 不处理，让模式 0f 处理
      } else {
      
      // 妻子的姐姐/妹妹/哥哥/弟弟
      if (afterSibChain.length === 0) {
        if (sibRel === 'os') return '姐姐';
        if (sibRel === 'ls') return '妹妹';
        if (sibRel === 'ob') return '哥哥'; // 妻子的哥哥=哥哥
        if (sibRel === 'lb') return '弟弟'; // 妻子的弟弟=弟弟
      }
      
      // 妻子的姐姐/妹妹/哥哥/弟弟的配偶
      if (afterSibChain.length === 1 && afterSibChain[0] === 'w') {
        if (sibRel === 'os') return '嫂子'; // 妻子的姐姐的妻子（女同）
        if (sibRel === 'ls') return '弟媳'; // 妻子的妹妹的妻子（女同）
        if (sibRel === 'ob') return '嫂子'; // 妻子的哥哥的妻子
        if (sibRel === 'lb') return '弟媳'; // 妻子的弟弟的妻子
      }
      
      // 妻子的姐姐/妹妹的丈夫
      if (afterSibChain.length === 1 && afterSibChain[0] === 'h') {
        if (sibRel === 'os') return '姐夫';
        if (sibRel === 'ls') return '妹夫';
      }
      
      // 妻子的姐妹的儿子/女儿：外甥/外甥女
      if (afterSibChain.length === 1 && (afterSibChain[0] === 's' || afterSibChain[0] === 'd')) {
        if (afterSibChain[0] === 's') return '外甥';
        if (afterSibChain[0] === 'd') return '外甥女';
      }
      
      // 妻子的兄弟的儿子/女儿：内侄/内侄女（从夫称）
      if (afterSibChain.length === 1 && (sibRel === 'ob' || sibRel === 'lb') && (afterSibChain[0] === 's' || afterSibChain[0] === 'd')) {
        if (afterSibChain[0] === 's') return '内侄';
        if (afterSibChain[0] === 'd') return '内侄女';
      }
      
      // 妻子的姐妹的孙子/孙女：外甥孙/外甥孙女
      if (afterSibChain.length === 2 && (afterSibChain[0] === 's' || afterSibChain[0] === 'd') && (afterSibChain[1] === 's' || afterSibChain[1] === 'd')) {
        var grandchildRel = afterSibChain[1];
        if (grandchildRel === 's') return '外甥孙';
        if (grandchildRel === 'd') return '外甥孙女';
      }
      
      // 妻子的姐妹的曾孙/曾孙女：外甥曾孙/外甥曾孙女（3 代）
      // 检查：前 2 代是 s/d（任意组合），第 3 代决定性别
      if (afterSibChain.length === 3 && 
          (afterSibChain[0] === 's' || afterSibChain[0] === 'd') && 
          (afterSibChain[1] === 's' || afterSibChain[1] === 'd') && 
          (afterSibChain[2] === 's' || afterSibChain[2] === 'd')) {
        var greatGrandchildRel = afterSibChain[2];
        if (greatGrandchildRel === 's') return '外甥曾孙';
        if (greatGrandchildRel === 'd') return '外甥曾孙女';
      }
      
      // 妻子的姐妹的玄孙/玄孙女：外甥玄孙/外甥玄孙女（4 代）
      // 检查：前 3 代是 s/d（任意组合），第 4 代决定性别
      if (afterSibChain.length === 4 && 
          (afterSibChain[0] === 's' || afterSibChain[0] === 'd') && 
          (afterSibChain[1] === 's' || afterSibChain[1] === 'd') && 
          (afterSibChain[2] === 's' || afterSibChain[2] === 'd') && 
          (afterSibChain[3] === 's' || afterSibChain[3] === 'd')) {
        var greatGreatGrandchildRel = afterSibChain[3];
        if (greatGreatGrandchildRel === 's') return '外甥玄孙';
        if (greatGreatGrandchildRel === 'd') return '外甥玄孙女';
      }
      
      // 妻子的姐妹的来孙/来孙女：外甥来孙/外甥来孙女（5 代）
      // 检查：前 4 代是 s/d（任意组合），第 5 代决定性别
      if (afterSibChain.length === 5 && 
          (afterSibChain[0] === 's' || afterSibChain[0] === 'd') && 
          (afterSibChain[1] === 's' || afterSibChain[1] === 'd') && 
          (afterSibChain[2] === 's' || afterSibChain[2] === 'd') && 
          (afterSibChain[3] === 's' || afterSibChain[3] === 'd') && 
          (afterSibChain[4] === 's' || afterSibChain[4] === 'd')) {
        var comeGrandchildRel = afterSibChain[4];
        if (comeGrandchildRel === 's') return '外甥来孙';
        if (comeGrandchildRel === 'd') return '外甥来孙女';
      }
      } // 结束 else 块（排除 h 的情况）
    }
    
    // ========== 模式 0e-2：妻子的兄弟的妻子的亲属系列 ==========
    // 处理：妻子的哥哥/弟弟的妻子的爸爸/妈妈/哥哥/姐姐/弟弟/妹妹及其子女
    // 关系链：w, ob/lb, w, ...
    if (chain.length >= 3 && chain[0] === 'w' && (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 'w') {
      var afterWifeChain = chain.slice(3); // 去掉 [w, brother, w] 后的关系链
      
      // 妻子的兄弟的妻子的爸爸：姻伯
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'f') {
        return '姻伯';
      }
      
      // 妻子的兄弟的妻子的妈妈：姻伯母
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'm') {
        return '姻伯母';
      }
      
      // 妻子的兄弟的妻子的姐姐：姻姐
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'os') {
        return '姻姐';
      }
      
      // 妻子的兄弟的妻子的妹妹：姻妹
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'ls') {
        return '姻妹';
      }
      
      // 妻子的兄弟的妻子的哥哥：姻兄
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'ob') {
        return '姻兄';
      }
      
      // 妻子的兄弟的妻子的弟弟：姻弟
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'lb') {
        return '姻弟';
      }
      
      // 妻子的兄弟的妻子的儿子：姻侄
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 's') {
        return '姻侄';
      }
      
      // 妻子的兄弟的妻子的女儿：姻侄女
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'd') {
        return '姻侄女';
      }
      
      // ========== 妻子的兄弟的妻子的兄弟姐妹的后代系列 ==========
      // 关系链：w, ob/lb, w, os/ls, ...
      if (afterWifeChain.length >= 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls')) {
        var afterSibChain = afterWifeChain.slice(1); // 去掉 [os/ls] 后的关系链
        
        // 妻子的兄弟的妻子的姐姐的丈夫：姻姐夫
        // 妻子的兄弟的妻子的妹妹的丈夫：姻妹夫
        if (afterSibChain.length === 1 && afterSibChain[0] === 'h') {
          if (afterWifeChain[0] === 'os') return '姻姐夫';
          if (afterWifeChain[0] === 'ls') return '姻妹夫';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的儿子：姻侄
        if (afterSibChain.length === 1 && afterSibChain[0] === 's') {
          return '姻侄';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿：姻侄女
        if (afterSibChain.length === 1 && afterSibChain[0] === 'd') {
          return '姻侄女';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的丈夫：姻侄女婿
        if (afterSibChain.length === 2 && afterSibChain[0] === 'd' && afterSibChain[1] === 'h') {
          return '姻侄女婿';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的儿子：姻侄孙
        if (afterSibChain.length === 2 && afterSibChain[0] === 'd' && afterSibChain[1] === 's') {
          return '姻侄孙';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的女儿：姻侄孙女
        if (afterSibChain.length === 2 && afterSibChain[0] === 'd' && afterSibChain[1] === 'd') {
          return '姻侄孙女';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的儿子的儿子：姻侄孙
        if (afterSibChain.length === 2 && afterSibChain[0] === 's' && afterSibChain[1] === 's') {
          return '姻侄孙';
        }
        
      // 妻子的兄弟的妻子的姐姐/妹妹的儿子的女儿：姻侄孙女
      if (afterSibChain.length === 2 && afterSibChain[0] === 's' && afterSibChain[1] === 'd') {
        return '姻侄孙女';
      }
      
      // 妻子的兄弟的妻子的姐姐/妹妹的儿子的妻子：姻侄媳
      if (afterSibChain.length === 2 && afterSibChain[0] === 's' && afterSibChain[1] === 'w') {
        return '姻侄媳';
      }
      
      // 妻子的兄弟的妻子的姐姐/妹妹的儿子的女儿的丈夫：姻侄孙女婿
      if (afterSibChain.length === 3 && afterSibChain[0] === 's' && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
        return '姻侄孙女婿';
      }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的儿子的儿子：姻侄曾孙
        if (afterSibChain.length === 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's' && afterSibChain[2] === 's') {
          return '姻侄曾孙';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的儿子的女儿：姻侄曾孙女
        if (afterSibChain.length === 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's' && afterSibChain[2] === 'd') {
          return '姻侄曾孙女';
        }
      }
    }
    
    // ========== 模式 0f：妻子的姐妹的丈夫的亲属系列 ==========
    // 处理：妻子的姐姐/妹妹的丈夫及其爸爸/妈妈/哥哥/姐姐/子女等
    // 关系链：w, os/ls, h, ...
    if (chain.length >= 3 && chain[0] === 'w' && (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 'h') {
      var afterHusbandChain = chain.slice(3); // 去掉 [w, sib, h] 后的关系链
      var isElderSister = (chain[1] === 'os'); // 妻子的姐姐
      var isYoungerSister = (chain[1] === 'ls'); // 妻子的妹妹
      
      // 妻子的姐妹的丈夫：姐夫/妹夫
      if (afterHusbandChain.length === 0) {
        if (isElderSister) return '姐夫';
        if (isYoungerSister) return '妹夫';
      }
      
      // 妻子的姐妹的丈夫的爸爸：姻伯
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'f') {
        return '姻伯';
      }
      
      // 妻子的姐妹的丈夫的妈妈：姻伯母
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'm') {
        return '姻伯母';
      }
      
      // 妻子的姐妹的丈夫的爸爸的爸爸：姻爷爷
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f' && afterHusbandChain[1] === 'f') {
        return '姻爷爷';
      }
      
      // 妻子的姐妹的丈夫的哥哥/弟弟：姻兄/姻弟
      if (afterHusbandChain.length === 1 && (afterHusbandChain[0] === 'ob' || afterHusbandChain[0] === 'lb')) {
        return '姻兄';
      }
      
      // 妻子的姐妹的丈夫的哥哥的妻子：姻兄媳
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'ob' || afterHusbandChain[0] === 'lb') && afterHusbandChain[1] === 'w') {
        return '姻兄媳';
      }
      
      // 妻子的姐妹的丈夫的姐姐/妹妹：姻姐/姻妹
      if (afterHusbandChain.length === 1 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls')) {
        return '姻姐';
      }
      
      // 妻子的姐妹的丈夫的姐姐的丈夫：姻姐夫
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls') && afterHusbandChain[1] === 'h') {
        return '姻姐夫';
      }
      
      // 妻子的姐妹的丈夫的姐姐/妹妹的儿子：姻外甥
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls') && afterHusbandChain[1] === 's') {
        return '姻外甥';
      }
      
      // 妻子的姐妹的丈夫的姐姐/妹妹的女儿：姻外甥女
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls') && afterHusbandChain[1] === 'd') {
        return '姻外甥女';
      }
      
      // 妻子的姐妹的丈夫的兄弟的儿子：姻侄（修复余泽友视角：妻子的妹妹的丈夫的哥哥的儿子）
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'ob' || afterHusbandChain[0] === 'lb') && afterHusbandChain[1] === 's') {
        return '姻侄';
      }
      
      // 妻子的姐妹的丈夫的儿子：姻侄
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 's') {
        return '姻侄';
      }
      
      // 妻子的姐妹的丈夫的女儿：姻侄女
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'd') {
        return '姻侄女';
      }
    }
    
    // ========== 模式 0g：丈夫的兄弟姐妹的妻子的亲属系列 ==========
    // 处理：丈夫的哥哥/弟弟的妻子的爸爸/妈妈/哥哥/姐姐/子女等
    // 关系链：h, ob/lb, w, ...
    if (chain.length >= 3 && chain[0] === 'h' && (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 'w') {
      var afterWifeChain = chain.slice(3); // 去掉 [h, sib, w] 后的关系链
      var isElderBrother = (chain[1] === 'ob'); // 丈夫的哥哥
      var isYoungerBrother = (chain[1] === 'lb'); // 丈夫的弟弟
      
      // 丈夫的兄弟的妻子（afterWifeChain 为空）
      if (afterWifeChain.length === 0) {
        if (isElderBrother) return '嫂子';
        if (isYoungerBrother) return '弟媳';
      }
      
      // 丈夫的兄弟的妻子的爸爸：姻伯
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'f') {
        return '姻伯';
      }
      
      // 丈夫的兄弟的妻子的妈妈：姻伯母
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'm') {
        return '姻伯母';
      }
      
      // 丈夫的兄弟的妻子的姐姐/妹妹：姻姐/姻妹
      if (afterWifeChain.length === 1 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls')) {
        return '姻姐';
      }
      
      // 丈夫的兄弟的妻子的姐姐的丈夫：姻姐夫
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 'h') {
        return '姻姐夫';
      }
      
      // 丈夫的兄弟的妻子的姐姐的儿子：姻外甥
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 's') {
        return '姻外甥';
      }
      
      // 丈夫的兄弟的妻子的姐姐的女儿：姻外甥女
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 'd') {
        return '姻外甥女';
      }
      
      // 丈夫的兄弟的妻子的姐姐/妹妹的儿子/女儿及后代：通用公式计算
      // 基础称谓：genDown=1→外甥/外甥女，2→外甥孙/外甥孙女，3→外甥曾孙/外甥曾孙女，4→外甥玄孙/外甥玄孙女，5→外甥来孙/外甥来孙女
      // 配偶后缀：最后是 h→女婿，w→媳
      if (afterWifeChain.length >= 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && (afterWifeChain[1] === 's' || afterWifeChain[1] === 'd')) {
        var genDown = 0;
        for (var i = 2; i < afterWifeChain.length; i++) {
          if (afterWifeChain[i] === 's' || afterWifeChain[i] === 'd') genDown++;
        }
        // 判断最后一代性别（排除配偶 h/w）
        var lastGender = 'male';
        for (var i = afterWifeChain.length - 1; i >= 2; i--) {
          if (afterWifeChain[i] === 's' || afterWifeChain[i] === 'ob' || afterWifeChain[i] === 'lb') {
            lastGender = 'male'; break;
          } else if (afterWifeChain[i] === 'd' || afterWifeChain[i] === 'os' || afterWifeChain[i] === 'ls') {
            lastGender = 'female'; break;
          }
        }
        // 判断是否有配偶关系（最后一个是 h 或 w）
        var lastRel = afterWifeChain[afterWifeChain.length - 1];
        var hasSpouseAtEnd = (lastRel === 'h' || lastRel === 'w');
        
        // 基础称谓映射（genDown 从 1 开始，因为 afterWifeChain[1]='s/d' 已经是一代）
        var baseTitle = '';
        if (genDown === 0) baseTitle = '姻外甥'; // 只有姐妹的儿子/女儿，无后代
        else if (genDown === 1) baseTitle = '姻外甥孙';
        else if (genDown === 2) baseTitle = '姻外甥曾孙';
        else if (genDown === 3) baseTitle = '姻外甥玄孙';
        else if (genDown === 4) baseTitle = '姻外甥来孙';
        
        if (baseTitle !== '') {
          // 有配偶后缀
          if (hasSpouseAtEnd) {
            if (lastRel === 'h') return baseTitle + '女婿';
            if (lastRel === 'w') return baseTitle + '媳';
          }
          // 无配偶后缀，加性别
          return lastGender === 'male' ? baseTitle : baseTitle + '女';
        }
      }
    }
    
    // ========== 模式 0g-1：妈妈的弟弟的妻子的亲属系列 ==========
    // 处理：妈妈的弟弟的妻子的妈妈/姐姐及其亲属
    // 关系链：m, lb, w, ...
    if (chain.length >= 3 && chain[0] === 'm' && chain[1] === 'lb' && chain[2] === 'w') {
      var afterAuntChain = chain.slice(3); // 去掉 [m, lb, w] 后的关系链
      
      // 妈妈的弟弟的妻子的妈妈：姻外祖母
      if (afterAuntChain.length === 1 && afterAuntChain[0] === 'm') {
        return '姻外祖母';
      }
      
      // 妈妈的弟弟的妻子的爸爸：姻外祖父
      if (afterAuntChain.length === 1 && afterAuntChain[0] === 'f') {
        return '姻外祖父';
      }
      
      // 妈妈的弟弟的妻子的姐姐：姻伯母
      if (afterAuntChain.length === 1 && afterAuntChain[0] === 'os') {
        return '姻伯母';
      }
      
      // ========== 妈妈的弟弟的妻子的姐姐的亲属系列 ==========
      // 关系链：m, lb, w, os, ...
      if (afterAuntChain.length >= 1 && afterAuntChain[0] === 'os') {
        var afterElderSisterChain = afterAuntChain.slice(1); // 去掉 [os] 后的关系链
        
        // 妈妈的弟弟的妻子的姐姐的丈夫：姻伯
        if (afterElderSisterChain.length === 1 && afterElderSisterChain[0] === 'h') {
          return '姻伯';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子：姻兄弟
        if (afterElderSisterChain.length === 1 && afterElderSisterChain[0] === 's') {
          return '姻兄弟';
        }
        
        // 妈妈的弟弟的妻子的姐姐的女儿：姻姐妹
        if (afterElderSisterChain.length === 1 && afterElderSisterChain[0] === 'd') {
          return '姻姐妹';
        }
        
        // 妈妈的弟弟的妻子的姐姐的女儿的丈夫：姻姐妹夫
        if (afterElderSisterChain.length === 2 && afterElderSisterChain[0] === 'd' && afterElderSisterChain[1] === 'h') {
          return '姻姐妹夫';
        }
        
        // 妈妈的弟弟的妻子的姐姐的女儿的儿子：姻侄
        if (afterElderSisterChain.length === 2 && afterElderSisterChain[0] === 'd' && afterElderSisterChain[1] === 's') {
          return '姻侄';
        }
        
        // 妈妈的弟弟的妻子的姐姐的女儿的儿子/女儿的后代系列
        if (afterElderSisterChain.length >= 2 && afterElderSisterChain[0] === 'd') {
          var afterDaughterChain = afterElderSisterChain.slice(1); // 去掉 [d] 后的关系链
          
          // 计算后代代数（排除配偶 h/w）
          var genCount = 0;
          for (var i = 0; i < afterDaughterChain.length; i++) {
            if (afterDaughterChain[i] === 's' || afterDaughterChain[i] === 'd') genCount++;
          }
          
          // 判断最后一代性别
          var lastGender = 'male';
          for (var i = afterDaughterChain.length - 1; i >= 0; i--) {
            if (afterDaughterChain[i] === 's' || afterDaughterChain[i] === 'ob' || afterDaughterChain[i] === 'lb') {
              lastGender = 'male'; break;
            } else if (afterDaughterChain[i] === 'd' || afterDaughterChain[i] === 'os' || afterDaughterChain[i] === 'ls') {
              lastGender = 'female'; break;
            }
          }
          
          // 判断是否有配偶关系
          var lastRel = afterDaughterChain[afterDaughterChain.length - 1];
          var hasSpouseAtEnd = (lastRel === 'h' || lastRel === 'w');
          
          // 基础称谓映射（从姻兄弟的女儿开始算：第 1 代=侄，第 2 代=孙，第 3 代=曾孙...）
          var baseTitle = '';
          if (genCount === 1) baseTitle = '姻侄';
          else if (genCount === 2) baseTitle = '姻孙';
          else if (genCount === 3) baseTitle = '姻曾孙';
          else if (genCount === 4) baseTitle = '姻玄孙';
          else if (genCount === 5) baseTitle = '姻来孙';
          
          if (baseTitle !== '') {
            if (hasSpouseAtEnd) {
              if (lastRel === 'h') return baseTitle + '女婿';
              if (lastRel === 'w') return baseTitle + '媳';
            }
            return lastGender === 'male' ? baseTitle : baseTitle + '女';
          }
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的妻子：姻兄弟媳
        if (afterElderSisterChain.length === 2 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'w') {
          return '姻兄弟媳';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿：姻侄女
        if (afterElderSisterChain.length === 2 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd') {
          return '姻侄女';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿的丈夫：姻侄女婿
        if (afterElderSisterChain.length === 3 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd' && afterElderSisterChain[2] === 'h') {
          return '姻侄女婿';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿的儿子：姻孙
        if (afterElderSisterChain.length === 3 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd' && afterElderSisterChain[2] === 's') {
          return '姻孙';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿的儿子的儿子：姻曾孙
        if (afterElderSisterChain.length === 4 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd' && afterElderSisterChain[2] === 's' && afterElderSisterChain[3] === 's') {
          return '姻曾孙';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿的儿子的儿子的儿子：姻玄孙
        if (afterElderSisterChain.length === 5 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd' && afterElderSisterChain[2] === 's' && afterElderSisterChain[3] === 's' && afterElderSisterChain[4] === 's') {
          return '姻玄孙';
        }
      }
    }
    
    // ========== 模式 0g-2：妈妈的妹妹的丈夫的亲属系列 ==========
    // 处理：妈妈的妹妹的丈夫的哥哥/姐姐及其亲属
    // 关系链：m, ls, h, ...
    if (chain.length >= 3 && chain[0] === 'm' && chain[1] === 'ls' && chain[2] === 'h') {
      var afterUncleChain = chain.slice(3); // 去掉 [m, ls, h] 后的关系链
      
      // 妈妈的妹妹的丈夫的哥哥：姻伯
      if (afterUncleChain.length === 1 && afterUncleChain[0] === 'ob') {
        return '姻伯';
      }
      
      // 妈妈的妹妹的丈夫的哥哥的妻子：姻伯母
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'ob' && afterUncleChain[1] === 'w') {
        return '姻伯母';
      }
      
      // 妈妈的妹妹的丈夫的哥哥的儿子：姻表兄弟
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'ob' && afterUncleChain[1] === 's') {
        return '姻表兄弟';
      }
      
      // 妈妈的妹妹的丈夫的哥哥的女儿：姻表姐妹
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'ob' && afterUncleChain[1] === 'd') {
        return '姻表姐妹';
      }
      
      // 妈妈的妹妹的丈夫的姐姐：姻姑母
      if (afterUncleChain.length === 1 && afterUncleChain[0] === 'os') {
        return '姻姑母';
      }
      
      // 妈妈的妹妹的丈夫的姐姐的丈夫：姻姑父
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'os' && afterUncleChain[1] === 'h') {
        return '姻姑父';
      }
      
      // 妈妈的妹妹的丈夫的姐姐的儿子：姻表兄弟
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'os' && afterUncleChain[1] === 's') {
        return '姻表兄弟';
      }
      
      // 妈妈的妹妹的丈夫的姐姐的女儿：姻表姐妹
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'os' && afterUncleChain[1] === 'd') {
        return '姻表姐妹';
      }
    }
    
    // ========== 模式 0g-3：丈夫的妈妈的亲属系列（女性视角） ==========
    // 处理：丈夫的妈妈的爸爸/妈妈/姐姐/妹妹及其亲属
    // 关系链：h, m, ...
    if (chain.length >= 2 && chain[0] === 'h' && chain[1] === 'm') {
      var afterGrandmaChain = chain.slice(2); // 去掉 [h, m] 后的关系链
      
      // 丈夫的妈妈的爸爸：外公
      if (afterGrandmaChain.length === 1 && afterGrandmaChain[0] === 'f') {
        return '外公';
      }
      
      // 丈夫的妈妈的妈妈：外婆
      if (afterGrandmaChain.length === 1 && afterGrandmaChain[0] === 'm') {
        return '外婆';
      }
      
      // 丈夫的妈妈的姐姐：姨母
      if (afterGrandmaChain.length === 1 && afterGrandmaChain[0] === 'os') {
        return '姨母';
      }
      
      // 丈夫的妈妈的姐姐的丈夫：姨父
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'h') {
        return '姨父';
      }
      
      // 丈夫的妈妈的姐姐的女儿：表姐妹
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'd') {
        return '表姐妹';
      }
      
      // 丈夫的妈妈的姐姐的女儿的丈夫：表姐妹夫
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'd' && afterGrandmaChain[2] === 'h') {
        return '表姐妹夫';
      }
      
      // 丈夫的妈妈的姐姐的儿子：表侄
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 's') {
        return '表侄';
      }
      
      // 丈夫的妈妈的姐姐的妹妹：姨母
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'ls') {
        return '姨母';
      }
      
      // 丈夫的妈妈的姐姐的妹妹的丈夫：姨父
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'ls' && afterGrandmaChain[2] === 'h') {
        return '姨父';
      }
      
      // ========== 丈夫的妈妈的姐姐的妹妹的丈夫的亲属系列 ==========
      // 关系链：h, m, os, ls, h, ...
      if (afterGrandmaChain.length >= 3 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'ls' && afterGrandmaChain[2] === 'h') {
        var afterUncleInLawChain = afterGrandmaChain.slice(3); // 去掉 [os, ls, h] 后的关系链
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的哥哥：姻伯
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'ob') {
          return '姻伯';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的哥哥的妻子：姻伯母
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'ob' && afterUncleInLawChain[1] === 'w') {
          return '姻伯母';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的哥哥的儿子：姻表兄弟
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'ob' && afterUncleInLawChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的姐姐：姻姑母
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'os') {
          return '姻姑母';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的姐姐的丈夫：姻姑父
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 'h') {
          return '姻姑父';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的姐姐的儿子：姻表兄弟
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的姐姐的女儿：姻表姐妹
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 'd') {
          return '姻表姐妹';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的爸爸：姻祖父
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'f') {
          return '姻祖父';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的妈妈：姻祖母
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'm') {
          return '姻祖母';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的爸爸的爸爸：姻曾祖父
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'f' && afterUncleInLawChain[1] === 'f') {
          return '姻曾祖父';
        }
      }
      
      // ========== 丈夫的妈妈的妹妹的丈夫的亲属系列 ==========
      // 关系链：h, m, ls, h, ...
      if (afterGrandmaChain.length >= 2 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'h') {
        var afterAuntHusbandChain = afterGrandmaChain.slice(2); // 去掉 [ls, h] 后的关系链
        
        // 丈夫的妈妈的妹妹的丈夫（无后续关系）：姨父
        if (afterAuntHusbandChain.length === 0) {
          return '姨父';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的哥哥：姻伯
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'ob') {
          return '姻伯';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的哥哥的妻子：姻伯母
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'ob' && afterAuntHusbandChain[1] === 'w') {
          return '姻伯母';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的哥哥的儿子：姻表兄弟
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'ob' && afterAuntHusbandChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的姐姐：姻姑母
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'os') {
          return '姻姑母';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的姐姐的丈夫：姻姑父
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 'h') {
          return '姻姑父';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的姐姐的儿子：姻表兄弟
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的姐姐的女儿：姻表姐妹
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 'd') {
          return '姻表姐妹';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的爸爸：姻祖父
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'f') {
          return '姻祖父';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的妈妈：姻祖母
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'm') {
          return '姻祖母';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的爸爸的爸爸：姻曾祖父
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'f' && afterAuntHusbandChain[1] === 'f') {
          return '姻曾祖父';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的爸爸的爸爸的儿子：表叔/表伯
        if (afterAuntHusbandChain.length === 3 && afterAuntHusbandChain[0] === 'f' && afterAuntHusbandChain[1] === 'f' && (afterAuntHusbandChain[2] === 'ob' || afterAuntHusbandChain[2] === 'lb')) {
          return '表叔';
        }
      }
      
      // 丈夫的妈妈的妹妹（无后续关系）：姨母
      if (afterGrandmaChain.length === 1 && afterGrandmaChain[0] === 'ls') {
        return '姨母';
      }
      
      // ========== 丈夫的妈妈的妹妹的子女系列 ==========
      // 关系链：h, m, ls, d/s/h...
      
      // 丈夫的妈妈的妹妹的女儿：表姐妹
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'd') {
        return '表姐妹';
      }
      
      // 丈夫的妈妈的妹妹的女儿的丈夫：表姐妹夫
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'd' && afterGrandmaChain[2] === 'h') {
        return '表姐妹夫';
      }
      
      // 丈夫的妈妈的妹妹的女儿的儿子：表侄（李倩视角修复）
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'd' && afterGrandmaChain[2] === 's') {
        return '表侄';
      }
      
      // 丈夫的妈妈的妹妹的女儿的女儿：表侄女
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'd' && afterGrandmaChain[2] === 'd') {
        return '表侄女';
      }
      
      // 丈夫的妈妈的妹妹的儿子：表侄
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 's') {
        return '表侄';
      }
    }
    
    // ========== 模式 0g-4：妻子的妈妈的亲属系列（男性视角） ==========
    // 处理：妻子的妈妈的爸爸/妈妈/姐姐/妹妹及其亲属
    // 关系链：w, m, ...
    if (chain.length >= 2 && chain[0] === 'w' && chain[1] === 'm') {
      var afterWifeMomChain = chain.slice(2); // 去掉 [w, m] 后的关系链
      
      // 妻子的妈妈的爸爸：外公
      if (afterWifeMomChain.length === 1 && afterWifeMomChain[0] === 'f') {
        return '外公';
      }
      
      // 妻子的妈妈的妈妈：外婆
      if (afterWifeMomChain.length === 1 && afterWifeMomChain[0] === 'm') {
        return '外婆';
      }
      
      // 妻子的妈妈的姐姐：姨母
      if (afterWifeMomChain.length === 1 && afterWifeMomChain[0] === 'os') {
        return '姨母';
      }
      
      // 妻子的妈妈的妹妹：姨母
      if (afterWifeMomChain.length === 1 && afterWifeMomChain[0] === 'ls') {
        return '姨母';
      }
      
      // 妻子的妈妈的姐姐的丈夫：姨父
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'h') {
        return '姨父';
      }
      
      // 妻子的妈妈的妹妹的丈夫：姨父
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 'h') {
        return '姨父';
      }
      
      // 妻子的妈妈的姐姐的女儿：表姐妹
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'd') {
        return '表姐妹';
      }
      
      // 妻子的妈妈的姐姐的女儿的丈夫：表姐妹夫
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'd' && afterWifeMomChain[2] === 'h') {
        return '表姐妹夫';
      }
      
      // 妻子的妈妈的姐姐的儿子：表兄弟
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's') {
        return '表兄弟';
      }
      
      // 妻子的妈妈的姐姐的儿子的妻子：表兄弟媳
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'w') {
        return '表兄弟媳';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿：表侄女
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd') {
        return '表侄女';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿的丈夫：表侄女婿
      if (afterWifeMomChain.length === 4 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd' && afterWifeMomChain[3] === 'h') {
        return '表侄女婿';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿的儿子：表外孙
      if (afterWifeMomChain.length === 4 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd' && afterWifeMomChain[3] === 's') {
        return '表外孙';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿的儿子的儿子：表外曾孙
      if (afterWifeMomChain.length === 5 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd' && afterWifeMomChain[3] === 's' && afterWifeMomChain[4] === 's') {
        return '表外曾孙';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿的儿子的儿子的儿子：表外玄孙
      if (afterWifeMomChain.length === 6 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd' && afterWifeMomChain[3] === 's' && afterWifeMomChain[4] === 's' && afterWifeMomChain[5] === 's') {
        return '表外玄孙';
      }
      
      // 妻子的妈妈的妹妹的女儿：表姐妹
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 'd') {
        return '表姐妹';
      }
      
      // 妻子的妈妈的妹妹的女儿的丈夫：表姐妹夫
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 'd' && afterWifeMomChain[2] === 'h') {
        return '表姐妹夫';
      }
      
      // 妻子的妈妈的妹妹的儿子：表兄弟
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 's') {
        return '表兄弟';
      }
      
      // 妻子的妈妈的妹妹的儿子的妻子：表兄弟媳
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'w') {
        return '表兄弟媳';
      }
      
      // 妻子的妈妈的姐姐的妹妹：姨母
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'ls') {
        return '姨母';
      }
      
      // 妻子的妈妈的姐姐的妹妹的丈夫：姨父
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'ls' && afterWifeMomChain[2] === 'h') {
        return '姨父';
      }
      
      // ========== 妻子的妈妈的姐姐的妹妹的丈夫的亲属系列 ==========
      // 关系链：w, m, os, ls, h, ...
      if (afterWifeMomChain.length >= 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'ls' && afterWifeMomChain[2] === 'h') {
        var afterUncleInLawChain = afterWifeMomChain.slice(3); // 去掉 [os, ls, h] 后的关系链
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的哥哥：姻伯
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'ob') {
          return '姻伯';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的哥哥的妻子：姻伯母
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'ob' && afterUncleInLawChain[1] === 'w') {
          return '姻伯母';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的哥哥的儿子：姻表兄弟
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'ob' && afterUncleInLawChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的姐姐：姻姑母
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'os') {
          return '姻姑母';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的姐姐的丈夫：姻姑父
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 'h') {
          return '姻姑父';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的姐姐的儿子：姻表兄弟
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的姐姐的女儿：姻表姐妹
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 'd') {
          return '姻表姐妹';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的爸爸：姻祖父
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'f') {
          return '姻祖父';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的妈妈：姻祖母
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'm') {
          return '姻祖母';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的爸爸的爸爸：姻曾祖父
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'f' && afterUncleInLawChain[1] === 'f') {
          return '姻曾祖父';
        }
      }
      
      // ========== 妻子的妈妈的妹妹的丈夫的亲属系列 ==========
      // 关系链：w, m, ls, h, ...
      if (afterWifeMomChain.length >= 2 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 'h') {
        var afterAuntHusbandChain = afterWifeMomChain.slice(2); // 去掉 [ls, h] 后的关系链
        
        // 妻子的妈妈的妹妹的丈夫的哥哥：姻伯
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'ob') {
          return '姻伯';
        }
        
        // 妻子的妈妈的妹妹的丈夫的哥哥的妻子：姻伯母
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'ob' && afterAuntHusbandChain[1] === 'w') {
          return '姻伯母';
        }
        
        // 妻子的妈妈的妹妹的丈夫的哥哥的儿子：姻表兄弟
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'ob' && afterAuntHusbandChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 妻子的妈妈的妹妹的丈夫的姐姐：姻姑母
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'os') {
          return '姻姑母';
        }
        
        // 妻子的妈妈的妹妹的丈夫的姐姐的丈夫：姻姑父
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 'h') {
          return '姻姑父';
        }
        
        // 妻子的妈妈的妹妹的丈夫的姐姐的儿子：姻表兄弟
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 妻子的妈妈的妹妹的丈夫的姐姐的女儿：姻表姐妹
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 'd') {
          return '姻表姐妹';
        }
        
        // 妻子的妈妈的妹妹的丈夫的爸爸：姻祖父
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'f') {
          return '姻祖父';
        }
        
        // 妻子的妈妈的妹妹的丈夫的妈妈：姻祖母
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'm') {
          return '姻祖母';
        }
        
        // 妻子的妈妈的妹妹的丈夫的爸爸的爸爸：姻曾祖父
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'f' && afterAuntHusbandChain[1] === 'f') {
          return '姻曾祖父';
        }
      }
    }
    
    // ========== 模式 0h-1：爸爸的妈妈的亲属系列（曹书语视角） ==========
    // 处理：爸爸的妈妈的爸爸/妈妈/兄弟姐妹及其后代
    // 关系链：[f, m, ...]
    if (chain.length >= 2 && chain[0] === 'f' && chain[1] === 'm') {
      var afterGrandmotherChain = chain.slice(2); // 去掉 [f, m] 后的关系链
      
      // ========== 外伯祖父/外叔祖父系列（爸爸的妈妈的兄弟） ==========
      // 关系链：[f, m, ob/lb, ...]
      if (afterGrandmotherChain.length >= 1 && (afterGrandmotherChain[0] === 'ob' || afterGrandmotherChain[0] === 'lb')) {
        var grandmaSibRel = afterGrandmotherChain[0]; // ob/lb
        var afterGrandmaSibChain = afterGrandmotherChain.slice(1); // 去掉 ob/lb 后的关系链
        
        // 爸爸的妈妈的哥哥：外伯祖父
        if (afterGrandmaSibChain.length === 0 && grandmaSibRel === 'ob') {
          return '外伯祖父';
        }
        
        // 爸爸的妈妈的弟弟：外叔祖父
        if (afterGrandmaSibChain.length === 0 && grandmaSibRel === 'lb') {
          return '外叔祖父';
        }
        
        // 爸爸的妈妈的哥哥的妻子：外伯祖母
        if (afterGrandmaSibChain.length === 1 && grandmaSibRel === 'ob' && afterGrandmaSibChain[0] === 'w') {
          return '外伯祖母';
        }
        
        // 爸爸的妈妈的弟弟的妻子：外叔祖母
        if (afterGrandmaSibChain.length === 1 && grandmaSibRel === 'lb' && afterGrandmaSibChain[0] === 'w') {
          return '外叔祖母';
        }
        
        // 爸爸的妈妈的兄弟的儿子：表伯叔父
        if (afterGrandmaSibChain.length === 1 && afterGrandmaSibChain[0] === 's') {
          return '表伯叔父';
        }
        
        // 爸爸的妈妈的兄弟的儿子的妻子：表伯叔母
        if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 'w') {
          return '表伯叔母';
        }
        
        // 爸爸的妈妈的兄弟的子女的后代（表兄弟姐妹系列）
        if (afterGrandmaSibChain.length >= 1 && (afterGrandmaSibChain[0] === 's' || afterGrandmaSibChain[0] === 'd')) {
          var lastGenGender = 'male';
          for (var i = afterGrandmaSibChain.length - 1; i >= 0; i--) {
            if (afterGrandmaSibChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterGrandmaSibChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 判断最后一代是否为配偶
          var lastRel = afterGrandmaSibChain[afterGrandmaSibChain.length - 1];
          var secondLastRel = afterGrandmaSibChain.length >= 2 ? afterGrandmaSibChain[afterGrandmaSibChain.length - 2] : null;
          
          // 表姑父：爸爸的妈妈的兄弟的女儿的丈夫 [ob/lb, d, h]
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 'h') {
            return '表姑父';
          }
          
          // 表姑母：爸爸的妈妈的兄弟的女儿 [ob/lb, d]
          if (afterGrandmaSibChain.length === 1 && afterGrandmaSibChain[0] === 'd') {
            return '表姑母';
          }
          
          // 表伯叔父：爸爸的妈妈的兄弟的儿子 [ob/lb, s]
          if (afterGrandmaSibChain.length === 1 && afterGrandmaSibChain[0] === 's') {
            return '表伯叔父';
          }
          
          // 表伯叔母：爸爸的妈妈的兄弟的儿子的妻子 [ob/lb, s, w]
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 'w') {
            return '表伯叔母';
          }
          
          // 女儿的子女：[d, s] 表兄弟，[d, d] 表姐妹
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 's') {
            return '表兄弟';
          }
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 'd') {
            return '表姐妹';
          }
          
          // 女儿的子女的配偶：[d, s, w] 表兄弟媳，[d, d, h] 表姐妹夫
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 's' && afterGrandmaSibChain[2] === 'w') {
            return '表兄弟媳';
          }
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 'd' && afterGrandmaSibChain[2] === 'h') {
            return '表姐妹夫';
          }
          
          // 儿子的子女：[s, s] 表兄弟，[s, d] 表姐妹（外伯祖父的孙辈和我同辈）
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 's') {
            return '表兄弟';
          }
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 'd') {
            return '表姐妹';
          }
          
          // 儿子的子女的配偶：[s, s, w] 表兄弟媳，[s, d, h] 表姐妹夫
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 's' && afterGrandmaSibChain[2] === 'w') {
            return '表兄弟媳';
          }
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 'd' && afterGrandmaSibChain[2] === 'h') {
            return '表姐妹夫';
          }
          
          // 表侄/表侄女（向下 1 代）- 儿子的孙子女
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 's' && (afterGrandmaSibChain[1] === 's' || afterGrandmaSibChain[1] === 'd')) {
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          
          // 表侄孙/表侄孙女（向下 2 代）
          if (afterGrandmaSibChain.length === 4) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
      }
      
      // 爸爸的妈妈的爸爸：曾祖父
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'f') {
        return '曾祖父';
      }
      
      // 爸爸的妈妈的妈妈：曾祖母
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'm') {
        return '曾祖母';
      }
      
      // 爸爸的妈妈的哥哥：舅祖父
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'ob') {
        return '舅祖父';
      }
      
      // 爸爸的妈妈的弟弟：舅祖父
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'lb') {
        return '舅祖父';
      }
      
      // 爸爸的妈妈的姐姐：姨祖母
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'os') {
        return '姨祖母';
      }
      
      // 爸爸的妈妈的妹妹：姨祖母
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'ls') {
        return '姨祖母';
      }
      
      // 爸爸的妈妈的哥哥的妻子：舅祖母
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'ob' && afterGrandmotherChain[1] === 'w') {
        return '舅祖母';
      }
      
      // 爸爸的妈妈的弟弟的妻子：舅祖母
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'lb' && afterGrandmotherChain[1] === 'w') {
        return '舅祖母';
      }
      
      // 爸爸的妈妈的姐姐的丈夫：姨祖父
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'os' && afterGrandmotherChain[1] === 'h') {
        return '姨祖父';
      }
      
      // 爸爸的妈妈的妹妹的丈夫：姨祖父
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'ls' && afterGrandmotherChain[1] === 'h') {
        return '姨祖父';
      }
      
      // 爸爸的妈妈的姐妹的女儿：表姑/表姨
      if (afterGrandmotherChain.length === 2 && (afterGrandmotherChain[0] === 'os' || afterGrandmotherChain[0] === 'ls') && afterGrandmotherChain[1] === 'd') {
        return '表姑';
      }
      
      // 爸爸的妈妈的姐妹的女儿的丈夫：表姑父
      if (afterGrandmotherChain.length === 3 && (afterGrandmotherChain[0] === 'os' || afterGrandmotherChain[0] === 'ls') && afterGrandmotherChain[1] === 'd' && afterGrandmotherChain[2] === 'h') {
        return '表姑父';
      }
      
      // 爸爸的妈妈的姐妹的丈夫的亲属系列（姻亲）
      // 关系链：[f, m, ls/ob, h, ...]
      if (afterGrandmotherChain.length >= 2 && (afterGrandmotherChain[0] === 'os' || afterGrandmotherChain[0] === 'ls') && afterGrandmotherChain[1] === 'h') {
        var auntHusbandRel = afterGrandmotherChain.slice(2); // 去掉 [ls/os, h] 后的关系链
        
        // 爸爸的妈妈的妹妹的丈夫的爸爸：姻曾祖父
        if (auntHusbandRel.length === 1 && auntHusbandRel[0] === 'f') {
          return '姻曾祖父';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的妈妈：姻曾祖母
        if (auntHusbandRel.length === 1 && auntHusbandRel[0] === 'm') {
          return '姻曾祖母';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的爸爸的爸爸：姻高祖父
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'f' && auntHusbandRel[1] === 'f') {
          return '姻高祖父';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的哥哥：姻伯祖父
        if (auntHusbandRel.length === 1 && auntHusbandRel[0] === 'ob') {
          return '姻伯祖父';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的哥哥的妻子：姻伯祖母
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'ob' && auntHusbandRel[1] === 'w') {
          return '姻伯祖母';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的姐姐：姻姑祖母
        if (auntHusbandRel.length === 1 && auntHusbandRel[0] === 'os') {
          return '姻姑祖母';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的姐姐的丈夫：姻姑祖父
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'os' && auntHusbandRel[1] === 'h') {
          return '姻姑祖父';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的姐姐的女儿：姻表姑
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'os' && auntHusbandRel[1] === 'd') {
          return '姻表姑';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的姐姐的儿子：姻表伯/姻表叔
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'os' && auntHusbandRel[1] === 's') {
          return '姻表伯';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的哥哥的儿子：姻表伯
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'ob' && auntHusbandRel[1] === 's') {
          return '姻表伯';
        }
      }
      
      // 爸爸的妈妈的妹妹的儿子：表叔
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'ls' && afterGrandmotherChain[1] === 's') {
        return '表叔';
      }
      
      // 爸爸的妈妈的妹妹的女儿：表姑
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'ls' && afterGrandmotherChain[1] === 'd') {
        return '表姑';
      }
      
      // 爸爸的妈妈的妹妹的女儿的丈夫：表姑父
      if (afterGrandmotherChain.length === 3 && afterGrandmotherChain[0] === 'ls' && afterGrandmotherChain[1] === 'd' && afterGrandmotherChain[2] === 'h') {
        return '表姑父';
      }
    }
    
    // ========== 模式 0i：妻子的爸爸的妈妈的亲属系列（张小强视角） ==========
    // 处理：妻子的爸爸的妈妈的爸爸/妈妈/兄弟姐妹及其后代
    // 关系链：[w, f, m, ...]
    if (chain.length >= 3 && chain[0] === 'w' && chain[1] === 'f' && chain[2] === 'm') {
      var afterWfGrandmotherChain = chain.slice(3); // 去掉 [w, f, m] 后的关系链
      
      // ========== 外伯祖父/外叔祖父系列（妻子的爸爸的妈妈的兄弟） ==========
      // 关系链：[w, f, m, ob/lb, ...]
      if (afterWfGrandmotherChain.length >= 1 && (afterWfGrandmotherChain[0] === 'ob' || afterWfGrandmotherChain[0] === 'lb')) {
        var wifeFmSibRel = afterWfGrandmotherChain[0]; // ob/lb
        var afterWfFmSibChain = afterWfGrandmotherChain.slice(1); // 去掉 ob/lb 后的关系链
        
        // 妻子的爸爸的妈妈的哥哥：外伯祖父
        if (afterWfFmSibChain.length === 0 && wifeFmSibRel === 'ob') {
          return '外伯祖父';
        }
        
        // 妻子的爸爸的妈妈的弟弟：外叔祖父
        if (afterWfFmSibChain.length === 0 && wifeFmSibRel === 'lb') {
          return '外叔祖父';
        }
        
        // 妻子的爸爸的妈妈的哥哥的妻子：外伯祖母
        if (afterWfFmSibChain.length === 1 && wifeFmSibRel === 'ob' && afterWfFmSibChain[0] === 'w') {
          return '外伯祖母';
        }
        
        // 妻子的爸爸的妈妈的弟弟的妻子：外叔祖母
        if (afterWfFmSibChain.length === 1 && wifeFmSibRel === 'lb' && afterWfFmSibChain[0] === 'w') {
          return '外叔祖母';
        }
        
        // 妻子的爸爸的妈妈的兄弟的儿子：表伯叔父
        if (afterWfFmSibChain.length === 1 && afterWfFmSibChain[0] === 's') {
          return '表伯叔父';
        }
        
        // 妻子的爸爸的妈妈的兄弟的儿子的妻子：表伯叔母
        if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 'w') {
          return '表伯叔母';
        }
        
        // 妻子的爸爸的妈妈的兄弟的子女的后代（表兄弟姐妹系列）
        if (afterWfFmSibChain.length >= 1 && (afterWfFmSibChain[0] === 's' || afterWfFmSibChain[0] === 'd')) {
          var lastGenGender = 'male';
          for (var i = afterWfFmSibChain.length - 1; i >= 0; i--) {
            if (afterWfFmSibChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterWfFmSibChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 表姑父：妻子的爸爸的妈妈的兄弟的女儿的丈夫 [w,f,m,ob/lb,d,h]
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 'h') {
            return '表姑父';
          }
          
          // 表姑母：妻子的爸爸的妈妈的兄弟的女儿 [w,f,m,ob/lb,d]
          if (afterWfFmSibChain.length === 1 && afterWfFmSibChain[0] === 'd') {
            return '表姑母';
          }
          
          // 表伯叔父：妻子的爸爸的妈妈的兄弟的儿子 [w,f,m,ob/lb,s]
          if (afterWfFmSibChain.length === 1 && afterWfFmSibChain[0] === 's') {
            return '表伯叔父';
          }
          
          // 表伯叔母：妻子的爸爸的妈妈的兄弟的儿子的妻子 [w,f,m,ob/lb,s,w]
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 'w') {
            return '表伯叔母';
          }
          
          // 女儿的子女：[d, s] 表兄弟，[d, d] 表姐妹
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 's') {
            return '表兄弟';
          }
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 'd') {
            return '表姐妹';
          }
          
          // 女儿的子女的配偶：[d, s, w] 表兄弟媳，[d, d, h] 表姐妹夫
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 's' && afterWfFmSibChain[2] === 'w') {
            return '表兄弟媳';
          }
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 'd' && afterWfFmSibChain[2] === 'h') {
            return '表姐妹夫';
          }
          
          // 儿子的子女：[s, s] 表兄弟，[s, d] 表姐妹（外伯祖父的孙辈和我同辈）
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 's') {
            return '表兄弟';
          }
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 'd') {
            return '表姐妹';
          }
          
          // 儿子的子女的配偶：[s, s, w] 表兄弟媳，[s, d, h] 表姐妹夫
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 's' && afterWfFmSibChain[2] === 'w') {
            return '表兄弟媳';
          }
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 'd' && afterWfFmSibChain[2] === 'h') {
            return '表姐妹夫';
          }
          
          // 表侄/表侄女（向下 1 代）- 儿子的孙子女
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 's' && (afterWfFmSibChain[1] === 's' || afterWfFmSibChain[1] === 'd')) {
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          
          // 表侄孙/表侄孙女（向下 2 代）
          if (afterWfFmSibChain.length === 4) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
      }
      
      // 妻子的爸爸的妈妈的爸爸：曾祖父
      if (afterWfGrandmotherChain.length === 1 && afterWfGrandmotherChain[0] === 'f') {
        return '曾祖父';
      }
      
      // 妻子的爸爸的妈妈的妈妈：曾祖母
      if (afterWfGrandmotherChain.length === 1 && afterWfGrandmotherChain[0] === 'm') {
        return '曾祖母';
      }
      
      // 妻子的爸爸的妈妈的妹妹：姨祖母
      if (afterWfGrandmotherChain.length === 1 && afterWfGrandmotherChain[0] === 'ls') {
        return '姨祖母';
      }
      
      // 妻子的爸爸的妈妈的妹妹的丈夫：姨祖父
      if (afterWfGrandmotherChain.length === 2 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 'h') {
        return '姨祖父';
      }
      
      // 妻子的爸爸的妈妈的妹妹的儿子：表叔
      if (afterWfGrandmotherChain.length === 2 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 's') {
        return '表叔';
      }
      
      // 妻子的爸爸的妈妈的妹妹的女儿：表姑
      if (afterWfGrandmotherChain.length === 2 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 'd') {
        return '表姑';
      }
      
      // 妻子的爸爸的妈妈的妹妹的女儿的丈夫：表姑父
      if (afterWfGrandmotherChain.length === 3 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 'd' && afterWfGrandmotherChain[2] === 'h') {
        return '表姑父';
      }
      
      // 妻子的爸爸的妈妈的妹妹的丈夫的亲属系列（姻亲）
      if (afterWfGrandmotherChain.length >= 2 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 'h') {
        var wifeAuntHusbandRel = afterWfGrandmotherChain.slice(2);
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的姐姐：姻姑祖母
        if (wifeAuntHusbandRel.length === 1 && wifeAuntHusbandRel[0] === 'os') {
          return '姻姑祖母';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的姐姐的丈夫：姻姑祖父
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'os' && wifeAuntHusbandRel[1] === 'h') {
          return '姻姑祖父';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的姐姐的女儿：姻表姑
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'os' && wifeAuntHusbandRel[1] === 'd') {
          return '姻表姑';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的姐姐的儿子：姻表伯
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'os' && wifeAuntHusbandRel[1] === 's') {
          return '姻表伯';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的爸爸：姻曾祖父
        if (wifeAuntHusbandRel.length === 1 && wifeAuntHusbandRel[0] === 'f') {
          return '姻曾祖父';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的妈妈：姻曾祖母
        if (wifeAuntHusbandRel.length === 1 && wifeAuntHusbandRel[0] === 'm') {
          return '姻曾祖母';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的爸爸的爸爸：姻高祖父
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'f' && wifeAuntHusbandRel[1] === 'f') {
          return '姻高祖父';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的哥哥：姻伯祖父
        if (wifeAuntHusbandRel.length === 1 && wifeAuntHusbandRel[0] === 'ob') {
          return '姻伯祖父';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的哥哥的妻子：姻伯祖母
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'ob' && wifeAuntHusbandRel[1] === 'w') {
          return '姻伯祖母';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的哥哥的儿子：姻表伯
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'ob' && wifeAuntHusbandRel[1] === 's') {
          return '姻表伯';
        }
      }
    }
    
        // ========== 模式 0j：丈夫的妈妈的亲属系列（李倩视角） ==========
    // 处理：丈夫的妈妈的兄弟姐妹的后代
    // 关系链：[h, m, ...]
    if (chain.length >= 3 && chain[0] === 'h' && chain[1] === 'm') {
      var afterHusbandMotherChain = chain.slice(2);
      
      // 丈夫的妈妈的哥哥/弟弟/姐姐/妹妹：舅舅/姨妈
      if (afterHusbandMotherChain.length === 1) {
        if (afterHusbandMotherChain[0] === 'ob') return '舅舅';
        if (afterHusbandMotherChain[0] === 'lb') return '舅舅';
        if (afterHusbandMotherChain[0] === 'os') return '姨妈';
        if (afterHusbandMotherChain[0] === 'ls') return '姨妈';
      }
      
      // 丈夫的妈妈的兄弟姐妹的子女：表兄弟/表姐妹
      if (afterHusbandMotherChain.length === 2) {
        if (afterHusbandMotherChain[0] === 'ob' || afterHusbandMotherChain[0] === 'lb') {
          if (afterHusbandMotherChain[1] === 's') return '表兄弟';
          if (afterHusbandMotherChain[1] === 'd') return '表姐妹';
        }
        if (afterHusbandMotherChain[0] === 'os' || afterHusbandMotherChain[0] === 'ls') {
          if (afterHusbandMotherChain[1] === 's') return '表兄弟';
          if (afterHusbandMotherChain[1] === 'd') return '表姐妹';
        }
      }
      
      // 丈夫的妈妈的兄弟姐妹的子女的配偶
      if (afterHusbandMotherChain.length === 3) {
        var siblingRel = afterHusbandMotherChain[0];
        if ((siblingRel === 'ob' || siblingRel === 'lb' || siblingRel === 'os' || siblingRel === 'ls') &&
            afterHusbandMotherChain[2] === 'w') {
          return '表兄弟媳';
        }
        if ((siblingRel === 'ob' || siblingRel === 'lb' || siblingRel === 'os' || siblingRel === 'ls') &&
            afterHusbandMotherChain[1] === 'd' && afterHusbandMotherChain[2] === 'h') {
          return '表姐妹夫';
        }
      }
      
      // 丈夫的妈妈的兄弟姐妹的儿子的后代（表侄系列）
      if (afterHusbandMotherChain.length >= 3 && afterHusbandMotherChain[0] === 's') {
        var afterSonChain = afterHusbandMotherChain.slice(1);
        
        if (afterSonChain.length === 1) {
          if (afterSonChain[0] === 's') return '表侄';
          if (afterSonChain[0] === 'd') return '表侄女';
        }
        
        if (afterSonChain.length === 2) {
          if (afterSonChain[0] === 's' && afterSonChain[1] === 'w') return '表侄媳';
          if (afterSonChain[0] === 'd' && afterSonChain[1] === 'h') return '表侄女婿';
        }
        
        if (afterSonChain.length === 2 && afterSonChain[0] === 's') {
          if (afterSonChain[1] === 's') return '表侄孙';
          if (afterSonChain[1] === 'd') return '表侄孙女';
        }
      }
      
      // 丈夫的妈妈的兄弟姐妹的女儿的后代（表外甥系列）
      if (afterHusbandMotherChain.length >= 3 && afterHusbandMotherChain[0] === 'd') {
        var afterDaughterChain = afterHusbandMotherChain.slice(1);
        
        if (afterDaughterChain.length === 1) {
          if (afterDaughterChain[0] === 's') return '表外甥';
          if (afterDaughterChain[0] === 'd') return '表外甥女';
        }
        
        if (afterDaughterChain.length === 2) {
          if (afterDaughterChain[0] === 's' && afterDaughterChain[1] === 'w') return '表外甥媳';
          if (afterDaughterChain[0] === 'd' && afterDaughterChain[1] === 'h') return '表外甥女婿';
        }
        
        if (afterDaughterChain.length === 2 && afterDaughterChain[0] === 's') {
          if (afterDaughterChain[1] === 's') return '表外甥孙';
          if (afterDaughterChain[1] === 'd') return '表外甥孙女';
        }
      }
      
      // 旧逻辑兼容
      if (afterHusbandMotherChain.length === 2 && afterHusbandMotherChain[0] === 'ls' && afterHusbandMotherChain[1] === 's') {
        return '表侄';
      }
      if (afterHusbandMotherChain.length === 2 && afterHusbandMotherChain[0] === 'ls' && afterHusbandMotherChain[1] === 'd') {
        return '表侄女';
      }
      if (afterHusbandMotherChain.length === 2 && afterHusbandMotherChain[0] === 'ob' && afterHusbandMotherChain[1] === 's') {
        return '表侄';
      }
      if (afterHusbandMotherChain.length === 2 && afterHusbandMotherChain[0] === 'ob' && afterHusbandMotherChain[1] === 'd') {
        return '表侄女';
      }
    }
    
    // ========== 模式 0j-2：丈夫的妈妈的爸爸的兄弟姐妹（外叔祖父/外姑祖母）及其后代 ==========
    // 关系链：[h, m, f, ob/lb/os/ls, ...]
    if (chain.length >= 4 && chain[0] === 'h' && chain[1] === 'm' && chain[2] === 'f' &&
        (chain[3] === 'ob' || chain[3] === 'lb' || chain[3] === 'os' || chain[3] === 'ls')) {
      var husbandMomGreatUncleRel = chain[3];
      var afterHusbandMomGreatUncleChain = chain.slice(4);
      
      // 丈夫的妈妈的爸爸的哥哥：外伯祖父
      if (afterHusbandMomGreatUncleChain.length === 0 && husbandMomGreatUncleRel === 'ob') {
        return '外伯祖父';
      }
      
      // 丈夫的妈妈的爸爸的弟弟：外叔祖父
      if (afterHusbandMomGreatUncleChain.length === 0 && husbandMomGreatUncleRel === 'lb') {
        return '外叔祖父';
      }
      
      // 丈夫的妈妈的爸爸的姐姐：外姑祖母
      if (afterHusbandMomGreatUncleChain.length === 0 && husbandMomGreatUncleRel === 'os') {
        return '外姑祖母';
      }
      
      // 丈夫的妈妈的爸爸的妹妹：外姑祖母
      if (afterHusbandMomGreatUncleChain.length === 0 && husbandMomGreatUncleRel === 'ls') {
        return '外姑祖母';
      }
      
      // 丈夫的妈妈的爸爸的姐妹的丈夫：外姑祖父
      if (afterHusbandMomGreatUncleChain.length === 1 && afterHusbandMomGreatUncleChain[0] === 'h') {
        return '外姑祖父';
      }
      
      // 丈夫的妈妈的爸爸的兄弟的妻子：外伯祖母/外叔祖母
      if (afterHusbandMomGreatUncleChain.length === 1 && afterHusbandMomGreatUncleChain[0] === 'w') {
        return husbandMomGreatUncleRel === 'ob' ? '外伯祖母' : '外叔祖母';
      }
      
      // 丈夫的妈妈的爸爸的兄弟姐妹的子女：表舅父/表姨母
      if (afterHusbandMomGreatUncleChain.length === 1) {
        if (afterHusbandMomGreatUncleChain[0] === 's') {
          return '表舅父';
        }
        if (afterHusbandMomGreatUncleChain[0] === 'd') {
          return '表姨母';
        }
      }
      
      // 丈夫的妈妈的爸爸的兄弟姐妹的子女的配偶
      if (afterHusbandMomGreatUncleChain.length === 2) {
        if (afterHusbandMomGreatUncleChain[0] === 's' && afterHusbandMomGreatUncleChain[1] === 'w') {
          return '表舅母';
        }
        if (afterHusbandMomGreatUncleChain[0] === 'd' && afterHusbandMomGreatUncleChain[1] === 'h') {
          return '表姨父';
        }
      }
      
      // 丈夫的妈妈的爸爸的兄弟姐妹的子女的后代（表兄弟姐妹系列）
      if (afterHusbandMomGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterHusbandMomGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterHusbandMomGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterHusbandMomGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表姐妹夫：[s, d, h]
        if (afterHusbandMomGreatUncleChain.length === 3 && 
            afterHusbandMomGreatUncleChain[0] === 's' && 
            afterHusbandMomGreatUncleChain[1] === 'd' && 
            afterHusbandMomGreatUncleChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表兄弟媳：[d, s, w]
        if (afterHusbandMomGreatUncleChain.length === 3 && 
            afterHusbandMomGreatUncleChain[0] === 'd' && 
            afterHusbandMomGreatUncleChain[1] === 's' && 
            afterHusbandMomGreatUncleChain[2] === 'w') {
          return '表兄弟媳';
        }
        
        if (afterHusbandMomGreatUncleChain.length === 2) {
          return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
        }
        if (afterHusbandMomGreatUncleChain.length === 3) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        if (afterHusbandMomGreatUncleChain.length === 4) {
          return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
        }
      }
    }
    
// ========== 模式 0h：爸爸的兄弟姐妹、妈妈的亲属系列（安南视角） ==========
    // 处理：爸爸的哥哥/姐姐/弟弟/妹妹，妈妈的爸爸/妈妈/哥哥/姐姐/弟弟/妹妹及其后代
    
    // 爸爸的哥哥：伯伯
    if (chain.length === 2 && chain[0] === 'f' && chain[1] === 'ob') {
      return '伯伯';
    }
    
    // 爸爸的弟弟：叔叔
    if (chain.length === 2 && chain[0] === 'f' && chain[1] === 'lb') {
      return '叔叔';
    }
    
    // 爸爸的姐姐：姑妈
    if (chain.length === 2 && chain[0] === 'f' && chain[1] === 'os') {
      return '姑妈';
    }
    
    // 爸爸的妹妹：姑妈
    if (chain.length === 2 && chain[0] === 'f' && chain[1] === 'ls') {
      return '姑妈';
    }
    
    // 妈妈的爸爸：外公
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'f') {
      return '外公';
    }
    
    // 妈妈的妈妈：外婆
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'm') {
      return '外婆';
    }
    
    // 妈妈的哥哥：舅舅
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'ob') {
      return '舅舅';
    }
    
    // 妈妈的弟弟：舅舅
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'lb') {
      return '舅舅';
    }
    
    // 妈妈的姐姐：姨妈
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'os') {
      return '姨妈';
    }
    
    // 妈妈的妹妹：姨妈
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'ls') {
      return '姨妈';
    }
    
    // 爸爸的哥哥的妻子：伯母
    if (chain.length === 3 && chain[0] === 'f' && chain[1] === 'ob' && chain[2] === 'w') {
      return '伯母';
    }
    
    // 爸爸的弟弟的妻子：婶婶
    if (chain.length === 3 && chain[0] === 'f' && chain[1] === 'lb' && chain[2] === 'w') {
      return '婶婶';
    }
    
    // 爸爸的姐姐的丈夫：姑父
    if (chain.length === 3 && chain[0] === 'f' && chain[1] === 'os' && chain[2] === 'h') {
      return '姑父';
    }
    
    // 爸爸的妹妹的丈夫：姑父
    if (chain.length === 3 && chain[0] === 'f' && chain[1] === 'ls' && chain[2] === 'h') {
      return '姑父';
    }
    
    // 妈妈的哥哥的妻子：舅母
    if (chain.length === 3 && chain[0] === 'm' && chain[1] === 'ob' && chain[2] === 'w') {
      return '舅母';
    }
    
    // 妈妈的弟弟的妻子：舅母
    if (chain.length === 3 && chain[0] === 'm' && chain[1] === 'lb' && chain[2] === 'w') {
      return '舅母';
    }
    
    // 妈妈的姐姐的丈夫：姨父
    if (chain.length === 3 && chain[0] === 'm' && chain[1] === 'os' && chain[2] === 'h') {
      return '姨父';
    }
    
    // 妈妈的妹妹的丈夫：姨父
    if (chain.length === 3 && chain[0] === 'm' && chain[1] === 'ls' && chain[2] === 'h') {
      return '姨父';
    }
    
    // ========== 模式 0h-3：妈妈的爸爸的兄弟（外叔祖父）及其后代 ==========
    // 关系链：[m, f, ob/lb, ...]
    if (chain.length >= 3 && chain[0] === 'm' && chain[1] === 'f' && 
        (chain[2] === 'ob' || chain[2] === 'lb')) {
      var momGreatUncleRel = chain[2]; // ob/lb
      var afterMomGreatUncleChain = chain.slice(3); // 去掉 [m, f, ob/lb] 后的关系链
      
      // 妈妈的爸爸的哥哥：外伯祖父
      if (afterMomGreatUncleChain.length === 0 && momGreatUncleRel === 'ob') {
        return '外伯祖父';
      }
      
      // 妈妈的爸爸的弟弟：外叔祖父
      if (afterMomGreatUncleChain.length === 0 && momGreatUncleRel === 'lb') {
        return '外叔祖父';
      }
      
      // 妈妈的爸爸的兄弟的妻子：外伯祖母/外叔祖母
      if (afterMomGreatUncleChain.length === 1 && afterMomGreatUncleChain[0] === 'w') {
        return momGreatUncleRel === 'ob' ? '外伯祖母' : '外叔祖母';
      }
      
      // 妈妈的爸爸的兄弟的子女：表舅父/表姨母
      if (afterMomGreatUncleChain.length === 1) {
        if (afterMomGreatUncleChain[0] === 's') {
          return '表舅父';
        }
        if (afterMomGreatUncleChain[0] === 'd') {
          return '表姨母';
        }
      }
      
      // 妈妈的爸爸的兄弟的子女的配偶
      if (afterMomGreatUncleChain.length === 2) {
        if (afterMomGreatUncleChain[0] === 's' && afterMomGreatUncleChain[1] === 'w') {
          return '表舅母';
        }
        if (afterMomGreatUncleChain[0] === 'd' && afterMomGreatUncleChain[1] === 'h') {
          return '表姨父';
        }
      }
      
      // 妈妈的爸爸的兄弟的子女的后代（表兄弟姐妹系列）
      // 关系链长度 2：[s,s]/[s,d]/[d,s]/[d,d] = 表兄弟/表姐妹
      // 关系链长度 3：[s,s,s]/[s,s,d]/[d,s,s]/[d,s,w]/[s,d,h] = 表侄/表侄女/表兄弟媳/表姐妹夫
      // 关系链长度 4：[s,s,s,s]/... = 表侄孙/表侄孙女
      if (afterMomGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterMomGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterMomGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterMomGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 检查是否以配偶关系结尾（表兄弟姐妹的配偶）
        var lastRel = afterMomGreatUncleChain[afterMomGreatUncleChain.length - 1];
        var secondLastRel = afterMomGreatUncleChain.length >= 2 ? afterMomGreatUncleChain[afterMomGreatUncleChain.length - 2] : null;
        
        // 表姐妹夫：[s, d, h] - 表姐妹的丈夫
        if (afterMomGreatUncleChain.length === 3 && 
            afterMomGreatUncleChain[0] === 's' && 
            afterMomGreatUncleChain[1] === 'd' && 
            afterMomGreatUncleChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表姐妹夫：[d, d, h] - 表姨母的女儿的丈夫
        if (afterMomGreatUncleChain.length === 3 && 
            afterMomGreatUncleChain[0] === 'd' && 
            afterMomGreatUncleChain[1] === 'd' && 
            afterMomGreatUncleChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表兄弟媳：[d, s, w] - 表兄弟的妻子
        if (afterMomGreatUncleChain.length === 3 && 
            afterMomGreatUncleChain[0] === 'd' && 
            afterMomGreatUncleChain[1] === 's' && 
            afterMomGreatUncleChain[2] === 'w') {
          return '表兄弟媳';
        }
        
        if (afterMomGreatUncleChain.length === 2) {
          return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
        }
        if (afterMomGreatUncleChain.length === 3) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        if (afterMomGreatUncleChain.length === 4) {
          return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
        }
      }
    }
    
    // ========== 模式 0h-3b：妈妈的爸爸的姐妹（外姑祖母）及其后代 ==========
    // 关系链：[m, f, os/ls, ...]
    if (chain.length >= 3 && chain[0] === 'm' && chain[1] === 'f' && 
        (chain[2] === 'os' || chain[2] === 'ls')) {
      var momGreatAuntRel = chain[2]; // os/ls
      var afterMomGreatAuntChain = chain.slice(3); // 去掉 [m, f, os/ls] 后的关系链
      
      // 妈妈的爸爸的姐姐：外姑祖母
      if (afterMomGreatAuntChain.length === 0 && momGreatAuntRel === 'os') {
        return '外姑祖母';
      }
      
      // 妈妈的爸爸的妹妹：外姑祖母
      if (afterMomGreatAuntChain.length === 0 && momGreatAuntRel === 'ls') {
        return '外姑祖母';
      }
      
      // 妈妈的爸爸的姐妹的丈夫：外姑祖父
      if (afterMomGreatAuntChain.length === 1 && afterMomGreatAuntChain[0] === 'h') {
        return '外姑祖父';
      }
      
      // 妈妈的爸爸的姐妹的子女：表舅父/表姨母
      if (afterMomGreatAuntChain.length === 1) {
        if (afterMomGreatAuntChain[0] === 's') {
          return '表舅父';
        }
        if (afterMomGreatAuntChain[0] === 'd') {
          return '表姨母';
        }
      }
      
      // 妈妈的爸爸的姐妹的子女的配偶
      if (afterMomGreatAuntChain.length === 2) {
        if (afterMomGreatAuntChain[0] === 's' && afterMomGreatAuntChain[1] === 'w') {
          return '表舅母';
        }
        if (afterMomGreatAuntChain[0] === 'd' && afterMomGreatAuntChain[1] === 'h') {
          return '表姨父';
        }
      }
      
      // 妈妈的爸爸的姐妹的子女的后代（表兄弟姐妹系列）
      if (afterMomGreatAuntChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterMomGreatAuntChain.length - 1; i >= 0; i--) {
          if (afterMomGreatAuntChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterMomGreatAuntChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表姐妹夫：[s, d, h] - 表姐妹的丈夫
        if (afterMomGreatAuntChain.length === 3 && 
            afterMomGreatAuntChain[0] === 's' && 
            afterMomGreatAuntChain[1] === 'd' && 
            afterMomGreatAuntChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表兄弟媳：[d, s, w] - 表兄弟的妻子
        if (afterMomGreatAuntChain.length === 3 && 
            afterMomGreatAuntChain[0] === 'd' && 
            afterMomGreatAuntChain[1] === 's' && 
            afterMomGreatAuntChain[2] === 'w') {
          return '表兄弟媳';
        }
        
        if (afterMomGreatAuntChain.length === 2) {
          return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
        }
        if (afterMomGreatAuntChain.length === 3) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        if (afterMomGreatAuntChain.length === 4) {
          return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
        }
      }
    }
    
    // ========== 模式 0h-4：妈妈的妈妈的爸爸的兄弟（外曾叔祖父）及其后代 ==========
    // 关系链：[m, m, f, ob/lb, ...]
    if (chain.length >= 4 && chain[0] === 'm' && chain[1] === 'm' && chain[2] === 'f' && 
        (chain[3] === 'ob' || chain[3] === 'lb')) {
      var momMomGreatUncleRel = chain[3]; // ob/lb
      var afterMomMomGreatUncleChain = chain.slice(4); // 去掉 [m, m, f, ob/lb] 后的关系链
      
      // 妈妈的妈妈的爸爸的哥哥：外伯曾祖父
      if (afterMomMomGreatUncleChain.length === 0 && momMomGreatUncleRel === 'ob') {
        return '外伯曾祖父';
      }
      
      // 妈妈的妈妈的爸爸的弟弟：外叔曾祖父
      if (afterMomMomGreatUncleChain.length === 0 && momMomGreatUncleRel === 'lb') {
        return '外叔曾祖父';
      }
      
      // 妈妈的妈妈的爸爸的兄弟的子女：表舅祖父/表姨祖母
      if (afterMomMomGreatUncleChain.length === 1) {
        if (afterMomMomGreatUncleChain[0] === 's') {
          return '表舅祖父';
        }
        if (afterMomMomGreatUncleChain[0] === 'd') {
          return '表姨祖母';
        }
      }
      
      // 妈妈的妈妈的爸爸的兄弟的孙子女：表舅父/表姨母
      if (afterMomMomGreatUncleChain.length === 2) {
        if (afterMomMomGreatUncleChain[0] === 's') {
          return '表舅父';
        }
        if (afterMomMomGreatUncleChain[0] === 'd') {
          return '表姨母';
        }
      }
      
      // 妈妈的妈妈的爸爸的兄弟的曾孙子女：表兄弟姐妹系列
      if (afterMomMomGreatUncleChain.length >= 3) {
        var lastGenGender = 'male';
        for (var i = afterMomMomGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterMomMomGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterMomMomGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        if (afterMomMomGreatUncleChain.length === 3) {
          return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
        }
        if (afterMomMomGreatUncleChain.length === 4) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
      }
    }
    
    // ========== 模式 0h-2：爸爸的爸爸的兄弟（叔祖父）及其后代 ==========
    // 关系链：[f, f, ob/lb, ...]
    if (chain.length >= 3 && chain[0] === 'f' && chain[1] === 'f' && 
        (chain[2] === 'ob' || chain[2] === 'lb')) {
      var greatUncleRel = chain[2]; // ob/lb
      var afterGreatUncleChain = chain.slice(3); // 去掉 [f, f, ob/lb] 后的关系链
      
      // 爸爸的爸爸的哥哥：伯祖父
      if (afterGreatUncleChain.length === 0 && greatUncleRel === 'ob') {
        return '伯祖父';
      }
      
      // 爸爸的爸爸的弟弟：叔祖父
      if (afterGreatUncleChain.length === 0 && greatUncleRel === 'lb') {
        return '叔祖父';
      }
      
      // 爸爸的爸爸的兄弟的妻子：伯祖母/叔祖母
      if (afterGreatUncleChain.length === 1 && afterGreatUncleChain[0] === 'w') {
        return greatUncleRel === 'ob' ? '伯祖母' : '叔祖母';
      }
      
      // 爸爸的爸爸的兄弟的子女：堂伯叔父/堂姑母
      if (afterGreatUncleChain.length === 1) {
        if (afterGreatUncleChain[0] === 's') {
          // 儿子：堂伯叔父（不区分长幼，统一称谓）
          return '堂伯叔父';
        }
        if (afterGreatUncleChain[0] === 'd') {
          // 女儿：堂姑母
          return '堂姑母';
        }
      }
      
      // 爸爸的爸爸的兄弟的子女的配偶
      if (afterGreatUncleChain.length === 2) {
        if (afterGreatUncleChain[0] === 's' && afterGreatUncleChain[1] === 'w') {
          // 儿子的妻子：堂伯叔母
          return '堂伯叔母';
        }
        if (afterGreatUncleChain[0] === 'd' && afterGreatUncleChain[1] === 'h') {
          // 女儿的丈夫：堂姑父
          return '堂姑父';
        }
      }
      
      // 爸爸的爸爸的兄弟的子女的后代（堂兄弟姐妹/表兄弟姐妹系列）
      if (afterGreatUncleChain.length >= 2) {
        // 判断最后一代性别
        var lastGenGender = 'male';
        for (var i = afterGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
      // 儿子的子女 = 堂兄弟姐妹
      if (afterGreatUncleChain[0] === 's') {
        if (afterGreatUncleChain.length === 2) {
          // 向下 1 代：堂兄弟/堂姐妹
          return lastGenGender === 'male' ? '堂兄弟' : '堂姐妹';
        }
        if (afterGreatUncleChain.length === 3) {
          // 向下 2 代：
          // [s, s, w] = 儿子的儿子的妻子 = 堂兄弟媳
          if (afterGreatUncleChain[1] === 's' && afterGreatUncleChain[2] === 'w') {
            return '堂兄弟媳';
          }
          // [s, d, h] = 儿子的女儿的丈夫 = 堂姐妹夫
          if (afterGreatUncleChain[1] === 'd' && afterGreatUncleChain[2] === 'h') {
            return '堂姐妹夫';
          }
          // [s, s] = 儿子的儿子 = 堂侄
          if (afterGreatUncleChain[1] === 's') {
            return '堂侄';
          }
          // [s, d] = 儿子的女儿 = 堂侄女
          if (afterGreatUncleChain[1] === 'd') {
            return '堂侄女';
          }
        }
        if (afterGreatUncleChain.length === 4) {
          // 向下 3 代：堂侄孙/堂侄孙女
          return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
        }
      }
        
        // 女儿的子女 = 表兄弟姐妹（因为女儿嫁出去，子女随外姓）
        if (afterGreatUncleChain[0] === 'd') {
          if (afterGreatUncleChain.length === 2) {
            // 向下 1 代：表兄弟/表姐妹
            return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
          }
          if (afterGreatUncleChain.length === 3) {
            // 向下 2 代：
            // [d, s, w] = 女儿的儿子的妻子 = 表兄弟媳
            if (afterGreatUncleChain[1] === 's' && afterGreatUncleChain[2] === 'w') {
              return '表兄弟媳';
            }
            // [d, d, h] = 女儿的女儿的丈夫 = 表姐妹夫
            if (afterGreatUncleChain[1] === 'd' && afterGreatUncleChain[2] === 'h') {
              return '表姐妹夫';
            }
            // [d, s] = 女儿的儿子 = 表侄
            if (afterGreatUncleChain[1] === 's') {
              return '表侄';
            }
            // [d, d] = 女儿的女儿 = 表侄女
            if (afterGreatUncleChain[1] === 'd') {
              return '表侄女';
            }
          }
          if (afterGreatUncleChain.length === 4) {
            // 向下 3 代：表侄孙/表侄孙女
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
      }
    }
    
    // ========== 模式 0h-3：爸爸的爸爸的姐妹（姑祖母）及其后代 ==========
    // 关系链：[f, f, os/ls, ...]
    if (chain.length >= 3 && chain[0] === 'f' && chain[1] === 'f' && 
        (chain[2] === 'os' || chain[2] === 'ls')) {
      var greatAuntRel = chain[2]; // os/ls
      var afterGreatAuntChain = chain.slice(3); // 去掉 [f, f, os/ls] 后的关系链
      
      // 爸爸的爸爸的姐姐：姑祖母
      if (afterGreatAuntChain.length === 0 && greatAuntRel === 'os') {
        return '姑祖母';
      }
      
      // 爸爸的爸爸的妹妹：姑祖母
      if (afterGreatAuntChain.length === 0 && greatAuntRel === 'ls') {
        return '姑祖母';
      }
      
      // 爸爸的爸爸的姐妹的丈夫：姑祖父
      if (afterGreatAuntChain.length === 1 && afterGreatAuntChain[0] === 'h') {
        return '姑祖父';
      }
      
      // 爸爸的爸爸的姐妹的子女：表伯叔父/表姑母
      if (afterGreatAuntChain.length === 1) {
        if (afterGreatAuntChain[0] === 's') {
          return '表伯叔父';
        }
        if (afterGreatAuntChain[0] === 'd') {
          return '表姑母';
        }
      }
      
      // 爸爸的爸爸的姐妹的子女的配偶
      if (afterGreatAuntChain.length === 2) {
        if (afterGreatAuntChain[0] === 's' && afterGreatAuntChain[1] === 'w') {
          return '表伯叔母';
        }
        if (afterGreatAuntChain[0] === 'd' && afterGreatAuntChain[1] === 'h') {
          return '表姑父';
        }
      }
      
      // 爸爸的爸爸的姐妹的子女的后代（表兄弟姐妹/表侄系列）
      if (afterGreatAuntChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterGreatAuntChain.length - 1; i >= 0; i--) {
          if (afterGreatAuntChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterGreatAuntChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 儿子的子女 = 表兄弟姐妹
        if (afterGreatAuntChain[0] === 's') {
          if (afterGreatAuntChain.length === 2) {
            return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
          }
          if (afterGreatAuntChain.length === 3) {
            if (afterGreatAuntChain[1] === 's' && afterGreatAuntChain[2] === 'w') {
              return '表兄弟媳';
            }
            if (afterGreatAuntChain[1] === 'd' && afterGreatAuntChain[2] === 'h') {
              return '表姐妹夫';
            }
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          if (afterGreatAuntChain.length === 4) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
        
        // 女儿的子女 = 表兄弟姐妹
        if (afterGreatAuntChain[0] === 'd') {
          if (afterGreatAuntChain.length === 2) {
            return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
          }
          if (afterGreatAuntChain.length === 3) {
            if (afterGreatAuntChain[1] === 's' && afterGreatAuntChain[2] === 'w') {
              return '表兄弟媳';
            }
            if (afterGreatAuntChain[1] === 'd' && afterGreatAuntChain[2] === 'h') {
              return '表姐妹夫';
            }
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          if (afterGreatAuntChain.length === 4) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
      }
    }
    
    // ========== 模式 0k：丈夫的爸爸的爸爸的兄弟（叔公祖父）及其后代 ==========
    // 关系链：[h, f, f, ob/lb, ...]
    if (chain.length >= 4 && chain[0] === 'h' && chain[1] === 'f' && chain[2] === 'f' && 
        (chain[3] === 'ob' || chain[3] === 'lb')) {
      var husbandGreatUncleRel = chain[3]; // ob/lb
      var afterHusbandGreatUncleChain = chain.slice(4); // 去掉 [h, f, f, ob/lb] 后的关系链
      
      // 丈夫的爸爸的爸爸的哥哥：伯公祖父
      if (afterHusbandGreatUncleChain.length === 0 && husbandGreatUncleRel === 'ob') {
        return '伯公祖父';
      }
      
      // 丈夫的爸爸的爸爸的弟弟：叔公祖父
      if (afterHusbandGreatUncleChain.length === 0 && husbandGreatUncleRel === 'lb') {
        return '叔公祖父';
      }
      
      // 丈夫的爸爸的爸爸的兄弟的妻子：伯公祖母/叔公祖母
      if (afterHusbandGreatUncleChain.length === 1 && afterHusbandGreatUncleChain[0] === 'w') {
        return husbandGreatUncleRel === 'ob' ? '伯公祖母' : '叔公祖母';
      }
      
      // 丈夫的爸爸的爸爸的兄弟的子女：堂伯公父/堂叔公父/堂姑母
      if (afterHusbandGreatUncleChain.length === 1) {
        if (afterHusbandGreatUncleChain[0] === 's') {
          return husbandGreatUncleRel === 'ob' ? '堂伯公父' : '堂叔公父';
        }
        if (afterHusbandGreatUncleChain[0] === 'd') {
          return '堂姑母';
        }
      }
      
      // 丈夫的爸爸的爸爸的兄弟的子女的配偶
      if (afterHusbandGreatUncleChain.length === 2) {
        if (afterHusbandGreatUncleChain[0] === 's' && afterHusbandGreatUncleChain[1] === 'w') {
          return husbandGreatUncleRel === 'ob' ? '堂伯公母' : '堂叔公母';
        }
        if (afterHusbandGreatUncleChain[0] === 'd' && afterHusbandGreatUncleChain[1] === 'h') {
          return '堂姑父';
        }
      }
      
      // 丈夫的爸爸的爸爸的兄弟的子女的后代（堂兄弟姐妹/表兄弟姐妹系列）
      if (afterHusbandGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterHusbandGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterHusbandGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterHusbandGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 儿子的子女 = 堂兄弟姐妹
        if (afterHusbandGreatUncleChain[0] === 's') {
          if (afterHusbandGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? '堂兄弟' : '堂姐妹';
          }
          if (afterHusbandGreatUncleChain.length === 3) {
            if (afterHusbandGreatUncleChain[1] === 's' && afterHusbandGreatUncleChain[2] === 'w') {
              return '堂兄弟媳';
            }
            if (afterHusbandGreatUncleChain[1] === 'd' && afterHusbandGreatUncleChain[2] === 'h') {
              return '堂姐妹夫';
            }
            return lastGenGender === 'male' ? '堂侄' : '堂侄女';
          }
          if (afterHusbandGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
          }
        }
        
        // 女儿的子女 = 表兄弟姐妹
        if (afterHusbandGreatUncleChain[0] === 'd') {
          if (afterHusbandGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
          }
          if (afterHusbandGreatUncleChain.length === 3) {
            if (afterHusbandGreatUncleChain[1] === 's' && afterHusbandGreatUncleChain[2] === 'w') {
              return '表兄弟媳';
            }
            if (afterHusbandGreatUncleChain[1] === 'd' && afterHusbandGreatUncleChain[2] === 'h') {
              return '表姐妹夫';
            }
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          if (afterHusbandGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
      }
    }
    
    // ========== 模式 0k-2：妻子的爸爸的爸爸的兄弟姐妹（姑祖母/叔祖父）及其后代 ==========
    // 关系链：[w, f, f, ob/lb/os/ls, ...]
    if (chain.length >= 4 && chain[0] === 'w' && chain[1] === 'f' && chain[2] === 'f' &&
        (chain[3] === 'ob' || chain[3] === 'lb' || chain[3] === 'os' || chain[3] === 'ls')) {
      var wifeGreatUncleRel = chain[3];
      var afterWifeGreatUncleChain = chain.slice(4);
      
      // 妻子的爸爸的爸爸的哥哥：伯祖父
      if (afterWifeGreatUncleChain.length === 0 && wifeGreatUncleRel === 'ob') {
        return '伯祖父';
      }
      
      // 妻子的爸爸的爸爸的弟弟：叔祖父
      if (afterWifeGreatUncleChain.length === 0 && wifeGreatUncleRel === 'lb') {
        return '叔祖父';
      }
      
      // 妻子的爸爸的爸爸的姐姐：姑祖母
      if (afterWifeGreatUncleChain.length === 0 && wifeGreatUncleRel === 'os') {
        return '姑祖母';
      }
      
      // 妻子的爸爸的爸爸的妹妹：姑祖母
      if (afterWifeGreatUncleChain.length === 0 && wifeGreatUncleRel === 'ls') {
        return '姑祖母';
      }
      
      // 妻子的爸爸的爸爸的姐妹的丈夫：姑祖父
      if (afterWifeGreatUncleChain.length === 1 && afterWifeGreatUncleChain[0] === 'h') {
        return '姑祖父';
      }
      
      // 妻子的爸爸的爸爸的兄弟姐妹的子女：堂伯叔父/堂姑母/表伯叔父/表姑母
      if (afterWifeGreatUncleChain.length === 1) {
        if (afterWifeGreatUncleChain[0] === 's') {
          // 兄弟的儿子：堂伯叔父（爸爸的爸爸的兄弟的孙子=堂亲）
          if (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb') {
            return '堂伯叔父';
          }
          // 姐妹的儿子：表伯叔父（爸爸的爸爸的姐妹的孙子=表亲）
          return '表伯叔父';
        }
        if (afterWifeGreatUncleChain[0] === 'd') {
          // 兄弟的女儿：堂姑母
          if (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb') {
            return '堂姑母';
          }
          // 姐妹的女儿：表姑母
          return '表姑母';
        }
      }
      
      // 妻子的爸爸的爸爸的兄弟姐妹的子女的配偶
      if (afterWifeGreatUncleChain.length === 2) {
        if (afterWifeGreatUncleChain[0] === 's' && afterWifeGreatUncleChain[1] === 'w') {
          if (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb') {
            return '堂伯叔母';
          }
          return '表伯叔母';
        }
        if (afterWifeGreatUncleChain[0] === 'd' && afterWifeGreatUncleChain[1] === 'h') {
          if (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb') {
            return '堂姑父';
          }
          return '表姑父';
        }
      }
      
      // 妻子的爸爸的爸爸的兄弟姐妹的子女的后代（堂兄弟姐妹/表兄弟姐妹系列）
      if (afterWifeGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterWifeGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterWifeGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterWifeGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        var isTangQin = (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb');
        var qinPrefix = isTangQin ? '堂' : '表';
        
        // 儿子的子女
        if (afterWifeGreatUncleChain[0] === 's') {
          if (afterWifeGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? (qinPrefix + '兄弟') : (qinPrefix + '姐妹');
          }
          if (afterWifeGreatUncleChain.length === 3) {
            if (afterWifeGreatUncleChain[1] === 's' && afterWifeGreatUncleChain[2] === 'w') {
              return qinPrefix + '兄弟媳';
            }
            if (afterWifeGreatUncleChain[1] === 'd' && afterWifeGreatUncleChain[2] === 'h') {
              return qinPrefix + '姐妹夫';
            }
            return lastGenGender === 'male' ? (qinPrefix + '侄') : (qinPrefix + '侄女');
          }
          if (afterWifeGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? (qinPrefix + '侄孙') : (qinPrefix + '侄孙女');
          }
        }
        
        // 女儿的子女
        if (afterWifeGreatUncleChain[0] === 'd') {
          if (afterWifeGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? (qinPrefix + '兄弟') : (qinPrefix + '姐妹');
          }
          if (afterWifeGreatUncleChain.length === 3) {
            if (afterWifeGreatUncleChain[1] === 's' && afterWifeGreatUncleChain[2] === 'w') {
              return qinPrefix + '兄弟媳';
            }
            if (afterWifeGreatUncleChain[1] === 'd' && afterWifeGreatUncleChain[2] === 'h') {
              return qinPrefix + '姐妹夫';
            }
            return lastGenGender === 'male' ? (qinPrefix + '侄') : (qinPrefix + '侄女');
          }
          if (afterWifeGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? (qinPrefix + '侄孙') : (qinPrefix + '侄孙女');
          }
        }
      }
    }
    
    // ========== 模式 0k-3：丈夫的爸爸的妈妈的兄弟（外伯祖父/外叔祖父）及其后代 ==========
    // 关系链：[h, f, m, ob/lb, ...]
    if (chain.length >= 4 && chain[0] === 'h' && chain[1] === 'f' && chain[2] === 'm' &&
        (chain[3] === 'ob' || chain[3] === 'lb')) {
      var husbandFmSibRel = chain[3]; // ob/lb
      var afterHusbandFmSibChain = chain.slice(4); // 去掉 [h, f, m, ob/lb] 后的关系链
      
      // 丈夫的爸爸的妈妈的哥哥：外伯祖父
      if (afterHusbandFmSibChain.length === 0 && husbandFmSibRel === 'ob') {
        return '外伯祖父';
      }
      
      // 丈夫的爸爸的妈妈的弟弟：外叔祖父
      if (afterHusbandFmSibChain.length === 0 && husbandFmSibRel === 'lb') {
        return '外叔祖父';
      }
      
      // 丈夫的爸爸的妈妈的哥哥的妻子：外伯祖母
      if (afterHusbandFmSibChain.length === 1 && husbandFmSibRel === 'ob' && afterHusbandFmSibChain[0] === 'w') {
        return '外伯祖母';
      }
      
      // 丈夫的爸爸的妈妈的弟弟的妻子：外叔祖母
      if (afterHusbandFmSibChain.length === 1 && husbandFmSibRel === 'lb' && afterHusbandFmSibChain[0] === 'w') {
        return '外叔祖母';
      }
      
      // 丈夫的爸爸的妈妈的兄弟的儿子：表伯叔父
      if (afterHusbandFmSibChain.length === 1 && afterHusbandFmSibChain[0] === 's') {
        return '表伯叔父';
      }
      
      // 丈夫的爸爸的妈妈的兄弟的儿子的妻子：表伯叔母
      if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 'w') {
        return '表伯叔母';
      }
      
      // 丈夫的爸爸的妈妈的兄弟的子女的后代（表兄弟姐妹系列）
      if (afterHusbandFmSibChain.length >= 1 && (afterHusbandFmSibChain[0] === 's' || afterHusbandFmSibChain[0] === 'd')) {
        var lastGenGender = 'male';
        for (var i = afterHusbandFmSibChain.length - 1; i >= 0; i--) {
          if (afterHusbandFmSibChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterHusbandFmSibChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表姑父：丈夫的爸爸的妈妈的兄弟的女儿的丈夫 [h,f,m,ob/lb,d,h]
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 'h') {
          return '表姑父';
        }
        
        // 表姑母：丈夫的爸爸的妈妈的兄弟的女儿 [h,f,m,ob/lb,d]
        if (afterHusbandFmSibChain.length === 1 && afterHusbandFmSibChain[0] === 'd') {
          return '表姑母';
        }
        
        // 表伯叔父：丈夫的爸爸的妈妈的兄弟的儿子 [h,f,m,ob/lb,s]
        if (afterHusbandFmSibChain.length === 1 && afterHusbandFmSibChain[0] === 's') {
          return '表伯叔父';
        }
        
        // 表伯叔母：丈夫的爸爸的妈妈的兄弟的儿子的妻子 [h,f,m,ob/lb,s,w]
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 'w') {
          return '表伯叔母';
        }
        
        // 女儿的子女：[d, s] 表兄弟，[d, d] 表姐妹
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 's') {
          return '表兄弟';
        }
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 'd') {
          return '表姐妹';
        }
        
        // 女儿的子女的配偶：[d, s, w] 表兄弟媳，[d, d, h] 表姐妹夫
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 's' && afterHusbandFmSibChain[2] === 'w') {
          return '表兄弟媳';
        }
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 'd' && afterHusbandFmSibChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 儿子的子女：[s, s] 表兄弟，[s, d] 表姐妹（外伯祖父的孙辈和我同辈）
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 's') {
          return '表兄弟';
        }
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 'd') {
          return '表姐妹';
        }
        
        // 儿子的子女的配偶：[s, s, w] 表兄弟媳，[s, d, h] 表姐妹夫
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 's' && afterHusbandFmSibChain[2] === 'w') {
          return '表兄弟媳';
        }
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 'd' && afterHusbandFmSibChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表侄/表侄女（向下 1 代）- 儿子的孙子女
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 's' && (afterHusbandFmSibChain[1] === 's' || afterHusbandFmSibChain[1] === 'd')) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        
        // 表侄孙/表侄孙女（向下 2 代）
        if (afterHusbandFmSibChain.length === 4) {
          return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
        }
      }
    }
    
    // 爸爸的兄弟姐妹的儿子：堂兄弟/表兄弟
    // 爸爸的同辈兄弟（伯伯/叔叔）的儿子 = 堂兄弟
    // 爸爸的姐妹（姑妈）的儿子 = 表兄弟
    if (chain.length === 3 && chain[0] === 'f' && 
        (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 's') {
      return '堂兄弟';
    }
    
    if (chain.length === 3 && chain[0] === 'f' && 
        (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 's') {
      return '表兄弟';
    }
    
    // 爸爸的兄弟姐妹的女儿：堂姐妹/表姐妹
    if (chain.length === 3 && chain[0] === 'f' && 
        (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 'd') {
      return '堂姐妹';
    }
    
    if (chain.length === 3 && chain[0] === 'f' && 
        (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 'd') {
      return '表姐妹';
    }
    
    // ========== 模式 0h-4：爸爸的兄弟的子女的后代（堂亲系列） ==========
    // 关系链：[f, ob/lb, s/d, ...]
    if (chain.length >= 4 && chain[0] === 'f' && 
        (chain[1] === 'ob' || chain[1] === 'lb')) {
      var dadSibRel = chain[1]; // ob/lb
      var afterDadSibChildChain = chain.slice(2); // 去掉 [f, ob/lb] 后的关系链
      
      // 爸爸的兄弟的儿子的妻子：堂兄弟媳
      if (afterDadSibChildChain.length === 2 && afterDadSibChildChain[0] === 's' && afterDadSibChildChain[1] === 'w') {
        return '堂兄弟媳';
      }
      
      // 爸爸的兄弟的儿子的子女：堂侄/堂侄女
      if (afterDadSibChildChain.length === 2 && afterDadSibChildChain[0] === 's') {
        var childGender = afterDadSibChildChain[1];
        if (childGender === 's') return '堂侄';
        if (childGender === 'd') return '堂侄女';
      }
      
      // 爸爸的兄弟的儿子的女儿的丈夫：堂侄女婿
      if (afterDadSibChildChain.length === 3 && afterDadSibChildChain[0] === 's' && 
          afterDadSibChildChain[1] === 'd' && afterDadSibChildChain[2] === 'h') {
        return '堂侄女婿';
      }
      
      // 爸爸的兄弟的女儿的丈夫：堂姐妹夫
      if (afterDadSibChildChain.length === 2 && afterDadSibChildChain[0] === 'd' && afterDadSibChildChain[1] === 'h') {
        return '堂姐妹夫';
      }
      
      // 爸爸的兄弟的女儿的子女：堂外甥/堂外甥女（修复：安文杰/付芊雨视角）
      if (afterDadSibChildChain.length === 2 && afterDadSibChildChain[0] === 'd') {
        var childGender = afterDadSibChildChain[1];
        if (childGender === 's') return '堂外甥';
        if (childGender === 'd') return '堂外甥女';
      }
      
      // 爸爸的兄弟的女儿的子女的配偶：堂外甥媳/堂外甥女婿
      if (afterDadSibChildChain.length === 3 && afterDadSibChildChain[0] === 'd') {
        if (afterDadSibChildChain[1] === 's' && afterDadSibChildChain[2] === 'w') {
          return '堂外甥媳';
        }
        if (afterDadSibChildChain[1] === 'd' && afterDadSibChildChain[2] === 'h') {
          return '堂外甥女婿';
        }
      }
    }
    
    // 妈妈的兄弟姐妹的儿子：表兄弟
    if (chain.length === 3 && chain[0] === 'm' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls') && 
        chain[2] === 's') {
      return '表兄弟';
    }
    
    // 妈妈的兄弟姐妹的女儿：表姐妹
    if (chain.length === 3 && chain[0] === 'm' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls') && 
        chain[2] === 'd') {
      return '表姐妹';
    }
    
    // 妈妈的兄弟姐妹的儿子的妻子：表兄弟媳
    if (chain.length === 4 && chain[0] === 'm' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls') && 
        chain[2] === 's' && chain[3] === 'w') {
      return '表兄弟媳';
    }
    
    // 妈妈的兄弟姐妹的女儿的丈夫：表姐妹夫
    if (chain.length === 4 && chain[0] === 'm' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls') && 
        chain[2] === 'd' && chain[3] === 'h') {
      return '表姐妹夫';
    }
    
    // 妈妈的姐姐的儿子（姨妈的儿子）的后续处理 - 表兄弟的后代
    // 关系链：[m, os, s, ...]
    if (chain.length >= 4 && chain[0] === 'm' && chain[1] === 'os' && chain[2] === 's') {
      var afterCousinChain = chain.slice(3);
      
      // 妈妈的姐姐的儿子的妻子：表嫂
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'w') {
        return '表嫂';
      }
      
      // 妈妈的姐姐的儿子的儿子：表侄
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 's') {
        return '表侄';
      }
      
      // 妈妈的姐姐的儿子的女儿：表侄女
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'd') {
        return '表侄女';
      }
      
      // 妈妈的姐姐的儿子的女儿的丈夫：表侄女婿
      if (afterCousinChain.length === 2 && afterCousinChain[0] === 'd' && afterCousinChain[1] === 'h') {
        return '表侄女婿';
      }
      
      // 妈妈的姐姐的儿子的女儿的儿子：表外孙（女儿的儿子，不是女儿的丈夫的儿子）
      if (afterCousinChain.length === 2 && afterCousinChain[0] === 'd' && afterCousinChain[1] === 's') {
        return '表外孙';
      }
      
      // 妈妈的姐姐的儿子的女儿的儿子的儿子：表外曾孙
      if (afterCousinChain.length === 3 && afterCousinChain[0] === 'd' && afterCousinChain[1] === 's' && afterCousinChain[2] === 's') {
        return '表外曾孙';
      }
      
      // 妈妈的姐姐的儿子的女儿的儿子的儿子的儿子：表外玄孙
      if (afterCousinChain.length === 4 && afterCousinChain[0] === 'd' && afterCousinChain[1] === 's' && afterCousinChain[2] === 's' && afterCousinChain[3] === 's') {
        return '表外玄孙';
      }
    }
    
    // 妈妈的姐姐的女儿（姨妈的女儿）的后续处理
    // 关系链：[m, os, d, ...]
    if (chain.length >= 4 && chain[0] === 'm' && chain[1] === 'os' && chain[2] === 'd') {
      var afterCousinDChain = chain.slice(3);
      
      // 妈妈的姐姐的女儿的丈夫：表姐夫
      if (afterCousinDChain.length === 1 && afterCousinDChain[0] === 'h') {
        return '表姐夫';
      }
      
      // 妈妈的姐姐的女儿的儿子：表外孙
      if (afterCousinDChain.length === 1 && afterCousinDChain[0] === 's') {
        return '表外孙';
      }
      
      // 妈妈的姐姐的女儿的女儿：表外孙女
      if (afterCousinDChain.length === 1 && afterCousinDChain[0] === 'd') {
        return '表外孙女';
      }
      
      // 妈妈的姐姐的女儿的儿子的丈夫：表外孙女婿
      if (afterCousinDChain.length === 2 && afterCousinDChain[0] === 's' && afterCousinDChain[1] === 'h') {
        return '表外孙女婿';
      }
      
      // 妈妈的姐姐的女儿的儿子的儿子：表外曾孙
      if (afterCousinDChain.length === 3 && afterCousinDChain[0] === 's' && afterCousinDChain[1] === 'h' && afterCousinDChain[2] === 's') {
        return '表外曾孙';
      }
      
      // 妈妈的姐姐的女儿的儿子的女儿的丈夫：表外曾孙女婿
      if (afterCousinDChain.length === 4 && afterCousinDChain[0] === 's' && afterCousinDChain[1] === 'h' && afterCousinDChain[2] === 'd' && afterCousinDChain[3] === 'h') {
        return '表外曾孙女婿';
      }
      
      // 妈妈的姐姐的女儿的儿子的女儿的儿子的儿子：表外玄孙
      if (afterCousinDChain.length === 5 && afterCousinDChain[0] === 's' && afterCousinDChain[1] === 'h' && afterCousinDChain[2] === 'd' && afterCousinDChain[3] === 'h' && afterCousinDChain[4] === 's') {
        return '表外玄孙';
      }
    }
    
    // 爸爸的哥哥/弟弟的儿子的后代（堂侄系列）
    // 关系链：[f, ob/lb, s, ...]
    if (chain.length >= 4 && chain[0] === 'f' && (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 's') {
      var afterCousinChain = chain.slice(3);
      
      // 爸爸的哥哥/弟弟的儿子的儿子：堂侄
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 's') {
        return '堂侄';
      }
      
      // 爸爸的哥哥/弟弟的儿子的女儿：堂侄女
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'd') {
        return '堂侄女';
      }
    }
    
    // 爸爸的姐姐/妹妹的儿子的后代（表侄系列）
    // 关系链：[f, os/ls, s, ...]
    if (chain.length >= 4 && chain[0] === 'f' && (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 's') {
      var afterCousinChain = chain.slice(3);
      
      // 爸爸的姐姐/妹妹的儿子的儿子：表侄
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 's') {
        return '表侄';
      }
      
      // 爸爸的姐姐/妹妹的儿子的女儿：表侄女
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'd') {
        return '表侄女';
      }
    }
    
    // 妈妈的兄弟姐妹的儿子的后代（表侄系列）
    // 关系链：[m, ob/lb/os/ls, s, ...]
    if (chain.length >= 4 && chain[0] === 'm' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls') && 
        chain[2] === 's') {
      var afterCousinChain = chain.slice(3);
      
      // 妈妈的兄弟姐妹的儿子的儿子：表侄
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 's') {
        return '表侄';
      }
      
      // 妈妈的兄弟姐妹的儿子的女儿：表侄女
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'd') {
        return '表侄女';
      }
      
      // 妈妈的兄弟姐妹的儿子的儿子的妻子：表侄媳
      if (afterCousinChain.length === 2 && afterCousinChain[0] === 's' && afterCousinChain[1] === 'w') {
        return '表侄媳';
      }
      
      // 妈妈的兄弟姐妹的儿子的女儿的丈夫：表侄女婿
      if (afterCousinChain.length === 2 && afterCousinChain[0] === 'd' && afterCousinChain[1] === 'h') {
        return '表侄女婿';
      }
      
      // 妈妈的兄弟姐妹的儿子的孙子孙女：表侄孙/表侄孙女
      if (afterCousinChain.length === 2 && afterCousinChain[0] === 's') {
        if (afterCousinChain[1] === 's') return '表侄孙';
        if (afterCousinChain[1] === 'd') return '表侄孙女';
      }
    }
    
    // 妈妈的兄弟姐妹的女儿的后代（表外甥系列）
    // 关系链：[m, ob/lb/os/ls, d, ...]
    if (chain.length >= 4 && chain[0] === 'm' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls') && 
        chain[2] === 'd') {
      var afterCousinDChain = chain.slice(3);
      
      // 妈妈的兄弟姐妹的女儿的儿子：表外甥
      if (afterCousinDChain.length === 1 && afterCousinDChain[0] === 's') {
        return '表外甥';
      }
      
      // 妈妈的兄弟姐妹的女儿的女儿：表外甥女
      if (afterCousinDChain.length === 1 && afterCousinDChain[0] === 'd') {
        return '表外甥女';
      }
      
      // 妈妈的兄弟姐妹的女儿的儿子的妻子：表外甥媳
      if (afterCousinDChain.length === 2 && afterCousinDChain[0] === 's' && afterCousinDChain[1] === 'w') {
        return '表外甥媳';
      }
      
      // 妈妈的兄弟姐妹的女儿的女儿的丈夫：表外甥女婿
      if (afterCousinDChain.length === 2 && afterCousinDChain[0] === 'd' && afterCousinDChain[1] === 'h') {
        return '表外甥女婿';
      }
      
      // 妈妈的兄弟姐妹的女儿的孙子孙女：表外甥孙/表外甥孙女
      if (afterCousinDChain.length === 2 && afterCousinDChain[0] === 's') {
        if (afterCousinDChain[1] === 's') return '表外甥孙';
        if (afterCousinDChain[1] === 'd') return '表外甥孙女';
      }
    }
    
    // ========== 模式 0i：爸爸的兄弟姐妹的后代及其配偶（堂亲/表亲系列） ==========
    // 处理：爸爸的哥哥/弟弟/姐姐/妹妹的子女及其配偶、后代
    // 关系链：[f, ob/lb/os/ls, s/d, ...]
    if (chain.length >= 3 && chain[0] === 'f' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls')) {
      var sibRel = chain[1]; // ob/lb/os/ls
      var afterCousinChain = chain.slice(2); // 去掉 [f, sib] 后的关系链
      
      // 判断父系/母系：爸爸的兄弟 = 堂亲，爸爸的姐妹 = 表亲
      var isTang = (sibRel === 'ob' || sibRel === 'lb'); // 堂亲
      var isBiao = (sibRel === 'os' || sibRel === 'ls'); // 表亲
      
      // 判断堂亲/表亲性别
      var cousinIsMale = (afterCousinChain.length >= 1 && afterCousinChain[0] === 's');
      
      // 爸爸的兄弟姐妹的子女：堂兄弟姐妹/表兄弟姐妹
      if (afterCousinChain.length === 1) {
        if (afterCousinChain[0] === 's') {
          // 爸爸的兄弟姐妹的儿子：堂兄弟/表兄弟（区分长幼）
          if (isTang) {
            if (sibRel === 'ob') return '堂兄';
            if (sibRel === 'lb') return '堂弟';
          }
          if (isBiao) {
            if (sibRel === 'os') return '表兄';
            if (sibRel === 'ls') return '表弟';
          }
        }
        if (afterCousinChain[0] === 'd') {
          // 爸爸的兄弟姐妹的女儿：堂姐妹/表姐妹（区分长幼）
          if (isTang) {
            if (sibRel === 'ob') return '堂姐';
            if (sibRel === 'lb') return '堂妹';
          }
          if (isBiao) {
            if (sibRel === 'os') return '表姐';
            if (sibRel === 'ls') return '表妹';
          }
        }
      }
      
      // 爸爸的兄弟姐妹的子女的配偶
      if (afterCousinChain.length === 2 && (afterCousinChain[1] === 'w' || afterCousinChain[1] === 'h')) {
        var childGender = (afterCousinChain[0] === 's') ? 'male' : 'female';
        var spouseGender = (afterCousinChain[1] === 'h') ? 'male' : 'female';
        
        // 堂兄弟/表兄弟的妻子
        if (childGender === 'male' && spouseGender === 'female') {
          if (isTang) {
            if (sibRel === 'ob' || sibRel === 'os') return '堂嫂'; // 堂兄的妻子
            if (sibRel === 'lb' || sibRel === 'ls') return '堂弟媳'; // 堂弟的妻子
          }
          if (isBiao) {
            if (sibRel === 'ob' || sibRel === 'os') return '表嫂'; // 表兄的妻子
            if (sibRel === 'lb' || sibRel === 'ls') return '表弟媳'; // 表弟的妻子
          }
        }
        // 堂姐妹/表姐妹的丈夫
        if (childGender === 'female' && spouseGender === 'male') {
          if (isTang) {
            if (sibRel === 'ob' || sibRel === 'os') return '堂姐夫'; // 堂姐的丈夫
            if (sibRel === 'lb' || sibRel === 'ls') return '堂妹夫'; // 堂妹的丈夫
          }
          if (isBiao) {
            if (sibRel === 'ob' || sibRel === 'os') return '表姐夫'; // 表姐的丈夫
            if (sibRel === 'lb' || sibRel === 'ls') return '表妹夫'; // 表妹的丈夫
          }
        }
      }
      
      // 爸爸的兄弟姐妹的子女的后代（堂外甥/堂外甥女系列）
      // 关系链：[f, sib, d, s/d] 或 [f, sib, s, s/d]
      if (afterCousinChain.length >= 2) {
        var genDown = 0;
        for (var i = 0; i < afterCousinChain.length; i++) {
          if (afterCousinChain[i] === 's' || afterCousinChain[i] === 'd') genDown++;
        }
        
        // 判断最后一代性别
        var lastGenGender = 'male';
        for (var i = afterCousinChain.length - 1; i >= 0; i--) {
          if (afterCousinChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterCousinChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 判断是否有女儿路径（外系）
        var hasDaughterPath = (afterCousinChain.indexOf('d') >= 0);
        
        // 向下 1 代：堂外甥/堂外甥女 或 表侄/表侄女
        if (genDown === 2) {
          // 堂兄弟的子女 = 堂侄，堂姐妹的子女 = 堂外甥
          // 表兄弟的子女 = 表侄，表姐妹的子女 = 表外甥
          if (isTang) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '堂侄' : '堂侄女';
            } else {
              return lastGenGender === 'male' ? '堂外甥' : '堂外甥女';
            }
          }
          if (isBiao) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '表侄' : '表侄女';
            } else {
              return lastGenGender === 'male' ? '表外甥' : '表外甥女';
            }
          }
        }
        
        // 向下 2 代：堂侄孙/堂外甥孙 或 表侄孙/表外甥孙
        if (genDown === 3) {
          if (isTang) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
            } else {
              return lastGenGender === 'male' ? '堂外甥孙' : '堂外甥孙女';
            }
          }
          if (isBiao) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
            } else {
              return lastGenGender === 'male' ? '表外甥孙' : '表外甥孙女';
            }
          }
        }
        
        // 向下 3 代：堂侄曾孙/堂外甥曾孙 或 表侄曾孙/表外甥曾孙
        if (genDown === 4) {
          if (isTang) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '堂侄曾孙' : '堂侄曾孙女';
            } else {
              return lastGenGender === 'male' ? '堂外甥曾孙' : '堂外甥曾孙女';
            }
          }
          if (isBiao) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '表侄曾孙' : '表侄曾孙女';
            } else {
              return lastGenGender === 'male' ? '表外甥曾孙' : '表外甥曾孙女';
            }
          }
        }
        
        // 向下 4 代及以上：通用公式
        if (genDown >= 5) {
          var downPrefix = ['', '', '', '孙', '曾', '玄', '来', '昆', '仍', '云'];
          var prefix = (genDown >= 3 && genDown < downPrefix.length) ? downPrefix[genDown] : '远';
          if (isTang) {
            if (cousinIsMale) {
              return '堂侄' + prefix + (lastGenGender === 'male' ? '' : '女');
            } else {
              return '堂外甥' + prefix + (lastGenGender === 'male' ? '' : '女');
            }
          }
          if (isBiao) {
            if (cousinIsMale) {
              return '表侄' + prefix + (lastGenGender === 'male' ? '' : '女');
            } else {
              return '表外甥' + prefix + (lastGenGender === 'male' ? '' : '女');
            }
          }
        }
      }
    }
    

    // ========== 模式 1：纯向上祖先 ==========
    if (sisterIndex < 0 && spouseIndex < 0 && genDown === 0) {
      if (genUp === 1) return (lastGender === 'male') ? '爸爸' : '妈妈';
      if (genUp === 2) return (lastGender === 'male') ? '爷爷' : '奶奶';
      if (genUp >= 3 && genUp <= 8) {
        var prefix = genPrefixFull[genUp] || '远祖';
        var externalPrefix = (genUp >= 6 && maternalCount >= 2) ? '外' : '';
        return externalPrefix + prefix + (lastGender === 'male' ? '父' : '母');
      }
      return '远祖' + (lastGender === 'male' ? '父' : '母');
    }
    
    // ========== 模式 2：姻系列（有姐妹的配偶，且配偶后有其他关系） ==========
    // 排除：妻子的姐妹的丈夫的子女（由模式 0f 处理）
    var isWifeSisterSpouseChild = (chain.length >= 4 && chain[0] === 'w' && 
        (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 'h' && 
        (chain[3] === 's' || chain[3] === 'd'));
    if (hasSibSpouse && spouseHasAfter && !isWifeSisterSpouseChild) {
      var genBeforeSister = 0;
      for (var i = 0; i < sisterIndex; i++) {
        if (chain[i] === 'f' || chain[i] === 'm') genBeforeSister++;
      }
      
      var afterChain = chain.slice(spouseIndex + 1);
      
      // 计算配偶后的祖先代数
      var genAfterSpouse = 0;
      for (var i = 0; i < afterChain.length; i++) {
        if (afterChain[i] === 'f' || afterChain[i] === 'm') genAfterSpouse++;
      }
      var totalGen = genBeforeSister + genAfterSpouse;
      
      // 判断最后一代性别
      var afterLastGender = 'male';
      for (var i = afterChain.length - 1; i >= 0; i--) {
        var rel = afterChain[i];
        if (rel === 'f' || rel === 'ob' || rel === 'lb' || rel === 's' || rel === 'h') {
          afterLastGender = 'male'; break;
        } else if (rel === 'm' || rel === 'os' || rel === 'ls' || rel === 'd' || rel === 'w') {
          afterLastGender = 'female'; break;
        }
      }
      
      var hasSpouseChild = (afterChain.indexOf('s') >= 0 || afterChain.indexOf('d') >= 0);
      var hasSpouseParent = (afterChain.indexOf('f') >= 0 || afterChain.indexOf('m') >= 0);
      var hasSpouseSibling = false;
      for (var i = 0; i < afterChain.length; i++) {
        if (afterChain[i] === 'ob' || afterChain[i] === 'lb' || afterChain[i] === 'os' || afterChain[i] === 'ls') {
          hasSpouseSibling = true; break;
        }
      }
      
      if (hasSpouseChild) {
        // 修复 v711-69-3: 子女的称谓前缀比兄弟姐妹低一代，使用 totalGen - 1
        // 例如：爸爸的妈妈的爸爸的妈妈的妹妹的丈夫的姐姐的儿子（totalGen=4）
        // 应该返回'姻曾祖父'（曾祖=索引 3=4-1），而非'姻高伯叔祖父'（高祖=索引 4）
        var lastChild = null;
        for (var i = afterChain.length - 1; i >= 0; i--) {
          if (afterChain[i] === 's') { lastChild = 'son'; break; }
          else if (afterChain[i] === 'd') { lastChild = 'daughter'; break; }
        }
        // 子女情况：使用'父'/'母'后缀，前缀索引为 totalGen - 1
        var basePrefix = genPrefixFull[totalGen - 1] || '远祖';
        if (lastChild === 'son') return '姻' + basePrefix + '父';
        if (lastChild === 'daughter') return '姻' + basePrefix + '母';
      }
      
      if (hasSpouseParent) {
        var basePrefix = genPrefixFull[totalGen] || '烈祖';
        return '姻' + basePrefix + (afterLastGender === 'male' ? '父' : '母');
      }
      
      if (hasSpouseSibling) {
        // 修复 v711-69: 根据 totalGen 计算前缀，不要硬编码'姻高天祖'
        // 例如：爸爸的爸爸的妈妈的爸爸的妈妈的妹妹的丈夫的姐姐
        // totalGen = 4 (爸爸→爸爸→妈妈→爸爸)，应该返回'姻高祖父'而非'姻高天祖父'
        var basePrefix = genPrefixFull[totalGen] || '远祖';
        return '姻' + basePrefix + (afterLastGender === 'male' ? '父' : '母');
      }
    }
    
    // ========== 模式 3：姨/舅系列（有姐妹，无向下，或姐妹的配偶但配偶后无其他关系） ==========
    // 修复：排除姐妹前面有'w'的情况（那是妻子的姐妹，属于姻亲系列）
    // 修复 v711-51-fix-v57: 排除丈夫的妈妈的亲属（chain[0]='h'且 chain[1]='m'，由模式 0g-3 处理）
    if (sisterIndex >= 0 && genDown === 0 && (sisterIndex === 0 || chain[sisterIndex - 1] !== 'w')) {
      // 排除女性视角看丈夫方亲属的情况（由模式 0g-3 处理）
      if (chain.length >= 2 && chain[0] === 'h' && chain[1] === 'm') {
        // 让模式 0g-3 处理，不在此返回
      } else {
      var genBeforeSister = 0;
      for (var i = 0; i < sisterIndex; i++) {
        if (chain[i] === 'f' || chain[i] === 'm') genBeforeSister++;
      }
      
      var isSister = (chain[sisterIndex] === 'os' || chain[sisterIndex] === 'ls');
      var sibParentIsMother = (sisterIndex > 0 && chain[sisterIndex - 1] === 'm');
      
      var afterSisterChain = chain.slice(sisterIndex + 1);
      var afterAncestors = [];
      for (var i = 0; i < afterSisterChain.length; i++) {
        if (afterSisterChain[i] === 'f' || afterSisterChain[i] === 'm') {
          afterAncestors.push(afterSisterChain[i]);
        }
      }
      
      var afterLastGender;
      if (afterAncestors.length > 0) {
        afterLastGender = (afterAncestors[afterAncestors.length - 1] === 'f') ? 'male' : 'female';
      } else if (hasSibSpouse && spouseIndex >= 0) {
        afterLastGender = 'male';
      } else {
        afterLastGender = isSister ? 'female' : 'male';
      }
      
      var basePrefix = genPrefixSingle[genBeforeSister] || '远';
      
      if (isSister && sibParentIsMother) {
        return basePrefix + '姨' + (afterLastGender === 'male' ? '祖父' : '祖母');
      } else if (isSister) {
        return basePrefix + '姑' + (afterLastGender === 'male' ? '祖父' : '祖母');
      }
      }
    }
    
    // ========== 模式 4：表系列（有姐妹，有向下） ==========
    // 修复 v711-51-fix-v10: 排除配偶在姐妹之前的情况（那是姻亲系列）
    // 条件：配偶不在姐妹之前（spouseIndex < 0 或 spouseIndex > sisterIndex）
    // 修复 v711-51-fix-v24: 排除姐妹前面有'w'的情况（那是妻子的姐妹，属于姻亲系列）
    if (sisterIndex >= 0 && genDown > 0 && (spouseIndex < 0 || spouseIndex > sisterIndex) && (sisterIndex === 0 || chain[sisterIndex - 1] !== 'w')) {
      var genBeforeSister = 0;
      for (var i = 0; i < sisterIndex; i++) {
        if (chain[i] === 'f' || chain[i] === 'm') genBeforeSister++;
      }
      
      var isSister = (chain[sisterIndex] === 'os' || chain[sisterIndex] === 'ls');
      var sibParentIsMother = (sisterIndex > 0 && chain[sisterIndex - 1] === 'm');
      
      // 修复 v711-69: 判断父系/母系应该看关系链的第一个祖先，而非姐妹的直接上级
      // 爸爸的姐妹的后代 = 表侄（父系），妈妈的姐妹的后代 = 表外甥（母系）
      var isPaternal = false; // 父系
      var isMaternal = false; // 母系
      for (var i = 0; i < sisterIndex; i++) {
        if (chain[i] === 'f') { isPaternal = true; break; }
        if (chain[i] === 'm') { isMaternal = true; break; }
      }
      
      // 修复 v711-69: 判断表亲性别（表兄弟 vs 表姐妹）决定用"侄"还是"外甥"
      // 表兄弟的子女 = 表侄，表姐妹的子女 = 表外甥
      // 方法：平辈表亲的位置 = 从姐妹关系开始向下 genBeforeSister 代
      var cousinIsMale = true; // 默认表兄弟
      var cousinIdx = sisterIndex + genBeforeSister; // 平辈表亲在 chain 中的索引
      if (cousinIdx < chain.length && cousinIdx > sisterIndex) {
        var relationToCousin = chain[cousinIdx];
        if (relationToCousin === 's') cousinIsMale = true; // 表兄弟
        else if (relationToCousin === 'd') cousinIsMale = false; // 表姐妹
      } else if (cousinIdx >= chain.length) {
        // cousinIdx 超出范围，说明表亲是姐妹的子女（如 ls 的子女）
        // 看姐妹后的第一个关系决定表亲性别
        if (sisterIndex + 1 < chain.length) {
          var firstAfterSister = chain[sisterIndex + 1];
          if (firstAfterSister === 's') cousinIsMale = true; // 姐妹的儿子 = 表兄弟
          else if (firstAfterSister === 'd') cousinIsMale = false; // 姐妹的女儿 = 表姐妹
        }
      }
      
      var afterChain = chain.slice(sisterIndex + 1);
      
      // 计算向下代数
      var genDownAfterSister = 0;
      for (var i = 0; i < afterChain.length; i++) {
        if (afterChain[i] === 's' || afterChain[i] === 'd') genDownAfterSister++;
      }
      
      // 找到最后一代的类型和性别
      var lastGenType = null;
      var lastGenGender = 'male';
      for (var i = afterChain.length - 1; i >= 0; i--) {
        if (afterChain[i] === 's') { lastGenType = 'son'; lastGenGender = 'male'; break; }
        else if (afterChain[i] === 'd') { lastGenType = 'daughter'; lastGenGender = 'female'; break; }
        else if (afterChain[i] === 'h') { lastGenType = 'spouse'; lastGenGender = 'male'; break; }
      }
      
      // 表系列的辈分 = netGen
      var netGen = genUp - genDown;
      var basePrefix = (netGen >= 0 && netGen < genPrefixFull.length) ? genPrefixFull[netGen] : '高祖';
      
      // 修复 v711-69: 使用 netGen 作为主要判断依据（而非 genDownAfterSister）
      // 平辈（netGen = 0）：表兄弟/表姐妹
      if (netGen === 0) {
        return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
      }
      
      // 向上辈分（netGen > 0）：表伯叔/表姑姨系列
      if (netGen > 0) {
        if (netGen === 1) {
          // 向上 1 代：根据目标人性别和表亲性别决定
          // 表兄弟的儿子 = 表伯叔，表兄弟的女儿 = 表姑
          // 表姐妹的儿子 = 表舅，表姐妹的女儿 = 表姨
          if (isMaternal) {
            // 母系：表姐妹的儿子 = 表舅，表姐妹的女儿 = 表姨
            // 表兄弟的儿子 = 表舅，表兄弟的女儿 = 表姨
            return lastGenGender === 'male' ? '表舅' : '表姨';
          } else {
            // 父系：表兄弟的儿子 = 表伯叔，表兄弟的女儿 = 表姑
            // 表姐妹的儿子 = 表伯叔，表姐妹的女儿 = 表姑
            return lastGenGender === 'male' ? '表伯叔' : '表姑';
          }
        } else if (netGen === 2) {
          // 向上 2 代：表伯叔祖父/表姑祖母
          var auntUnclePrefix = cousinIsMale ? '表伯叔' : '表姑';
          return auntUnclePrefix + (lastGenGender === 'male' ? '祖父' : '祖母');
        } else if (netGen >= 3) {
          // 向上 3 代及以上：表 + 辈分 + 祖父/母
          if (basePrefix.indexOf('祖') >= 0) {
            return '表' + basePrefix + (lastGenGender === 'male' ? '父' : '母');
          } else {
            return '表' + basePrefix + (lastGenGender === 'male' ? '祖父' : '祖母');
          }
        }
      }
      
      // 平辈（netGen = 0）：表兄弟/表姐妹
      if (netGen === 0) {
        return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
      }
      
      // 向下 1 代（netGen = -1）：表侄/表外甥
      if (netGen === -1) {
        // 表兄弟的子女 = 表侄，表姐妹的子女 = 表外甥
        if (cousinIsMale) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        } else {
          return lastGenGender === 'male' ? '表外甥' : '表外甥女';
        }
      }
      
      // 向下 2 代及以上（netGen <= -2）：表侄孙/表外甥孙
      if (netGen <= -2) {
        var downGen = -netGen; // 向下代数
        var downPrefix = ['', '', '孙', '曾', '玄', '来', '昆', '仍', '云'];
        var prefix = (downGen >= 2 && downPrefix.length > downGen) ? downPrefix[downGen] : '远';
        if (cousinIsMale) {
          return '表侄' + prefix + (lastGenGender === 'male' ? '' : '女');
        } else {
          return '表外甥' + prefix + (lastGenGender === 'male' ? '' : '女');
        }
      }
    }
    
    // ========== 模式 5：纯向下后代（安瑞国视角等） ==========
    // 关系链只有 s/d，无 f/m/os/ls/h/w
    console.log('[模式 5 检查] chain:', chain, 'genUp:', genUp, 'genDown:', genDown, 'sisterIndex:', sisterIndex, 'spouseIndex:', spouseIndex);
    if (genUp === 0 && genDown > 0 && sisterIndex < 0 && spouseIndex < 0) {
      console.log('[模式 5 匹配] 纯向下后代，genDown =', genDown);
      // 辈分称谓（向下）
      var genDownPrefix = ['', '', '孙', '曾', '玄', '来', '昆', '仍', '云'];
      var prefix = genDownPrefix[genDown] || '远';
      
      // 判断最后一代性别
      var lastGenGender = 'male';
      for (var i = chain.length - 1; i >= 0; i--) {
        if (chain[i] === 's') { lastGenGender = 'male'; break; }
        else if (chain[i] === 'd') { lastGenGender = 'female'; break; }
      }
      
      // 判断是否有女儿路径（外系）
      var hasDaughterPath = (chain.indexOf('d') >= 0);
      
      if (genDown === 1) {
        return lastGenGender === 'male' ? '儿子' : '女儿';
      } else if (genDown === 2) {
        if (hasDaughterPath) {
          return lastGenGender === 'male' ? '外孙' : '外孙女';
        } else {
          return lastGenGender === 'male' ? '孙子' : '孙女';
        }
      } else if (genDown >= 3) {
        if (hasDaughterPath) {
          return '外' + prefix + (lastGenGender === 'male' ? '孙' : '孙女');
        } else {
          return prefix + (lastGenGender === 'male' ? '孙' : '孙女');
        }
      }
    }
    
    // ========== 模式 6：向下后代 + 配偶（孙媳/孙女婿等） ==========
    // 关系链：s/d + ... + h/w（最后是配偶）
    var lastIsSpouse = (chain[chain.length - 1] === 'h' || chain[chain.length - 1] === 'w');
    if (lastIsSpouse && genUp === 0) {
      // 去掉最后的配偶，计算前面的后代关系
      var beforeSpouseChain = chain.slice(0, chain.length - 1);
      var genDownBefore = 0;
      for (var i = 0; i < beforeSpouseChain.length; i++) {
        if (beforeSpouseChain[i] === 's' || beforeSpouseChain[i] === 'd') genDownBefore++;
      }
      
      // 判断是否有女儿路径
      var hasDaughterPath = (beforeSpouseChain.indexOf('d') >= 0);
      
      // 判断配偶性别
      var spouseGender = (chain[chain.length - 1] === 'h') ? 'male' : 'female';
      
      var genDownPrefix = ['', '', '孙', '曾', '玄', '来', '昆', '仍', '云'];
      var prefix = genDownPrefix[genDownBefore] || '远';
      
      if (genDownBefore === 1) {
        // 子女的配偶
        if (hasDaughterPath) {
          return spouseGender === 'male' ? '女婿' : '儿媳';
        } else {
          return spouseGender === 'male' ? '女婿' : '儿媳';
        }
      } else if (genDownBefore === 2) {
        // 孙子女的配偶
        if (hasDaughterPath) {
          return '外孙' + (spouseGender === 'male' ? '女婿' : '媳');
        } else {
          return '孙' + (spouseGender === 'male' ? '女婿' : '媳');
        }
      } else if (genDownBefore >= 3) {
        // 曾孙及以上的配偶
        if (hasDaughterPath) {
          return '外' + prefix + (spouseGender === 'male' ? '孙女婿' : '孙媳');
        } else {
          return prefix + (spouseGender === 'male' ? '孙女婿' : '孙媳');
        }
      }
    }
    
    // ========== 模式 7：向下后代 + 姻亲系列（姻孙/姻曾孙等） ==========
    // 关系链：s/d + ... + w + os/ls + ...（子女的配偶的姐妹及其后代）
    var hasChildSpouseSib = false;
    var childSpouseSibIndex = -1;
    for (var i = 0; i < chain.length - 1; i++) {
      if ((chain[i] === 'w' || chain[i] === 'h') && i < chain.length - 1) {
        var nextRel = chain[i + 1];
        if (nextRel === 'os' || nextRel === 'ls' || nextRel === 'ob' || nextRel === 'lb') {
          hasChildSpouseSib = true;
          childSpouseSibIndex = i + 1;
          break;
        }
      }
    }
    
    if (hasChildSpouseSib && genUp === 0) {
      console.log('[模式 7 匹配] 姻亲系列，chain =', chain, 'childSpouseSibIndex =', childSpouseSibIndex);
      // 计算配偶前的向下代数
      var genBeforeSpouse = 0;
      for (var i = 0; i < childSpouseSibIndex; i++) {
        if (chain[i] === 's' || chain[i] === 'd') genBeforeSpouse++;
      }
      console.log('[模式 7] genBeforeSpouse =', genBeforeSpouse);
      
      // 判断是否有女儿路径
      var hasDaughterPath = false;
      for (var i = 0; i < childSpouseSibIndex; i++) {
        if (chain[i] === 'd') { hasDaughterPath = true; break; }
      }
      
      // 计算姐妹后的关系
      var afterSibChain = chain.slice(childSpouseSibIndex + 1);
      console.log('[模式 7] afterSibChain =', afterSibChain);
      
      // 修复 v711-51-fix-v10: os/ls 的 s/d 是平辈的子女，不计入代数
      // 只有 os/ls 之后的 os/ls/s/d 才计入代数（外甥孙等）
      var genAfterSib = 0;
      for (var i = 0; i < afterSibChain.length; i++) {
        // 跳过第一个 s/d（那是外甥/外甥女，平辈）
        if (i === 0 && (afterSibChain[i] === 's' || afterSibChain[i] === 'd')) {
          console.log('[模式 7] 跳过外甥/外甥女，不计入代数');
          continue;
        }
        if (afterSibChain[i] === 's' || afterSibChain[i] === 'd') genAfterSib++;
        else if (afterSibChain[i] === 'f' || afterSibChain[i] === 'm') genAfterSib++;
      }
      console.log('[模式 7] genAfterSib =', genAfterSib);
      
      // 判断最后一代性别
      var lastGenGender = 'male';
      for (var i = chain.length - 1; i >= 0; i--) {
        if (chain[i] === 's' || chain[i] === 'ob' || chain[i] === 'lb' || chain[i] === 'h') {
          lastGenGender = 'male'; break;
        } else if (chain[i] === 'd' || chain[i] === 'os' || chain[i] === 'ls' || chain[i] === 'w') {
          lastGenGender = 'female'; break;
        }
      }
      
      // 总代数 = 配偶前代数 + 姐妹后代数
      var totalGen = genBeforeSpouse + genAfterSib;
      console.log('[模式 7] totalGen =', totalGen);
      var genDownPrefix = ['', '', '孙', '曾', '玄', '来', '昆', '仍', '云'];
      var prefix = genDownPrefix[totalGen] || '远';
      
      // 判断是否是配偶（最后是 h/w）
      var lastIsSpouse = (chain[chain.length - 1] === 'h' || chain[chain.length - 1] === 'w');
      
      if (lastIsSpouse) {
        // 姻孙女婿/姻孙媳等
        return '姻' + prefix + (lastGenGender === 'male' ? '孙女婿' : '孙媳');
      } else {
        // 姻孙/姻曾孙等
        return '姻' + prefix + (lastGenGender === 'male' ? '孙' : '孙女');
      }
    }
    
    // ========== 模式 8：孙子的妻子的姐妹/兄弟及其后代（姻孙/姻孙女等） ==========
    // 关系链：s + s + w + os/ls/ob/lb + ...（孙子的配偶的姐妹及其后代）
    // 例如：安爷爷→安瑞国 (s)→安文杰 (s)→付芊雨 (w)→付群芳 (os) = 姻孙女
    var hasGrandchildSpouseSib = false;
    var grandchildSpouseSibIndex = -1;
    for (var i = 0; i < chain.length - 1; i++) {
      if ((chain[i] === 'w' || chain[i] === 'h') && i < chain.length - 1) {
        var nextRel = chain[i + 1];
        if (nextRel === 'os' || nextRel === 'ls' || nextRel === 'ob' || nextRel === 'lb') {
          var genBeforeThisSpouse = 0;
          for (var k = 0; k < i; k++) {
            if (chain[k] === 's' || chain[k] === 'd') genBeforeThisSpouse++;
          }
          if (genBeforeThisSpouse >= 2) {
            hasGrandchildSpouseSib = true;
            grandchildSpouseSibIndex = i + 1;
            break;
          }
        }
      }
    }
    
    if (hasGrandchildSpouseSib && genUp === 0) {
      console.log('[模式 8 匹配] 姻孙系列，chain =', chain, 'grandchildSpouseSibIndex =', grandchildSpouseSibIndex);
      var genBeforeSpouse = 0;
      for (var i = 0; i < grandchildSpouseSibIndex; i++) {
        if (chain[i] === 's' || chain[i] === 'd') genBeforeSpouse++;
      }
      console.log('[模式 8] genBeforeSpouse =', genBeforeSpouse);
      
      var afterSibChain = chain.slice(grandchildSpouseSibIndex + 1);
      console.log('[模式 8] afterSibChain =', afterSibChain);
      
      // 修复 v711-51-fix-v12: 孙子的配偶的姐妹的子女是 +1 代（曾孙辈），不是平辈，不要跳过第一个 s/d
      var genAfterSib = 0;
      for (var i = 0; i < afterSibChain.length; i++) {
        if (afterSibChain[i] === 's' || afterSibChain[i] === 'd') genAfterSib++;
        else if (afterSibChain[i] === 'f' || afterSibChain[i] === 'm') genAfterSib++;
      }
      console.log('[模式 8] genAfterSib =', genAfterSib);
      
      var lastGenGender = 'male';
      for (var i = chain.length - 1; i >= 0; i--) {
        if (chain[i] === 's' || chain[i] === 'ob' || chain[i] === 'lb') { lastGenGender = 'male'; break; }
        else if (chain[i] === 'd' || chain[i] === 'os' || chain[i] === 'ls') { lastGenGender = 'female'; break; }
        else if (chain[i] === 'h') { lastGenGender = 'male'; break; }
        else if (chain[i] === 'w') { lastGenGender = 'female'; break; }
      }
      
      var sibGender = 'female';
      var sibRel = chain[grandchildSpouseSibIndex];
      if (sibRel === 'ob' || sibRel === 'lb') sibGender = 'male';
      else if (sibRel === 'os' || sibRel === 'ls') sibGender = 'female';
      
      // 总代数 = 配偶前代数 + 姐妹后代数
      var totalGen = genBeforeSpouse + genAfterSib;
      console.log('[模式 8] totalGen =', totalGen);
      
      // 判断是否是配偶（最后是 h/w）
      var lastIsSpouse = (chain.length > 0 && (chain[chain.length - 1] === 'h' || chain[chain.length - 1] === 'w'));
      
      // 修复 v711-51-fix-v13: 使用完整称谓前缀（带"孙"字）
      var genDownPrefixFull = ['', '', '孙', '曾孙', '玄孙', '来孙', '昆孙', '仍孙', '云孙'];
      var prefix = genDownPrefixFull[totalGen] || '远孙';
      
      if (lastIsSpouse) {
        // 配偶称谓
        return '姻' + prefix + (lastGenGender === 'male' ? '女婿' : '媳');
      } else if (genAfterSib === 0 && afterSibChain.length === 0) {
        // 只有姐妹，没有后代
        var basePrefix = genDownPrefixFull[genBeforeSpouse] || '远孙';
        return '姻' + basePrefix + (sibGender === 'female' ? '女' : '');
      } else {
        // 有后代
        return '姻' + prefix + (lastGenGender === 'female' ? '女' : '');
      }
    }
    
    // ========== 模式 9：孙子的妻子的父母（姻侄/姻侄女等） ==========
    // 关系链：s + s + w + f/m（孙子的配偶的父母）
    // 例如：安爷爷→安瑞国 (s)→安文杰 (s)→付芊雨 (w)→付廷绪 (f) = 姻侄
    // 例如：安爷爷→安瑞国 (s)→安文杰 (s)→付芊雨 (w)→唐文有 (m) = 姻侄媳
    // 修复 v711-51-fix-v14: genUp 可以是 1（因为 f/m 是向上 1 代）
    if (chain.length >= 3) {
      var lastRel = chain[chain.length - 1];
      if ((lastRel === 'f' || lastRel === 'm') && chain[chain.length - 2] === 'w') {
        var genBeforeW = 0;
        for (var i = 0; i < chain.length - 2; i++) {
          if (chain[i] === 's' || chain[i] === 'd') genBeforeW++;
        }
        
        if (genBeforeW >= 2) {
          console.log('[模式 9 匹配] 姻侄系列，chain =', chain, 'genBeforeW =', genBeforeW);
          // genBeforeW=2 → 姻侄/姻侄媳，genBeforeW=3 → 姻侄孙/姻侄孙女，genBeforeW=4 → 姻侄曾孙/姻侄曾孙女
          var genDownPrefix = ['', '', '侄', '侄孙', '侄曾孙', '侄玄孙'];
          var basePrefix = genDownPrefix[genBeforeW] || '侄';
          if (lastRel === 'f') {
            return '姻' + basePrefix;
          } else {
            // 修复 v711-51-fix-v13: 妻子的母亲 = 姻侄媳（不是姻侄女）
            return '姻' + basePrefix + '媳';
          }
        }
      }
    }
    
    return null;
  },

  calculateTitle: function(currentId, memberId, rels, persons) {
    if (currentId === memberId) return '自己';
    var member = persons.find(function(p) { return p.id === memberId; });
    if (!member) return '';
    
    // ========== v711-51 新增：通用远代祖先称谓计算（修复 22 个空白称谓） ==========
    // 使用 BFS 找到从 currentId 到 memberId 的完整关系链
    var relationChain = this.findRelationChain(currentId, memberId, rels, persons);
    if (relationChain && relationChain.length > 0) {
      console.log('[v711-51] 关系链:', relationChain);
      var title = this.calculateUniversalTitle(relationChain, member.gender);
      console.log('[v711-51] 计算称谓:', title);
      if (title) return title;
    }
    
    // 如果通用逻辑未找到称谓，继续执行原有逻辑
    
    var mySpouseId = this.getSpouseId(currentId, rels, persons);
    if (mySpouseId === memberId) return member.gender === 'male' ? '丈夫' : '妻子';
    
    if (mySpouseId) {
      var spouseParents = this.getParents(mySpouseId, rels, persons);
      // 配偶的父母：根据当前人性别区分称谓
      // 女性看丈夫的父母=公公/婆婆，男性看妻子的父母=岳父/岳母
      var currentPerson = persons.find(function(p) { return p.id === currentId; });
      if (spouseParents.father && spouseParents.father.id === memberId) {
        return currentPerson.gender === 'female' ? '公公' : '岳父';
      }
      if (spouseParents.mother && spouseParents.mother.id === memberId) {
        return currentPerson.gender === 'female' ? '婆婆' : '岳母';
      }
    }
    
    var ps = this.getParents(currentId, rels, persons);
    if (ps.father && ps.father.id === memberId) return '父亲';
    if (ps.mother && ps.mother.id === memberId) return '母亲';
    
    if (ps.father) {
      var gps = this.getParents(ps.father.id, rels, persons);
      if (gps.father && gps.father.id === memberId) return '爷爷';
      if (gps.mother && gps.mother.id === memberId) return '奶奶';
    }
    if (ps.mother) {
      var gps = this.getParents(ps.mother.id, rels, persons);
      if (gps.father && gps.father.id === memberId) return '外公';
      if (gps.mother && gps.mother.id === memberId) return '外婆';
    }
    
    var sibs = this.getSiblings(currentId, rels, persons);
    for (var i = 0; i < sibs.length; i++) {
      if (sibs[i].member.id === memberId) {
        return member.gender === 'male' ? '兄弟' : '姐妹';
      }
      if (sibs[i].spouse && sibs[i].spouse.id === memberId) {
        if (sibs[i].member.gender === 'male') return '嫂子';
        else return '姐夫';
      }
    }
    
    var children = this.getChildren(currentId, rels, persons);
    for (var i = 0; i < children.length; i++) {
      if (children[i].member.id === memberId) return member.gender === 'male' ? '儿子' : '女儿';
      if (children[i].spouse && children[i].spouse.id === memberId) {
        return member.gender === 'male' ? '儿媳' : '女婿';
      }
    }
    
    for (var i = 0; i < children.length; i++) {
      var gc = this.getChildren(children[i].member.id, rels, persons);
      for (var j = 0; j < gc.length; j++) {
        if (gc[j].member.id === memberId) return member.gender === 'male' ? '孙子' : '孙女';
      }
    }
    
    for (var i = 0; i < sibs.length; i++) {
      var sibChildren = this.getChildren(sibs[i].member.id, rels, persons);
      for (var j = 0; j < sibChildren.length; j++) {
        if (sibChildren[j] && sibChildren[j].member && sibChildren[j].member.id === memberId) {
          if (sibs[i].member.gender === 'male') {
            return member.gender === 'male' ? '侄子' : '侄女';
          } else {
            return member.gender === 'male' ? '外甥' : '外甥女';
          }
        }
        if (sibChildren[j] && sibChildren[j].spouse && sibChildren[j].spouse.id === memberId) {
          if (sibs[i].member.gender === 'male') return '侄媳';
          else return '外甥媳';
        }
      }
    }
    
    if (mySpouseId) {
      var spouseSibs = this.getSiblings(mySpouseId, rels, persons);
      for (var i = 0; i < spouseSibs.length; i++) {
        var ssib = spouseSibs[i].member;
        var ssibSpouse = spouseSibs[i].spouse;
        if (!ssib) continue;
        
        if (ssib.id === memberId) {
          if (ssib.gender === 'male') return '内兄';
          else return '内姊';
        }
        
        if (ssibSpouse && ssibSpouse.id === memberId) {
          if (ssibSpouse.gender === 'male') return '连襟';
          else return '妯娌';
        }
      }
      
      for (var i = 0; i < spouseSibs.length; i++) {
        if (!spouseSibs[i] || !spouseSibs[i].member) continue;
        var ssibChildren = this.getChildren(spouseSibs[i].member.id, rels, persons);
        for (var j = 0; j < ssibChildren.length; j++) {
          if (!ssibChildren[j] || !ssibChildren[j].member) continue;
          if (ssibChildren[j].member.id === memberId) return '外甥';
          if (ssibChildren[j].spouse && ssibChildren[j].spouse.id === memberId) return '外甥媳';
        }
      }
      
      // 远亲称谓
      for (var i = 0; i < spouseSibs.length; i++) {
        if (!spouseSibs[i] || !spouseSibs[i].member) continue;
        
        var ssibChildren = this.getChildren(spouseSibs[i].member.id, rels, persons);
        for (var j = 0; j < ssibChildren.length; j++) {
          if (!ssibChildren[j] || !ssibChildren[j].member) continue;
          
          if (ssibChildren[j].member) {
            var ssibGrandChildren = this.getChildren(ssibChildren[j].member.id, rels, persons);
            for (var k = 0; k < ssibGrandChildren.length; k++) {
              if (!ssibGrandChildren[k] || !ssibGrandChildren[k].member) continue;
              if (ssibGrandChildren[k].member.id === memberId) {
                return member.gender === 'female' ? '外甥孙女' : '外甥孙';
              }
              if (ssibGrandChildren[k].spouse && ssibGrandChildren[k].spouse.id === memberId) {
                return member.gender === 'male' ? '外甥孙女婿' : '外甥孙媳';
              }
              
              if (ssibGrandChildren[k].member) {
                var ssibGreatGrandChildren = this.getChildren(ssibGrandChildren[k].member.id, rels, persons);
                for (var l = 0; l < ssibGreatGrandChildren.length; l++) {
                  if (!ssibGreatGrandChildren[l] || !ssibGreatGrandChildren[l].member) continue;
                  if (ssibGreatGrandChildren[l].member.id === memberId) return '外甥曾孙';
                  
                  if (ssibGreatGrandChildren[l].member) {
                    var ssibGreatGreatGrandChildren = this.getChildren(ssibGreatGrandChildren[l].member.id, rels, persons);
                    for (var m = 0; m < ssibGreatGreatGrandChildren.length; m++) {
                      if (!ssibGreatGreatGrandChildren[m] || !ssibGreatGreatGrandChildren[m].member) continue;
                      if (ssibGreatGreatGrandChildren[m].member.id === memberId) return '外甥玄孙';
                      
                      if (ssibGreatGreatGrandChildren[m].member) {
                        var ssibComeGrandChildren = this.getChildren(ssibGreatGreatGrandChildren[m].member.id, rels, persons);
                        for (var n = 0; n < ssibComeGrandChildren.length; n++) {
                          if (!ssibComeGrandChildren[n] || !ssibComeGrandChildren[n].member) continue;
                          if (ssibComeGrandChildren[n].member.id === memberId) return '外甥来孙';
                          }


                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

    // ========== v711-01 新增：儿子的妻子的姐姐及其后代（基于硬通码） ==========
    var myChildren = this.getChildren(currentId, rels, persons);
    for (var i = 0; i < myChildren.length; i++) {
      if (!myChildren[i] || !myChildren[i].member) continue;
      var child = myChildren[i].member;
      
      // 查找子女的配偶
      var childSpouseId = this.getSpouseId(child.id, rels, persons);
      if (!childSpouseId) continue;
      
      // 查找子女配偶的兄弟姐妹
      var childSpouseSibs = this.getSiblings(childSpouseId, rels, persons);
      for (var j = 0; j < childSpouseSibs.length; j++) {
        if (!childSpouseSibs[j] || !childSpouseSibs[j].member) continue;
        var csSib = childSpouseSibs[j].member;
        var csSibSpouse = childSpouseSibs[j].spouse;
        
        // 儿子的妻子的姐姐
        if (child.gender === 'male' && csSib.gender === 'female' && csSib.id === memberId) {
          return '姻侄女';
        }
        
        // 儿子的妻子的姐姐的子女
        if (child.gender === 'male' && csSib.gender === 'female') {
          var csSibChildren = this.getChildren(csSib.id, rels, persons);
          for (var k = 0; k < csSibChildren.length; k++) {
            if (!csSibChildren[k] || !csSibChildren[k].member) continue;
            if (csSibChildren[k].member.id === memberId) {
              return csSibChildren[k].member.gender === 'male' ? '姻侄孙' : '姻侄孙女';
            }
            
            // 儿子的妻子的姐姐的孙子女
            var csSibGrandChildren = this.getChildren(csSibChildren[k].member.id, rels, persons);
            for (var l = 0; l < csSibGrandChildren.length; l++) {
              if (!csSibGrandChildren[l] || !csSibGrandChildren[l].member) continue;
              if (csSibGrandChildren[l].member.id === memberId) {
                return csSibGrandChildren[l].member.gender === 'male' ? '姻侄曾孙' : '姻侄曾孙女';
              }
              
              // 儿子的妻子的姐姐的曾孙子女
              var csSibGreatGrandChildren = this.getChildren(csSibGrandChildren[l].member.id, rels, persons);
              for (var m = 0; m < csSibGreatGrandChildren.length; m++) {
                if (!csSibGreatGrandChildren[m] || !csSibGreatGrandChildren[m].member) continue;
                if (csSibGreatGrandChildren[m].member.id === memberId) {
                  return csSibGreatGrandChildren[m].member.gender === 'male' ? '姻侄玄孙' : '姻侄玄孙女';
                }
                
                // 儿子的妻子的姐姐的玄孙子女
                var csSibComeGrandChildren = this.getChildren(csSibGreatGrandChildren[m].member.id, rels, persons);
                for (var n = 0; n < csSibComeGrandChildren.length; n++) {
                  if (!csSibComeGrandChildren[n] || !csSibComeGrandChildren[n].member) continue;
                  if (csSibComeGrandChildren[n].member.id === memberId) {
                    return csSibComeGrandChildren[n].member.gender === 'male' ? '姻侄来孙' : '姻侄来孙女';
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // ========== v711-01 新增：弟弟的妻子的姐姐及其后代（基于硬通码） ==========
    var mySiblings = this.getSiblings(currentId, rels, persons);
    for (var i = 0; i < mySiblings.length; i++) {
      if (!mySiblings[i] || !mySiblings[i].member) continue;
      var sib = mySiblings[i].member;
      var sibSpouse = mySiblings[i].spouse;
      
      // 只处理弟弟的妻子
      if (sib.gender !== 'male' || !sibSpouse) continue;
      
      // 查找弟弟妻子的兄弟姐妹
      var sibSpouseSibs = this.getSiblings(sibSpouse.id, rels, persons);
      for (var j = 0; j < sibSpouseSibs.length; j++) {
        if (!sibSpouseSibs[j] || !sibSpouseSibs[j].member) continue;
        var ssSib = sibSpouseSibs[j].member;
        var ssSibSpouse = sibSpouseSibs[j].spouse;
        
        // 弟弟的妻子的姐姐
        if (ssSib.gender === 'female' && ssSib.id === memberId) {
          return '姻姐';
        }
        
        // 弟弟的妻子的姐姐的丈夫
        if (ssSib.gender === 'female' && ssSibSpouse && ssSibSpouse.id === memberId) {
          return '姻姐夫';
        }
        
        // 弟弟的妻子的姐姐的子女
        if (ssSib.gender === 'female') {
          var ssSibChildren = this.getChildren(ssSib.id, rels, persons);
          for (var k = 0; k < ssSibChildren.length; k++) {
            if (!ssSibChildren[k] || !ssSibChildren[k].member) continue;
            if (ssSibChildren[k].member.id === memberId) {
              return ssSibChildren[k].member.gender === 'male' ? '姻外甥' : '姻外甥女';
            }
            
            // 弟弟的妻子的姐姐的孙子女
            var ssSibGrandChildren = this.getChildren(ssSibChildren[k].member.id, rels, persons);
            for (var l = 0; l < ssSibGrandChildren.length; l++) {
              if (!ssSibGrandChildren[l] || !ssSibGrandChildren[l].member) continue;
              if (ssSibGrandChildren[l].member.id === memberId) {
                return ssSibGrandChildren[l].member.gender === 'male' ? '姻外甥孙' : '姻外甥孙女';
              }
              
              // 弟弟的妻子的姐姐的曾孙子女
              var ssSibGreatGrandChildren = this.getChildren(ssSibGrandChildren[l].member.id, rels, persons);
              for (var m = 0; m < ssSibGreatGrandChildren.length; m++) {
                if (!ssSibGreatGrandChildren[m] || !ssSibGreatGrandChildren[m].member) continue;
                if (ssSibGreatGrandChildren[m].member.id === memberId) {
                  return ssSibGreatGrandChildren[m].member.gender === 'male' ? '姻外甥曾孙' : '姻外甥曾孙女';
                }
                
                // 弟弟的妻子的姐姐的玄孙子女
                var ssSibComeGrandChildren = this.getChildren(ssSibGreatGrandChildren[m].member.id, rels, persons);
                for (var n = 0; n < ssSibComeGrandChildren.length; n++) {
                  if (!ssSibComeGrandChildren[n] || !ssSibComeGrandChildren[n].member) continue;
                  if (ssSibComeGrandChildren[n].member.id === memberId) {
                    return ssSibComeGrandChildren[n].member.gender === 'male' ? '姻外甥玄孙' : '姻外甥玄孙女';
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return '';
  },

  // v49.0 正确的向下递归
  buildFamilyTree: function(currentId, persons, relationships) {
    console.log('=== v49.0 开始构建家谱（正确的向下递归）===');
    
    var CW = 100, CH = 120, SS = 10;
    var coupleSpacing = 100; // v711-51-fix-v187 新增：夫妻对之间的最小间距
    var GS = 200;
    var nodePositions = {}, links = [];
    var Ys = [50, 250, 450, 650, 850, 1050, 1250, 1450, 1650, 1850, 2050, 2250, 2450, 2650];
    
    // ========== v711-26 修复：通用根节点查找（不依赖 currentId） ==========
    // 1. 找到连接点夫妻（双方都有兄弟姐妹）
    var connectionCouple = null;
    for (var i = 0; i < persons.length; i++) {
      var p = persons[i];
      console.log('[连接点检测] 检查：' + p.name + ' (性别：' + p.gender + ')');
      var spouseId = this.getSpouseId(p.id, relationships, persons);
      console.log('[连接点检测]   配偶 ID:', spouseId);
      if (!spouseId) continue;
      var spouse = persons.find(function(x) { return x.id === spouseId; });
      console.log('[连接点检测]   配偶姓名:', spouse ? spouse.name : 'null');
      
      var mySibs = this.getSiblings(p.id, relationships, persons);
      var spouseSibs = this.getSiblings(spouseId, relationships, persons);
      console.log('[连接点检测]   我的兄弟姐妹数:', mySibs.length, '配偶兄弟姐妹数:', spouseSibs.length);
      
      if (mySibs.length > 0 && spouseSibs.length > 0 && spouse) {
        // 修复：当 p.gender 为 undefined 时，通过配偶性别推断
        var isPMale = p.gender === 'male';
        var isPFemale = p.gender === 'female';
        var isSpouseMale = spouse && spouse.gender === 'male';
        var isSpouseFemale = spouse && spouse.gender === 'female';
        
        var husband, wife;
        if (isPMale || isSpouseFemale) {
          husband = p;
          wife = spouse;
        } else if (isPFemale || isSpouseMale) {
          husband = spouse;
          wife = p;
        } else {
          // 都无法确定时，默认 p 是丈夫
          husband = p;
          wife = spouse;
        }
        
        connectionCouple = { husband: husband, wife: wife };
        console.log('[连接点检测] ✅ 找到连接点夫妻：' + husband.name + ' (' + husband.gender + ') ❤ ' + wife.name + ' (' + wife.gender + ')');
        break;
      }
    }
    
    // 2. 从连接点向上追溯到根节点（双家族），或从 currentId 追溯（单家族）
    var anRootId = null, fuRootId = null;
    var genDiff = 0;
    
    if (connectionCouple && connectionCouple.husband) {
      // 双家族：从连接点追溯
      anRootId = this.findFamilyRoot(connectionCouple.husband.id, relationships, persons);
      if (connectionCouple.wife) {
        fuRootId = this.findFamilyRoot(connectionCouple.wife.id, relationships, persons);
      }
      
      // 计算 genDiff（从连接点夫妻，固定值）
      var husbandGen = 0, temp = connectionCouple.husband.id;
      while (true) {
        var ps = this.getParents(temp, relationships, persons);
        if (ps.father) { temp = ps.father.id; husbandGen++; }
        else if (ps.mother) { temp = ps.mother.id; husbandGen++; }
        else break;
      }
      
      var wifeGen = 0;
      if (connectionCouple.wife) {
        temp = connectionCouple.wife.id;
        while (true) {
          var ps = this.getParents(temp, relationships, persons);
          if (ps.father) { temp = ps.father.id; wifeGen++; }
          else if (ps.mother) { temp = ps.mother.id; wifeGen++; }
          else break;
        }
      }
      
      genDiff = husbandGen - wifeGen;
      
      console.log('🔗 连接点：', connectionCouple && connectionCouple.husband && connectionCouple.wife 
        ? (connectionCouple.husband.name + ' ❤ ' + connectionCouple.wife.name) 
        : '无');
      console.log('安姓根节点:', anRootId, '付姓根节点:', fuRootId, 'genDiff:', genDiff);
    } else {
      // 单家族 fallback：从 currentId 向上追溯
      anRootId = this.findFamilyRoot(currentId, relationships, persons);
      
      // v711-40 修复：如果当前人是配偶（女性），需要通过配偶找到丈夫的家族
      // 只有当当前人自己的根节点是自己时（没有父母），才使用配偶的根节点
      if (anRootId === currentId) {
        var currentSpouseId = this.getSpouseId(currentId, relationships, persons);
        if (currentSpouseId) {
          var spouseRootId = this.findFamilyRoot(currentSpouseId, relationships, persons);
          // 如果配偶的根节点与自己不同，使用配偶的根节点（说明当前人是嫁入的配偶）
          if (spouseRootId !== anRootId) {
            anRootId = spouseRootId;
          }
        }
      }
      
      console.log('🔗 单家族模式：根节点', anRootId);
      // 单家族不需要收集配偶的独立家族，配偶会作为配偶被自动收集
      fuRootId = null;
    }
    // ========== v711-26 修复结束 ==========
    
    var currentSpouseId = this.getSpouseId(currentId, relationships, persons);
    
    // 逐代收集所有成员
    var allGens = {};
    var seenIds = {};
    
    // 1. 收集安姓家族
    var anQueue = [{ id: anRootId, gen: 0 }];
    while (anQueue.length > 0) {
      var item = anQueue.shift();
      if (seenIds[item.id]) continue;
      seenIds[item.id] = true;
      
      var person = persons.find(function(p) { return p.id === item.id; });
      if (person) {
        var spouseId = this.getSpouseId(item.id, relationships, persons);
        var spouse = spouseId ? persons.find(function(p) { return p.id === spouseId; }) : null;
        
        if (!allGens[item.gen]) allGens[item.gen] = [];
        
        // v711-41-fix-lxl: 去重检查
        var exists = false;
        for (var i = 0; i < allGens[item.gen].length; i++) {
          if (allGens[item.gen][i].member.id === item.id) { exists = true; break; }
        }
        if (!exists) {
          allGens[item.gen].push({ member: person, spouse: spouse, family: 'an', generation: item.gen });
        }
        
        if (spouse && !seenIds[spouse.id]) {
          seenIds[spouse.id] = true;
          // 配偶去重检查
          var spouseExists = false;
          for (var i = 0; i < allGens[item.gen].length; i++) {
            if (allGens[item.gen][i].member.id === spouse.id) { spouseExists = true; break; }
          }
          if (!spouseExists) {
            allGens[item.gen].push({ member: spouse, spouse: person, family: 'an', generation: item.gen });
          }
        }
        
        var children = this.getChildren(item.id, relationships, persons);
        for (var i = 0; i < children.length; i++) {
          anQueue.push({ id: children[i].member.id, gen: item.gen + 1 });
        }
        
        // v711-50 修复：如果配偶存在，也收集配偶的子女（防止子女关系只从母亲建立）
        if (spouseId) {
          var spouseChildren = this.getChildren(spouseId, relationships, persons);
          for (var j = 0; j < spouseChildren.length; j++) {
            if (!seenIds[spouseChildren[j].member.id]) {
              anQueue.push({ id: spouseChildren[j].member.id, gen: item.gen + 1 });
            }
          }
        }
      }
    }
    
    // 2. 收集付姓家族
    if (fuRootId && fuRootId !== anRootId) {
      // genDiff 已在开头从连接点夫妻计算（固定值）
      var fuQueue = [{ id: fuRootId, gen: 0 }];
      var fuSeen = {};
      while (fuQueue.length > 0) {
        var item = fuQueue.shift();
        if (fuSeen[item.id]) continue;
        fuSeen[item.id] = true;
        
        var person = persons.find(function(p) { return p.id === item.id; });
        if (person) {
          var spouseId = this.getSpouseId(item.id, relationships, persons);
          var spouse = spouseId ? persons.find(function(p) { return p.id === spouseId; }) : null;
          var adjustedGen = item.gen + genDiff;
          
          if (!allGens[adjustedGen]) allGens[adjustedGen] = [];
          
          var exists = false;
          for (var i = 0; i < allGens[adjustedGen].length; i++) {
            if (allGens[adjustedGen][i].member.id === item.id) { exists = true; break; }
          }
          if (!exists) {
            allGens[adjustedGen].push({ member: person, spouse: spouse, family: 'fu', generation: adjustedGen });
          }
          
          if (spouse) {
            var spouseExists = false;
            for (var i = 0; i < allGens[adjustedGen].length; i++) {
              if (allGens[adjustedGen][i].member.id === spouse.id) { spouseExists = true; break; }
            }
            if (!spouseExists) {
              allGens[adjustedGen].push({ member: spouse, spouse: person, family: 'fu', generation: adjustedGen });
            }
          }
          
          var children = this.getChildren(item.id, relationships, persons);
          for (var i = 0; i < children.length; i++) {
            fuQueue.push({ id: children[i].member.id, gen: item.gen + 1 });
          }
          
          // v711-50 修复：如果配偶存在，也收集配偶的子女（防止子女关系只从母亲建立）
          if (spouseId) {
            var spouseChildren = this.getChildren(spouseId, relationships, persons);
            for (var j = 0; j < spouseChildren.length; j++) {
              if (!fuSeen[spouseChildren[j].member.id]) {
                fuQueue.push({ id: spouseChildren[j].member.id, gen: item.gen + 1 });
              }
            }
          }
        }
      }
    }
    
    var maxGen = 0;
    for (var g in allGens) if (parseInt(g) > maxGen) maxGen = parseInt(g);
    
    console.log('总代数:', maxGen + 1);
    for (var g = 0; g <= maxGen; g++) {
      console.log('第', g, '代:', allGens[g] ? allGens[g].length : 0, '人');
    }
    
    // v49.0 核心：找到跨家族连接点（第 N 代）
    // connectionCouple 已在开头找到，这里只需要确定它在第几代
    var connectionGen = -1;
    
    for (var g = 0; g <= maxGen; g++) {
      if (!allGens[g]) continue;
      var cc = this.findConnectionCouple(allGens[g], relationships, persons);
      if (cc) {
        connectionGen = g;
        // connectionCouple 已在开头设置，这里复用
        console.log('🎯 找到跨家族连接点：第', g, '代', cc.husband.name, '❤', cc.wife.name);
        break;
      }
    }
    
    if (!connectionCouple) {
      console.log('未找到跨家族连接点，使用当前人');
      connectionCouple = {
        husband: persons.find(function(p) { return p.id === currentId; }),
        wife: persons.find(function(p) { return p.id === currentSpouseId; })
      };
      connectionGen = 0;
    }
    
    // v49.0 核心算法：
    // 第一步：逐代布局所有成员（确保所有人都显示）
    // 第二步：向上递归调整所有长辈位置
    // 第三步：向下递归 - 先计算父母中间，再查找子女数量，然后计算子女位置
    
    var centerX = 4000; // 画布中心
    
    // v711-16 修复：used 对象移到循环外部，跨代共享
    var globalUsed = {};
    
    // 第一步：逐代布局所有成员
    for (var g = 0; g <= maxGen; g++) {
      if (!allGens[g] || allGens[g].length === 0) continue;
      
      var members = allGens[g];
      
      // 识别这一代的跨家族连接点
      var genConnectionCouple = this.findConnectionCouple(members, relationships, persons);
      
      // 按夫妻分组
      var anCouples = [];
      var fuCouples = [];
      var connectionCoupleData = null;
      var connectionAnSiblings = []; // 连接点安姓兄弟姐妹夫妻
      var connectionFuSiblings = []; // 连接点付姓兄弟姐妹夫妻
      var used = globalUsed; // 使用全局 used 对象
      
      for (var i = 0; i < members.length; i++) {
        var m = members[i];
        if (!m || !m.member || used[m.member.id]) continue;
        
        // v711-14 修复：标记当前成员已使用
        used[m.member.id] = true;
        
        var spouseId = this.getSpouseId(m.member.id, relationships, persons);
        var spouse = null;
        
        if (spouseId) {
          for (var j = 0; j < members.length; j++) {
            if (members[j].member && members[j].member.id === spouseId) {
              spouse = members[j].member;
              used[spouseId] = true;
              break;
            }
          }
        }
        
        var couple = {
          husband: m.member.gender === 'male' ? m.member : spouse,
          wife: m.member.gender === 'male' ? spouse : m.member,
          family: m.family
        };
        
        if (genConnectionCouple && 
            ((couple.husband && couple.husband.id) === genConnectionCouple.husband.id || (couple.wife && couple.wife.id) === genConnectionCouple.wife.id)) {
          connectionCoupleData = couple;
        } else if (m.family === 'an') {
          anCouples.push(couple);
        } else if (m.family === 'fu') {
          fuCouples.push(couple);
        }
        
        used[m.member.id] = true;
      }
      
      console.log('第', g, '代：安姓', anCouples.length, '对，付姓', fuCouples.length, '对，连接点', connectionCoupleData ? '1 对' : '无');

      // 找到连接点后，收集双方兄弟姐妹 IDs
      var connectionAnSiblingIds = [];
      var connectionFuSiblingIds = [];
      console.log('🔍 连接点检查：connectionCoupleData=', connectionCoupleData ? connectionCoupleData.husband ? connectionCoupleData.husband.name : 'no husband' : 'null', 'genConnectionCouple=', genConnectionCouple ? genConnectionCouple.husband ? genConnectionCouple.husband.name : 'no husband' : 'null');
      if (connectionCoupleData && genConnectionCouple) {
        console.log('🔍 开始收集兄弟姐妹，安文杰 ID=', genConnectionCouple.husband.id, '付芊雨 ID=', genConnectionCouple.wife.id);
        var anSiblings = this.getSiblings(genConnectionCouple.husband.id, relationships, persons) || [];
        console.log('🔍 安姓兄弟姐妹返回:', anSiblings.length, '人');
        for (var si = 0; si < anSiblings.length; si++) {
          console.log('  - 安姓兄弟姐妹[' + si + ']:', anSiblings[si].member.name, 'ID:', anSiblings[si].member.id);
          if (anSiblings[si].member.id && connectionAnSiblingIds.indexOf(anSiblings[si].member.id) === -1) {
            connectionAnSiblingIds.push(anSiblings[si].member.id);
            console.log('    ✅ 添加 ID:', anSiblings[si].member.id);
          }
        }
        var fuSiblings = this.getSiblings(genConnectionCouple.wife.id, relationships, persons) || [];
        console.log('🔍 付姓兄弟姐妹返回:', fuSiblings.length, '人');
        for (var si = 0; si < fuSiblings.length; si++) {
          console.log('  - 付姓兄弟姐妹[' + si + ']:', fuSiblings[si].member.name, 'ID:', fuSiblings[si].member.id);
          if (fuSiblings[si].member.id && connectionFuSiblingIds.indexOf(fuSiblings[si].member.id) === -1) {
            connectionFuSiblingIds.push(fuSiblings[si].member.id);
            console.log('    ✅ 添加 ID:', fuSiblings[si].member.id);
          }
        }
        console.log('🔗 连接点兄弟姐妹 IDs: 安姓', connectionAnSiblingIds.length, '人', connectionAnSiblingIds, '付姓', connectionFuSiblingIds.length, '人', connectionFuSiblingIds);
      } else {
        console.log('⚠️ 条件不满足：connectionCoupleData=', !!connectionCoupleData, 'genConnectionCouple=', !!genConnectionCouple);
      }


      // 从 anCouples/fuCouples 中分离连接点兄弟姐妹夫妻
      var newAnCouples = [];
      var newFuCouples = [];
      for (var ci = 0; ci < anCouples.length; ci++) {
        // 修复：同时检查 husband 和 wife 是否是连接点的兄弟姐妹（支持女性兄弟姐妹）
        var isAnSibling = false;
        if (anCouples[ci].husband && connectionAnSiblingIds.indexOf(anCouples[ci].husband.id) !== -1) {
          isAnSibling = true;
        }
        if (anCouples[ci].wife && connectionAnSiblingIds.indexOf(anCouples[ci].wife.id) !== -1) {
          isAnSibling = true;
        }
        if (isAnSibling) {
          connectionAnSiblings.push(anCouples[ci]);
        } else {
          newAnCouples.push(anCouples[ci]);
        }
      }
      for (var ci = 0; ci < fuCouples.length; ci++) {
        // 修复：同时检查 husband 和 wife 是否是连接点的兄弟姐妹（支持女性兄弟姐妹）
        var isFuSibling = false;
        if (fuCouples[ci].husband && connectionFuSiblingIds.indexOf(fuCouples[ci].husband.id) !== -1) {
          isFuSibling = true;
        }
        if (fuCouples[ci].wife && connectionFuSiblingIds.indexOf(fuCouples[ci].wife.id) !== -1) {
          isFuSibling = true;
        }
        if (isFuSibling) {
          connectionFuSiblings.push(fuCouples[ci]);
        } else {
          newFuCouples.push(fuCouples[ci]);
        }
      }
      anCouples = newAnCouples;
      fuCouples = newFuCouples;

      console.log('👨‍👩‍👧 连接点兄弟姐妹夫妻：安姓', connectionAnSiblings.length, '对，付姓', connectionFuSiblings.length, '对');

      // 第 1 代特殊处理：连接点父亲（安瑞国）移到 anCouples 末尾，靠近付姓家族
      if (g === 1 && connectionCoupleData && connectionCoupleData.husband) {
        var connectionFatherId = this.getFatherId(connectionCoupleData.husband.id, relationships, persons);
        if (connectionFatherId) {
          for (var fi = 0; fi < anCouples.length; fi++) {
            if (anCouples[fi].husband && anCouples[fi].husband.id === connectionFatherId) {
              var fatherCouple = anCouples.splice(fi, 1)[0];
              anCouples.push(fatherCouple); // 移到末尾
              console.log('👴 第 1 代：连接点父亲', fatherCouple.husband.name, '移到 anCouples 末尾');
              break;
            }
          }
        }
      }

      // 布局：其他安姓 + 连接点安姓兄弟姐妹 + 连接点 + 连接点付姓兄弟姐妹 + 其他付姓
      var allCouples = [];
      if (connectionCoupleData) {
        allCouples = anCouples.concat(connectionAnSiblings).concat([connectionCoupleData]).concat(connectionFuSiblings).concat(fuCouples);
      } else {
        allCouples = anCouples.concat(fuCouples);
      }
      
      // v711-51-fix-v186 新增：详细日志追踪 allCouples 内容
      console.log('📋 第', g, '代 allCouples 构成：anCouples=', anCouples.length, 'connectionAnSiblings=', connectionAnSiblings.length, 'connectionCoupleData=', connectionCoupleData ? 1 : 0, 'connectionFuSiblings=', connectionFuSiblings.length, 'fuCouples=', fuCouples.length, '总计=', allCouples.length, '对');
      for (var aci = 0; aci < connectionFuSiblings.length; aci++) {
        var fs = connectionFuSiblings[aci];
        console.log('  - connectionFuSiblings[', aci, ']:', fs.husband ? fs.husband.name : 'null', '/', fs.wife ? fs.wife.name : 'null', '(wife.id=', fs.wife ? fs.wife.id : 'null', ')');
      }
      
      // 动态计算每对夫妻的宽度
      var coupleWidths = [];
      for (var i = 0; i < allCouples.length; i++) {
        var couple = allCouples[i];
        var width = this.calculateCoupleWidth(couple, relationships, persons, CW, SS, {});
        coupleWidths.push(width);
      }
      
      // 计算总宽度
      var totalWidth = 0;
      for (var i = 0; i < coupleWidths.length; i++) {
        totalWidth += coupleWidths[i];
        if (i > 0) totalWidth += coupleSpacing; // v711-51-fix-v187 修复：夫妻对之间间距 100px
      }
      
      // 居中布局
      var startX = (8000 - totalWidth) / 2;
      var currentX = startX;
      
      // 布局每对夫妻
      for (var i = 0; i < allCouples.length; i++) {
        var couple = allCouples[i];
        var width = coupleWidths[i];
        
        // 夫妻居中于自己的宽度
        var coupleCenterX = currentX + width / 2;
        
        // v711-51-fix-v183 修复：单身成员位置计算
        var hasHusband = couple.husband && couple.husband.id;
        var hasWife = couple.wife && couple.wife.id;
        var isSingle = (hasHusband && !hasWife) || (!hasHusband && hasWife);
        
        var husbandX, wifeX;
        if (isSingle) {
          // 单身成员：居中于 coupleCenterX
          if (hasHusband) {
            husbandX = coupleCenterX - CW / 2;
            wifeX = null;
          } else if (hasWife) {
            wifeX = coupleCenterX - CW / 2;
            husbandX = null;
          }
        } else {
          // 夫妻：正常计算
          husbandX = coupleCenterX - (CW + SS) / 2 - CW / 2;
          wifeX = husbandX + CW + SS;
        }
        
        // v711-51-fix-v186 新增：记录每个夫妻的放置位置
        var placedNames = [];
        if (couple.husband && husbandX !== null) {
          nodePositions[couple.husband.id] = { 
            x: husbandX, 
            y: Ys[g]
          };
          placedNames.push(couple.husband.name + '@X' + Math.round(husbandX));
        }
        
        if (couple.wife && wifeX !== null) {
          nodePositions[couple.wife.id] = { 
            x: wifeX, 
            y: Ys[g]
          };
          placedNames.push(couple.wife.name + '@X' + Math.round(wifeX));
          
          // v711-32 修复：添加配偶连线到 links 数组
          var husbandId = couple.husband ? couple.husband.id : null;
          if (husbandId) {
            links.push({ type: 'spouse', from: husbandId, to: couple.wife.id });
          }
        }
        
        // v711-51-fix-v186 新增：输出放置日志
        console.log('📍 第', g, '代放置夫妻 [', i, '/', allCouples.length, ']:', placedNames.join(' / '), '宽度=', Math.round(width), 'currentX=', Math.round(currentX));
        
        currentX += width + coupleSpacing; // v711-51-fix-v187 修复：夫妻对之间间距 100px
      }
      
      // 添加亲子连线
      if (g > 0) {
        for (var i = 0; i < members.length; i++) {
          var child = members[i].member;
          if (!child) continue;
          
          var ps = this.getParents(child.id, relationships, persons);
          
          if (ps.father && nodePositions[ps.father.id]) {
            links.push({ type: 'parent', from: ps.father.id, to: child.id });
          }
          if (ps.mother && nodePositions[ps.mother.id]) {
            links.push({ type: 'parent', from: ps.mother.id, to: child.id });
          }
        }
      }
    }
    
    console.log('第一步完成后节点数:', Object.keys(nodePositions).length);
    
    // v711-41-fix-lxl: 检查并添加缺失的配偶连线
    for (var g = 0; g <= maxGen; g++) {
      if (!allGens[g]) continue;
      for (var i = 0; i < allGens[g].length; i++) {
        var member = allGens[g][i];
        if (!member || !member.member) continue;
        
        var spouseId = this.getSpouseId(member.member.id, relationships, persons);
        if (spouseId && nodePositions[spouseId]) {
          // 检查是否已有配偶连线
          var hasLink = false;
          for (var j = 0; j < links.length; j++) {
            if (links[j].type === 'spouse' && 
                ((links[j].from === member.member.id && links[j].to === spouseId) ||
                 (links[j].from === spouseId && links[j].to === member.member.id))) {
              hasLink = true;
              break;
            }
          }
          if (!hasLink) {
            // 添加缺失的配偶连线
            links.push({ type: 'spouse', from: member.member.id, to: spouseId });
            console.log('➕ 添加缺失配偶连线:', member.member.name, '↔', spouseId);
          }
        }
      }
    }
    
    // 第二步：向上递归调整所有长辈位置
    console.log('=== 第二步：向上递归调整长辈位置 ===');
    for (var g = connectionGen - 1; g >= 0; g--) {
      if (!allGens[g]) continue;
      for (var i = 0; i < allGens[g].length; i++) {
        var member = allGens[g][i];
        if (member && member.member) {
          this.adjustParentPositionV3(member.member, nodePositions, links, relationships, persons, CW, CH, SS);
        }
      }
    }
    
    // 第三步：向下递归 - 按代际统一布局（v711-51-fix-v100 防碰撞修复）
    console.log('=== 第三步：按代际统一布局（防碰撞修复）===');
    
    // v711-10 修复：重置已处理父母标记，避免夫妻双方重复放置子女
    this.processedParents = {};
    
    for (var g = connectionGen; g < maxGen; g++) {
      if (!allGens[g]) continue;
      
      // v711-51-fix-v100 新增：按代际统一布局
      this.placeGenerationV3(allGens[g], nodePositions, links, relationships, persons, CW, CH, SS, g, Ys);
    }
    
    // v711-51-fix-v155 新增：修复爸爸的妈妈的兄弟的孙辈称谓（表兄弟/表姐妹而非表侄/表侄女）
    console.log('=== 第四步：最终垂直对齐调整（v151 修复）===');
    for (var g = 0; g < maxGen; g++) {
      if (!allGens[g]) continue;
      for (var i = 0; i < allGens[g].length; i++) {
        var member = allGens[g][i];
        if (!member || !member.member) continue;
        
        // 获取当前人的子女（使用最终位置）
        var children = this.getChildren(member.member.id, relationships, persons);
        if (children.length === 0) continue;
        
        // 直接调整当前人位置以对齐子女
        this.alignParentToChildren(member.member.id, nodePositions, links, relationships, persons, CW, CH, SS);
      }
    }
    
    console.log('节点数:', Object.keys(nodePositions).length, '连线数:', links.length);
    
    // 验证节点位置
    var minX = 99999, maxX = 0, minY = 99999, maxY = 0;
    for (var id in nodePositions) {
      var pos = nodePositions[id];
      if (pos.x < minX) minX = pos.x;
      if (pos.x > maxX) maxX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.y > maxY) maxY = pos.y;
    }
    console.log('节点范围：X[', minX, '-', maxX, '] Y[', minY, '-', maxY, ']');
    
    var that = this;
    this.setData({ 
      treeNodes: { nodes: nodePositions, links: links }, 
      canvasWidth: 8000, 
      canvasHeight: 4000, 
      hasData: true 
    }, function() {
      setTimeout(function() {
        that.drawFamilyTree(nodePositions, links, persons, currentId);
      }, 500);
    });
  },

  // v711-51-fix-v100 按代际统一布局：收集该代所有子女组，统一防碰撞计算
  placeGenerationV3: function(generationMembers, positions, links, rels, persons, CW, CH, SS, gen, Ys) {
    console.log('📐 第', gen, '代统一布局：成员数', generationMembers.length);
    
    // 步骤 1：收集该代所有有子女的夫妻
    var familyGroups = [];
    for (var i = 0; i < generationMembers.length; i++) {
      var member = generationMembers[i];
      if (!member || !member.member || !positions[member.member.id]) continue;
      
      // 检查是否已处理过该父母
      if (this.processedParents[member.member.id]) {
        console.log('  ⏭️ 跳过已处理的父母：', member.member.name);
        continue;
      }
      
      var spouseId = this.getSpouseId(member.member.id, rels, persons);
      if (spouseId && this.processedParents[spouseId]) {
        console.log('  ⏭️ 跳过（配偶已处理）：', member.member.name);
        continue;
      }
      
      // 获取子女
      var children = this.getChildren(member.member.id, rels, persons);
      if (spouseId && children.length === 0) {
        children = this.getChildren(spouseId, rels, persons);
      }
      
      if (children.length === 0) {
        continue;
      }
      
      // 标记已处理
      this.processedParents[member.member.id] = true;
      if (spouseId) {
        this.processedParents[spouseId] = true;
      }
      
      // 计算父母中间位置
      var parentPos = positions[member.member.id];
      var spousePos = spouseId ? positions[spouseId] : null;
      var parentCenterX;
      if (spousePos) {
        parentCenterX = (parentPos.x + CW + spousePos.x) / 2;
      } else {
        parentCenterX = parentPos.x + CW / 2;
      }
      
      familyGroups.push({
        parent: member.member,
        spouseId: spouseId,
        parentPos: parentPos,
        spousePos: spousePos,
        parentCenterX: parentCenterX,
        children: children,
        isSingle: !spousePos
      });
    }
    
    console.log('  有子女的家庭组数：', familyGroups.length);
    
    // 步骤 2：按父母中间位置排序（从左到右）
    familyGroups.sort(function(a, b) {
      return a.parentCenterX - b.parentCenterX;
    });
    
    // 步骤 3：统一防碰撞计算并放置
    var childY = Ys[gen + 1];
    var placedRanges = []; // 已放置的 X 范围
    
    for (var i = 0; i < familyGroups.length; i++) {
      var group = familyGroups[i];
      var parent = group.parent;
      var spouseId = group.spouseId;
      var parentCenterX = group.parentCenterX;
      var children = group.children;
      var isSingle = group.isSingle;
      
      console.log('🔍 放置子女：', parent.name, '子女数:', children.length);
      
      // 计算子女组总宽度
      var totalWidth = 0;
      for (var j = 0; j < children.length; j++) {
        var child = children[j].member;
        var childSpouse = children[j].spouse;
        totalWidth += CW;
        if (childSpouse) {
          totalWidth += SS + CW;
        }
        if (j > 0) {
          totalWidth += SS * 8; // v711-51-fix-v133: 增加兄弟姐妹间距到 80px，避免连线重叠
        }
      }
      
      // 计算理想起始位置
      // v711-51-fix-v130 修复：单子女（带配偶）特殊处理 - 子女中心与父母中间值对齐
      // 子女个人中心 = 子女 X + CW/2
      // 父母中心中间值 = (父中心 + 母中心) / 2
      // 公式：父 X = 子女中心 - CW - SS/2，母 X = 子女中心 + SS/2
      var idealStartX;
      var isSingleChildWithSpouse = false;
      if (children.length === 1 && children[0].spouse && !isSingle && spouseId && positions[spouseId]) {
        // 单子女有配偶：子女中心 = 父母中间值
        idealStartX = parentCenterX - CW / 2;
        isSingleChildWithSpouse = true;
        console.log('  📍 单子女带配偶：子女中心与父母中间值对齐');
      } else {
        idealStartX = parentCenterX - totalWidth / 2;
      }
      
      // 防碰撞检查：向右推移直到不重叠（v711-51-fix-v101 修复：循环检查）
      var startX = idealStartX;
      var needsAdjustment = true;
      while (needsAdjustment) {
        needsAdjustment = false;
        var minPushRight = 0;
        for (var k = 0; k < placedRanges.length; k++) {
          var range = placedRanges[k];
          if (startX < range.maxX && startX + totalWidth > range.minX) {
            var pushRight = range.maxX - startX + SS;
            if (pushRight > minPushRight) {
              minPushRight = pushRight;
              needsAdjustment = true;
            }
          }
        }
        if (needsAdjustment) {
          startX += minPushRight;
        }
      }
      var overlap = startX - idealStartX;
      
      if (overlap > 0) {
        console.log('  ⚠️ 防碰撞推移：', overlap, 'px');
      }
      console.log('  ✅ 起始 X=', startX, '总宽度=', totalWidth);
      
      // 放置子女
      var currentX = startX;
      for (var j = 0; j < children.length; j++) {
        var child = children[j].member;
        var childSpouse = children[j].spouse;
        
        positions[child.id] = { x: currentX, y: childY };
        console.log('    子女', j+1, ':', child.name, '@ X=', currentX);
        
        if (childSpouse) {
          positions[childSpouse.id] = { x: currentX + CW + SS, y: childY };
          console.log('      子女配偶：', childSpouse.name, '@ X=', currentX + CW + SS);
        }
        
        // 添加亲子连线
        links.push({ type: 'parent', from: parent.id, to: child.id });
        if (spouseId) {
          links.push({ type: 'parent', from: spouseId, to: child.id });
        }
        
        // 更新已放置范围
        placedRanges.push({
          minX: currentX,
          maxX: currentX + CW,
          id: child.id
        });
        if (childSpouse) {
          placedRanges.push({
            minX: currentX + CW + SS,
            maxX: currentX + CW + SS + CW,
            id: childSpouse.id
          });
        }
        
        // 更新下一个位置
        currentX += CW;
        if (childSpouse) {
          currentX += SS + CW;
        }
        if (j < children.length - 1) {
          currentX += SS * 8; // v711-51-fix-v133: 增加兄弟姐妹间距到 80px，避免连线重叠
        }
      }
      
      // 计算子女中间值
      var childrenCenterX = startX + totalWidth / 2;
      
      // v711-51-fix-v148 核心修复：父母中间值必须与子女中间值在同一垂直线
      if (!isSingle && spouseId && positions[spouseId]) {
        var coupleWidth = CW + SS + CW;
        // 双亲：父母中间 = 子女中间
        var newParentCenterX = childrenCenterX;
        positions[parent.id].x = newParentCenterX - coupleWidth / 2;
        positions[spouseId].x = newParentCenterX + coupleWidth / 2 - CW;
        console.log('  🔄 调整双亲位置：父@', positions[parent.id].x, '母@', positions[spouseId].x, '父母中间@', (positions[parent.id].x + CW/2 + positions[spouseId].x + CW/2)/2, '子女中心@', childrenCenterX);
      } else {
        // 单亲：单亲中心 = 子女中间
        var parentLabel = parent.gender === 'male' ? '父' : '母';
        // 单亲中心 = 单亲 X + CW/2 = 子女中间
        // 所以：单亲 X = 子女中间 - CW/2
        positions[parent.id].x = childrenCenterX - CW / 2;
        console.log('  🔄 调整单亲位置：', parentLabel, '@', positions[parent.id].x, '单亲中心@', positions[parent.id].x + CW/2, '子女中心@', childrenCenterX);
      }
      
      // v711-51-fix-v184 修复：放置双亲后，检查与左边单亲的间距
      // 防止单亲与双亲的配偶重叠（如安萍与王东）
      if (!isSingle && pushRight === 0) {
        var spouseX = positions[spouseId].x;
        var familyLeftEdge = spouseX; // 双亲家庭的左边缘是配偶的位置
        
        // 检查左边所有已放置的单亲节点
        for (var placedId in positions) {
          var placedPos = positions[placedId];
          // 只检查同一代（相同 Y 坐标）的单亲节点
          if (placedPos.y === positions[parent.id].y && placedPos.x < familyLeftEdge) {
            // 检查这个单亲是否有配偶（如果配偶不在 positions 中，说明是单亲）
            var placedPerson = persons.find(function(p) { return p.id === placedId; });
            var placedSpouseId = null;
            if (placedPerson && placedPerson.spouse) {
              placedSpouseId = placedPerson.spouse;
            }
            
            // 如果是单亲（没有配偶在 positions 中）
            if (!placedSpouseId || !positions[placedSpouseId]) {
              var placedRightEdge = placedPos.x + CW;
              var spacing = familyLeftEdge - placedRightEdge;
              
              if (spacing < minSameGenSpacing && spacing >= 0) {
                var neededPush = minSameGenSpacing - spacing;
                // 当前家庭向右推
                positions[parent.id].x += neededPush;
                positions[spouseId].x += neededPush;
                
                // 推移子女（保持垂直对齐）
                for (var j = 0; j < children.length; j++) {
                  var child = children[j].member;
                  var childSpouse = children[j].spouse;
                  if (positions[child.id]) {
                    positions[child.id].x += neededPush;
                  }
                  if (childSpouse && positions[childSpouse.id]) {
                    positions[childSpouse.id].x += neededPush;
                  }
                }
                
                console.log('  ⚠️ 双亲 - 单亲防碰撞：', parent.name, '家庭向右推移', neededPush, 'px (避免与左边单亲', placedPerson.name, '的配偶重叠)');
                console.log('  ✅ 推移后：', parent.name, '@', positions[parent.id].x, '配偶@', positions[spouseId].x);
              }
            }
          }
        }
      }
      
      // v711-51-fix-v183 修复：放置父母后，立即检查与左边同代节点的间距
      // 如果间距 < 100px，向右推移当前家庭（父母 + 子女）
      var minSameGenSpacing = 100; // 同代最小间距
      var parentX = positions[parent.id].x;
      var pushRight = 0;
      
      // v711-51-fix-v183: 计算当前家庭的左边缘（考虑配偶可能在左边）
      var currentFamilyLeftEdge = parentX;
      if (spouseId && positions[spouseId]) {
        var spouseX = positions[spouseId].x;
        if (spouseX < currentFamilyLeftEdge) {
          currentFamilyLeftEdge = spouseX;
        }
      }
      
      // 检查左边所有已放置的同代节点
      for (var placedId in positions) {
        var placedPos = positions[placedId];
        // 只检查同一代（相同 Y 坐标）且在当前家庭左边的节点
        if (placedPos.y === positions[parent.id].y && placedPos.x < currentFamilyLeftEdge) {
          var placedRightEdge = placedPos.x + CW;
          var spacing = currentFamilyLeftEdge - placedRightEdge;
          
          if (spacing < minSameGenSpacing && spacing >= 0) {
            var neededPush = minSameGenSpacing - spacing;
            if (neededPush > pushRight) {
              pushRight = neededPush;
            }
          }
        }
      }
      
      // 如果需要推移，同时推移父母和子女
      if (pushRight > 0) {
        console.log('  ⚠️ 同代防碰撞：', parent.name, '向右推移', pushRight, 'px');
        
        // 推移父母
        positions[parent.id].x += pushRight;
        if (spouseId && positions[spouseId]) {
          positions[spouseId].x += pushRight;
        }
        
        // 推移子女（保持垂直对齐）
        for (var j = 0; j < children.length; j++) {
          var child = children[j].member;
          var childSpouse = children[j].spouse;
          if (positions[child.id]) {
            positions[child.id].x += pushRight;
          }
          if (childSpouse && positions[childSpouse.id]) {
            positions[childSpouse.id].x += pushRight;
          }
        }
        
        console.log('  ✅ 推移后：', parent.name, '@', positions[parent.id].x);
      }
    }
  },
  
  // v711-51-fix-v99 防碰撞修复：添加动态防碰撞系统
  // 检查并解决子女位置与同代其他节点的碰撞
  checkCollisionAndAdjust: function(children, positions, CW, CH, SS, childY, parentCenterX) {
    // 收集该代所有已放置的节点 X 坐标范围
    var occupiedRanges = [];
    for (var id in positions) {
      var pos = positions[id];
      if (pos.y === childY) {
        occupiedRanges.push({
          id: id,
          minX: pos.x,
          maxX: pos.x + CW
        });
      }
    }
    
    // 计算子女组的总宽度（包括配偶）
    var totalWidth = 0;
    for (var i = 0; i < children.length; i++) {
      var child = children[i].member;
      var childSpouse = children[i].spouse;
      totalWidth += CW;
      if (childSpouse) {
        totalWidth += SS + CW;
      }
      if (i > 0) {
        totalWidth += SS * 8; // v711-51-fix-v133: 增加兄弟姐妹间距到 80px，避免连线重叠
      }
    }
    
    // 计算理想的起始位置（以父母中间为中心）
    var idealStartX = parentCenterX - totalWidth / 2;
    var idealEndX = idealStartX + totalWidth;
    
    // 检查是否与已占用的范围重叠
    var overlap = 0;
    for (var i = 0; i < occupiedRanges.length; i++) {
      var range = occupiedRanges[i];
      // 检查重叠：理想范围 [idealStartX, idealEndX] 与占用范围 [minX, maxX]
      if (idealStartX < range.maxX && idealEndX > range.minX) {
        // 有重叠，计算需要向右推移的距离
        if (range.maxX > idealStartX) {
          var pushRight = range.maxX - idealStartX + SS * 8; // v711-51-fix-v133: 防碰撞间距 80px
          if (pushRight > overlap) {
            overlap = pushRight;
          }
        }
      }
    }
    
    // 返回调整后的起始位置
    return idealStartX + overlap;
  },
  
  // v49.0 核心：先计算父母中间，再查找子女，然后计算子女位置
  placeChildrenV2: function(parent, positions, links, rels, persons, CW, CH, SS, gen, Ys) {
    if (!positions[parent.id]) return;
    
    // v711-14 修复：检查是否已处理过该父母，避免夫妻双方重复放置子女
    if (!this.processedParents) this.processedParents = {};
    if (this.processedParents[parent.id]) {
      console.log('⏭️ 跳过已处理的父母：', parent.name);
      return;
    }
    
    // v711-14 修复：同时标记配偶已处理，避免重复
    var spouseId = this.getSpouseId(parent.id, rels, persons);
    if (spouseId && this.processedParents[spouseId]) {
      var sp = null;
      for (var k = 0; k < persons.length; k++) {
        if (persons[k].id === spouseId) {
          sp = persons[k];
          break;
        }
      }
      console.log('⏭️ 跳过（配偶已处理）：', parent.name, '配偶:', sp ? sp.name : '未知');
      return;
    }
    this.processedParents[parent.id] = true;
    if (spouseId) {
      this.processedParents[spouseId] = true;
    }
    
    var parentPos = positions[parent.id];
    var spouseId = this.getSpouseId(parent.id, rels, persons);
    var spousePos = spouseId ? positions[spouseId] : null;
    
    // v49.0 步骤 1：先计算父母中间位置
    var parentCenterX;
    if (spousePos) {
      parentCenterX = (parentPos.x + CW + spousePos.x) / 2;
      var spName = '无配偶';
      if (spouseId) {
        for (var k = 0; k < persons.length; k++) {
          if (persons[k].id === spouseId) {
            spName = persons[k].name;
            break;
          }
        }
      }
      console.log('🔍 放置子女：', parent.name, '+', spName, '→ 中间 X=', parentCenterX);
    } else {
      parentCenterX = parentPos.x + CW / 2;
      console.log('🔍 放置子女（单亲）：', parent.name, '→ 中间 X=', parentCenterX);
    }
    
    // v49.0 步骤 2：查找自己有几个子女
    var children = this.getChildren(parent.id, rels, persons);
    
    // v711-37 修复：如果有配偶，合并夫妻双方的子女（数据中子女关系可能只从父亲建立）
    if (spouseId && children.length === 0) {
      children = this.getChildren(spouseId, rels, persons);
      console.log('  📌 从配偶获取子女：', children.length);
    }
    
    console.log('  子女数量:', children.length);
    
    if (children.length === 0) {
      console.log('  无子女，跳过');
      return;
    }
    
    // v49.0 步骤 3：计算子女位置
    var childY = Ys[gen + 1];
    
    if (children.length === 1) {
      // v711-09 修复：单个子女强制在父母中间正下方（覆盖第一步的初始位置）
      var onlyChild = children[0].member;
      var onlyChildX = parentCenterX - CW / 2;
      
      // v711-51-fix-v99 防碰撞：检查该位置是否被占用
      var collision = false;
      for (var id in positions) {
        var pos = positions[id];
        if (pos.y === childY && id !== onlyChild.id) {
          if (onlyChildX < pos.x + CW && onlyChildX + CW > pos.x) {
            collision = true;
            break;
          }
        }
      }
      
      if (collision) {
        // 向右推移直到没有碰撞
        var pushRight = 0;
        for (var id in positions) {
          var pos = positions[id];
          if (pos.y === childY) {
            if (onlyChildX + pushRight < pos.x + CW && onlyChildX + pushRight + CW > pos.x) {
              var needed = pos.x + CW - (onlyChildX + pushRight) + SS;
              if (needed > pushRight) pushRight = needed;
            }
          }
        }
        onlyChildX += pushRight;
        console.log('  ⚠️ 单个子女防碰撞推移：', onlyChild.name, '→ X=', onlyChildX, '(推移', pushRight, 'px)');
      }
      
      // 强制覆盖位置，确保垂直对齐
      positions[onlyChild.id] = { x: onlyChildX, y: childY };
      console.log('  ✅ 单个子女：', onlyChild.name, '@ X=', onlyChildX, '(父母中间正下方，强制对齐)');
      
      // v711-09 修复：子女配偶强制放在子女右侧
      var onlyChildSpouse = children[0].spouse;
      if (onlyChildSpouse) {
        // 检查配偶位置是否碰撞
        var spouseX = onlyChildX + CW + SS;
        for (var id in positions) {
          var pos = positions[id];
          if (pos.y === childY && id !== onlyChildSpouse.id) {
            if (spouseX < pos.x + CW && spouseX + CW > pos.x) {
              var needed = pos.x + CW - spouseX + SS;
              spouseX += needed;
              console.log('    子女配偶防碰撞推移：', onlyChildSpouse.name, '→ X=', spouseX);
              break;
            }
          }
        }
        positions[onlyChildSpouse.id] = { x: spouseX, y: childY };
        console.log('    子女配偶：', onlyChildSpouse.name, '@ X=', spouseX, '(强制)');
      }
      
      links.push({ type: 'parent', from: parent.id, to: onlyChild.id });
      if (spouseId) {
        links.push({ type: 'parent', from: spouseId, to: onlyChild.id });
      }
      
      // v711-51-fix-v99 核心：调整父母位置，确保父母中间值与子女中间值垂直对齐
      var childrenCenterX = onlyChildX + CW / 2;
      if (spousePos) {
        // 重新计算父母位置，使父母中间 = 子女中间
        var newParentCenterX = childrenCenterX;
        var coupleWidth = CW + SS + CW; // 夫妻总宽度
        positions[parent.id].x = newParentCenterX - coupleWidth / 2;
        positions[spouseId].x = newParentCenterX + coupleWidth / 2 - CW;
        console.log('  🔄 调整父母位置以对齐子女中心：父@', positions[parent.id].x, '母@', positions[spouseId].x);
      } else {
        // 单亲：父亲 X = 子女 X
        positions[parent.id].x = onlyChildX;
        console.log('  🔄 调整单亲位置以对齐子女：父@', positions[parent.id].x);
      }
    } else {
      // v711-13 修复：多个子女时考虑每个子女是否有配偶
      var totalWidth = 0;
      for (var i = 0; i < children.length; i++) {
        var child = children[i].member;
        var childSpouse = children[i].spouse;
        totalWidth += CW; // 子女本身
        if (childSpouse) {
          totalWidth += SS + CW; // 有配偶：加间距 + 配偶宽度
        }
        if (i > 0) {
          totalWidth += SS * 8; // v711-51-fix-v133: 增加兄弟姐妹间距到 80px，避免连线重叠
        }
      }
      
      // v711-51-fix-v99 防碰撞：检查并调整起始位置
      var startX = this.checkCollisionAndAdjust(children, positions, CW, CH, SS, childY, parentCenterX);
      
      console.log('  ✅ 多个子女：总宽度=', totalWidth, '起始 X=', startX, '(防碰撞调整后，对齐父母中间)');
      
      // v711-13 修复：动态计算每个子女的位置，考虑配偶
      var currentChildX = startX;
      for (var i = 0; i < children.length; i++) {
        var child = children[i].member;
        var childSpouse = children[i].spouse;
        
        var childX = currentChildX;
        
        // v711-09 修复：强制覆盖位置，确保垂直对齐
        positions[child.id] = { x: childX, y: childY };
        console.log('    子女', i+1, ':', child.name, '@ X=', childX);
        
        // v711-09 修复：强制覆盖子女配偶位置
        if (childSpouse) {
          positions[childSpouse.id] = { x: childX + CW + SS, y: childY };
          console.log('      子女配偶：', childSpouse.name, '@ X=', childX + CW + SS, '(强制)');
        }
        
        // v711-13 修复：更新下一个子女的起始位置
        currentChildX += CW; // 子女本身宽度
        if (childSpouse) {
          currentChildX += SS + CW; // 有配偶：加间距 + 配偶宽度
        }
        if (i < children.length - 1) {
          currentChildX += SS * 8; // v711-51-fix-v133: 子女之间间距 80px
        }
        
        links.push({ type: 'parent', from: parent.id, to: child.id });
        if (spouseId) {
          links.push({ type: 'parent', from: spouseId, to: child.id });
        }
      }
      
      // v711-51-fix-v99 核心：调整父母位置，确保父母中间值与子女中间值垂直对齐
      var childrenCenterX = startX + totalWidth / 2;
      if (spousePos) {
        // 重新计算父母位置，使父母中间 = 子女中间
        var newParentCenterX = childrenCenterX;
        var coupleWidth = CW + SS + CW; // 夫妻总宽度
        positions[parent.id].x = newParentCenterX - coupleWidth / 2;
        positions[spouseId].x = newParentCenterX + coupleWidth / 2 - CW;
        console.log('  🔄 调整父母位置以对齐子女中心：父@', positions[parent.id].x, '母@', positions[spouseId].x, '子女中心@', childrenCenterX);
      } else {
        // 单亲：父亲 X = 子女中间 - CW/2
        positions[parent.id].x = childrenCenterX - CW / 2;
        console.log('  🔄 调整单亲位置以对齐子女中心：父@', positions[parent.id].x, '子女中心@', childrenCenterX);
      }
    }
  },

  // v45.0 向上调整 V3：添加详细调试日志
  adjustParentPositionV3: function(person, positions, links, rels, persons, CW, CH, SS) {
    var ps = this.getParents(person.id, rels, persons);
    
    // 找到所有子女（包括兄弟姐妹）
    var siblings = this.getSiblings(person.id, rels, persons);
    var allChildren = [person].concat(siblings);
    
    // 计算所有子女的 X 中心
    var minX = 99999, maxX = 0;
    var validCount = 0;
    var childPositions = [];
    for (var i = 0; i < allChildren.length; i++) {
      var child = allChildren[i].member || allChildren[i];
      if (positions[child.id]) {
        validCount++;
        childPositions.push({
          name: child.name,
          x: positions[child.id].x,
          right: positions[child.id].x + CW
        });
        if (positions[child.id].x < minX) minX = positions[child.id].x;
        if (positions[child.id].x + CW > maxX) maxX = positions[child.id].x + CW;
      }
    }
    
    console.log('🔍 向上调整调试：子女数=', validCount, '子女位置:', JSON.stringify(childPositions));
    
    if (validCount === 0) {
      return; // 没有子女位置信息，无法调整
    }
    
    // 情况 1：父母双全 - v711-51-fix-v148 修复：确保父母中间与子女中间垂直对齐
    if (ps.father && positions[ps.father.id] && ps.mother && positions[ps.mother.id]) {
      var fatherX;
      if (validCount === 1) {
        // 单个子女：父母中间 = 子女中心
        var onlyChild = allChildren[0].member || allChildren[0];
        var childCenterX = positions[onlyChild.id].x + CW / 2;
        var childSpouseId = this.getSpouseId(onlyChild.id, rels, persons);
        if (childSpouseId && positions[childSpouseId]) {
          childCenterX = (positions[onlyChild.id].x + CW/2 + positions[childSpouseId].x + CW/2) / 2;
        }
        // 父母中间 = (fatherX + CW/2 + fatherX + CW + SS + CW/2) / 2 = fatherX + CW + SS/2
        // 所以：fatherX = childCenterX - CW - SS/2
        fatherX = childCenterX - CW - SS / 2;
        console.log('✅ 父母双全 - 单子女规则：父@ X=', fatherX, '子女中心@', childCenterX);
      } else {
        // 多个子女：父母中间 = 子女整体中间
        var childrenCenterX = (minX + maxX) / 2;
        // 父母中间 = fatherX + CW + SS/2 = childrenCenterX
        // 所以：fatherX = childrenCenterX - CW - SS/2
        fatherX = childrenCenterX - CW - SS / 2;
        console.log('✅ 父母双全 - 多子女规则：父@ X=', fatherX, '子女中间@', childrenCenterX);
      }
      
      positions[ps.father.id].x = fatherX;
      positions[ps.mother.id].x = fatherX + CW + SS;
      console.log('  母@ X=', positions[ps.mother.id].x);
    }
    // 情况 2：只有父亲（单身父亲）- v711-51-fix-v148 修复：确保父亲中心与子女中间垂直对齐
    else if (ps.father && positions[ps.father.id]) {
      var fatherX;
      if (validCount === 1) {
        var onlyChild = allChildren[0].member || allChildren[0];
        // 单子女：父亲中心 = 子女中心
        var childCenterX = positions[onlyChild.id].x + CW / 2;
        var childSpouseId = this.getSpouseId(onlyChild.id, rels, persons);
        if (childSpouseId && positions[childSpouseId]) {
          childCenterX = (positions[onlyChild.id].x + CW/2 + positions[childSpouseId].x + CW/2) / 2;
        }
        fatherX = childCenterX - CW / 2;
        console.log('✅ 单身父亲 - 单子女规则：父@ X=', fatherX, '子女中心@', childCenterX);
      } else {
        // 多子女：父亲中心 = 子女整体中间
        var childrenCenterX = (minX + maxX) / 2;
        fatherX = childrenCenterX - CW / 2;
        console.log('✅ 单身父亲 - 多子女规则：父@ X=', fatherX, '子女中间@', childrenCenterX);
      }
      
      positions[ps.father.id].x = fatherX;
    }
    // 情况 3：只有母亲（单身母亲）- v711-51-fix-v148 修复：确保母亲中心与子女中间垂直对齐
    else if (ps.mother && positions[ps.mother.id]) {
      var motherX;
      if (validCount === 1) {
        var onlyChild = allChildren[0].member || allChildren[0];
        // 单子女：母亲中心 = 子女中心
        var childCenterX = positions[onlyChild.id].x + CW / 2;
        var childSpouseId = this.getSpouseId(onlyChild.id, rels, persons);
        if (childSpouseId && positions[childSpouseId]) {
          childCenterX = (positions[onlyChild.id].x + CW/2 + positions[childSpouseId].x + CW/2) / 2;
        }
        motherX = childCenterX - CW / 2;
        console.log('✅ 单身母亲 - 单子女规则：母@ X=', motherX, '子女中心@', childCenterX);
      } else {
        // 多子女：母亲中心 = 子女整体中间
        var childrenCenterX = (minX + maxX) / 2;
        motherX = childrenCenterX - CW / 2;
        console.log('✅ 单身母亲 - 多子女规则：母@ X=', motherX, '子女中间@', childrenCenterX);
      }
      
      positions[ps.mother.id].x = motherX;
    }
  },

  // v711-51-fix-v150 新增：直接调整父母位置以对齐子女（最终垂直对齐）
  alignParentToChildren: function(parentId, positions, links, rels, persons, CW, CH, SS) {
    // parentId 就是有子女的父母，直接调整他/她的位置
    var parent = persons.find(function(p) { return p.id === parentId; });
    if (!parent || !positions[parentId]) return;
    
    // 获取配偶
    var spouseId = this.getSpouseId(parentId, rels, persons);
    
    // 获取所有子女
    var allChildren = this.getChildren(parentId, rels, persons);
    if (allChildren.length === 0) return;
    
    // 收集子女位置
    var minX = 99999, maxX = 0, validCount = 0;
    for (var i = 0; i < allChildren.length; i++) {
      var child = allChildren[i].member || allChildren[i];
      if (child && positions[child.id]) {
        validCount++;
        if (positions[child.id].x < minX) minX = positions[child.id].x;
        if (positions[child.id].x + CW > maxX) maxX = positions[child.id].x + CW;
      }
    }
    
    if (validCount === 0) return;
    
    var childrenCenterX = (minX + maxX) / 2;
    
    // 情况 1：父母双全
    if (spouseId && positions[spouseId]) {
      // 确定谁是父亲谁是母亲
      var isParentMale = parent.gender === 'male';
      var fatherId = isParentMale ? parentId : spouseId;
      var motherId = isParentMale ? spouseId : parentId;
      var fatherName = persons.find(function(p) { return p.id === fatherId; }).name;
      var motherName = persons.find(function(p) { return p.id === motherId; }).name;
      
      // 父母中间 = fatherX + CW + SS/2 = childrenCenterX
      // 所以：fatherX = childrenCenterX - CW - SS/2
      var fatherX = childrenCenterX - CW - SS / 2;
      
      positions[fatherId].x = fatherX;
      positions[motherId].x = fatherX + CW + SS;
      console.log('✅ 最终对齐 - 父母双全：父=', fatherName, 'X=', fatherX, '母=', motherName, 'X=', positions[motherId].x, '子女中心@', childrenCenterX);
    }
    // 情况 2：只有父亲或只有母亲
    else {
      var parentX = childrenCenterX - CW / 2;
      positions[parentId].x = parentX;
      console.log('✅ 最终对齐 - 单亲：', parent.name, 'X=', parentX, '子女中心@', childrenCenterX);
    }
  },

  // 计算夫妻所需宽度
  // v711-05 修复：添加 visited 参数防止无限递归
  calculateCoupleWidth: function(couple, relationships, persons, CW, SS, visited) {
    if (!couple || (!couple.husband && !couple.wife)) return CW;
    if (!visited) visited = {};
    
    var pid = couple.husband ? couple.husband.id : couple.wife.id;
    if (visited[pid]) return CW; // 已访问过，防止循环
    visited[pid] = true;
    
    var children = this.getChildren(pid, relationships, persons);
    
    if (!children || children.length === 0) {
      return (couple.husband ? CW : 0) + (couple.wife ? CW + SS : 0);
    }
    
    // v711-11 修复：计算子女总宽度时，考虑每个子女是否有配偶
    var totalWidth = 0;
    for (var i = 0; i < children.length; i++) {
      var child = children[i].member;
      var childSpouseId = this.getSpouseId(child.id, relationships, persons);
      
      // 单个子女（含配偶）的宽度
      var childWidth = CW;
      if (childSpouseId) {
        childWidth += SS + CW; // 有配偶：270px
      }
      
      totalWidth += childWidth;
      
      // 子女之间间距：40px
      if (i > 0) {
        totalWidth += SS * 8; // v711-51-fix-v133: 增加兄弟姐妹间距到 80px，避免连线重叠
      }
    }
    
    var coupleWidth = (couple.husband ? CW : 0) + (couple.wife ? CW + SS : 0);
    return Math.max(coupleWidth, totalWidth);
  },

  // v49.0 开始绘制
  drawFamilyTree: function(nodePositions, links, persons, currentId) {
    console.log('=== v49.0 开始绘制 ===');
    var ctx = this.ctx;
    var CW = 100, CH = 120;
    
    if (!ctx) {
      console.error('ctx 为 null');
      var that = this;
      setTimeout(function() { that.drawFamilyTree(nodePositions, links, persons, currentId); }, 500);
      return;
    }
    
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);
    
    var childrenByParents = {};
    for (var i = 0; i < links.length; i++) {
      var lk = links[i];
      if (lk.type === 'parent') {
        var parentKey = lk.from;
        if (!childrenByParents[parentKey]) childrenByParents[parentKey] = [];
        childrenByParents[parentKey].push(nodePositions[lk.to]);
      }
    }
    
    ctx.setStrokeStyle('#4a90e2');
    ctx.setLineWidth(1.5);
    
    // 1. 绘制配偶连线
    console.log('🔍 绘制配偶连线：共', links.length, '条，其中 spouse 类型：', links.filter(function(l) { return l.type === 'spouse'; }).length);
    // v711-18 修复：过滤重复的 spouse 连线（按位置）
    var drawnSpousePairs = {};
    for (var i = 0; i < links.length; i++) {
      var lk = links[i];
      if (lk.type === 'spouse') {
        var fp = nodePositions[lk.from], tp = nodePositions[lk.to];
        if (fp && tp) {
          // 创建位置键（小的 X 在前，避免方向问题）
          var posKey = (fp.x < tp.x) ? (fp.x + '-' + tp.x) : (tp.x + '-' + fp.x);
          if (drawnSpousePairs[posKey]) {
            console.log('⚠️ 跳过重复的配偶连线（位置相同）:', lk.from, '(', fp.x, ') →', lk.to, '(', tp.x, ')');
            continue;
          }
          drawnSpousePairs[posKey] = true;
          console.log('  📍', lk.from, '(', fp.x, ') →', lk.to, '(', tp.x, ')');
          ctx.beginPath();
          // v711-37 修复：从左侧节点右侧连到右侧节点左侧（内侧短横线，长度适中）
          var leftNode = fp.x < tp.x ? fp : tp;
          var rightNode = fp.x < tp.x ? tp : fp;
          ctx.moveTo(leftNode.x + CW, leftNode.y + CH / 2);
          ctx.lineTo(rightNode.x, rightNode.y + CH / 2);
          ctx.stroke();
        } else {
          console.log('  ⚠️ 缺失位置：', lk.from, '→', lk.to, 'fp=', fp, 'tp=', tp);
        }
      }
    }
    
    // 2. 绘制亲子连线
    for (var parentId in childrenByParents) {
      var children = childrenByParents[parentId];
      var parentPos = nodePositions[parentId];
      var spouseId = this.getSpouseId(parentId, this.data.relationships, persons);
      var spousePos = spouseId ? nodePositions[spouseId] : null;
      
      if (!parentPos || children.length === 0) continue;
      
      var parentBottomY = parentPos.y + CH;
      var childrenTopY = children[0].y;
      
      var parentCenterX;
      if (spousePos) {
        parentCenterX = (parentPos.x + CW + spousePos.x) / 2;
      } else {
        parentCenterX = parentPos.x + CW / 2;
      }
      
      children.sort(function(a, b) { return a.x - b.x; });
      
      ctx.beginPath();
      
      var midY = parentBottomY + (childrenTopY - parentBottomY) / 2;
      var firstChildCenterX = children[0].x + CW / 2;
      var lastChildCenterX = children[children.length - 1].x + CW / 2;
      
      ctx.moveTo(parentCenterX, parentBottomY);
      ctx.lineTo(parentCenterX, midY);
      
      ctx.moveTo(firstChildCenterX, midY);
      ctx.lineTo(lastChildCenterX, midY);
      
      for (var j = 0; j < children.length; j++) {
        var childCenterX = children[j].x + CW / 2;
        ctx.moveTo(childCenterX, midY);
        ctx.lineTo(childCenterX, childrenTopY);
      }
      
      ctx.stroke();
    }
    
    // 3. 绘制成员卡片
    var drawCount = 0;
    for (var id in nodePositions) {
      var pos = nodePositions[id], p = persons.find(function(x) { return x.id === id; });
      if (p && pos) {
        drawCount++;
        var isCur = (id === currentId);
        
        ctx.setStrokeStyle(isCur ? '#f0c342' : '#d0d7de');
        ctx.setLineWidth(1);
        ctx.strokeRect(pos.x, pos.y, CW, CH);
        
        var avatar = p.gender === 'male' ? '👨' : '👩';
        if (p.status === 'deceased') ctx.setGlobalAlpha(0.6);
        ctx.setFontSize(32);
        ctx.setTextAlign('center');
        ctx.fillText(avatar, pos.x + CW / 2, pos.y + 40);
        if (p.status === 'deceased') ctx.setGlobalAlpha(1);
        
        var title = this.calculateTitle(currentId, id, this.data.relationships, persons);
        if (title) {
          ctx.setFillStyle('#666666');
          ctx.setFontSize(10);
          ctx.fillText(title, pos.x + CW / 2, pos.y + 65);
        }
        
        ctx.setFillStyle('#333333');
        ctx.setFontSize(12);
        var nameY = title ? pos.y + 85 : pos.y + 70;
        ctx.fillText(p.name, pos.x + CW / 2, nameY);
        
        if (isCur) { 
          ctx.setFillStyle('#f0c342');
          ctx.fillRect(pos.x, pos.y, CW, 4);
        }
      }
    }
    
    console.log('绘制了', drawCount, '个成员');
    
    ctx.draw(false, function(res) {
      console.log((res && res.errMsg && res.errMsg.indexOf('ok') !== -1) ? '✅ 绘制成功！' : '绘制失败:', res && res.errMsg ? res.errMsg : res);
    });
  },

  saveImage: function() {
    var that = this;
    if (!this.ctx || !this.data.hasData) {
      wx.showToast({ title: '请先等待家谱绘制完成', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '生成中...', mask: true });
    wx.canvasToTempFilePath({
      canvasId: 'familyTreeCanvas',
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      success: function(res) {
        wx.hideLoading();
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function() { wx.showToast({ title: '保存成功', icon: 'success' }); },
          fail: function(err) { wx.showToast({ title: '保存失败', icon: 'none', duration: 3000 }); }
        });
      },
      fail: function(err) {
        wx.hideLoading();
        wx.showToast({ title: '生成失败', icon: 'none', duration: 3000 });
      }
    }, that);
  },

  goHome: function() { wx.navigateBack({ delta: 1 }); }
});

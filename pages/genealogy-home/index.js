// pages/index/index.js - 基于 v287 修复三个核心问题
var cloudSync = require('../../utils/cloud-sync.js');
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
    allMembers: [],
    _shareTreeId: '',
    _loadingSharedTree: false
  },

  onLoad: function (options) {
    // 检查是否从分享链接打开
    if (options && options.sharedTreeId) {
      console.log('=== 检测到分享链接 ===');
      console.log('sharedTreeId:', options.sharedTreeId);
      this._loadingSharedTree = true;
      console.log('[onLoad] 设置加载锁为 true（同步）');
      this.loadSharedTree(options.sharedTreeId);
    } else {
      this.loadData();
    }
  },


  // 自动保存到云端（为分享做准备）
  autoSaveToCloud: function(persons, relationships, familyName) {
    var currentTreeId = wx.getStorageSync('currentTreeId') || '';
    if (!currentTreeId || persons.length === 0) return;
    
    // 如果当前查看的是导入的分享树（currentTreeId 以 imported_ 开头），跳过保存
    // 避免把别人的数据保存到自己的云端文档，导致分享链接指向错误的数据
    if (currentTreeId.indexOf('imported_') === 0) {
      console.log('[autoSaveToCloud] 当前为导入的分享树，跳过自动保存');
      return;
    }
    
    // v9 修复：使用树专属云端文档，每棵本地树对应独立云端文档
    cloudSync.getTreeDocId(currentTreeId).then(function(docId) {
      console.log('[autoSaveToCloud] 树 ' + currentTreeId + ' 的云端文档已就绪:', docId);
    }).catch(function(err) {
      console.error('[autoSaveToCloud] getTreeDocId 失败:', err);
    });
    console.log('=== 自动保存到家谱云 ===');
    var that = this;
    
    cloudSync.saveTreeToCloud(currentTreeId, {
      tree_id: currentTreeId,
      local_tree_id: currentTreeId,
      tree_name: familyName,
      persons: persons,
      relationships: relationships
    }).then(function (res) {
      console.log('自动保存成功，treeDocId:', res.treeId);
    }).catch(function (err) {
      console.error('自动保存失败:', err);
    });
  },
  // 加载分享的家谱数据
  loadSharedTree: function (sharedTreeId) {
    var that = this;
    console.log('=== 开始加载分享数据 ===');
    console.log('sharedTreeId:', sharedTreeId);
    
    wx.showLoading({ title: '加载家谱中...' });
    
    cloudSync.loadFromCloud(sharedTreeId).then(function (res) {
      console.log('云端数据加载成功');
      var cloudData = res.data;
      console.log('云端 persons:', cloudData.persons ? cloudData.persons.length : 0);
      console.log('云端 relationships:', cloudData.relationships ? cloudData.relationships.length : 0);
      if (cloudData.persons && cloudData.persons.length > 0) {
        console.log('第一个人:', JSON.stringify(cloudData.persons[0]));
      }
      
      // 将云端数据导入本地
      var familyTrees = wx.getStorageSync('familyTrees') || [];
      
      // 检查是否已导入过
      var importedTreeId = 'imported_' + sharedTreeId;
      var alreadyImported = false;
      for (var i = 0; i < familyTrees.length; i++) {
        if (familyTrees[i].id === importedTreeId) {
          alreadyImported = true;
          break;
        }
      }
      
      if (!alreadyImported) {
        var newTree = {
          id: importedTreeId,
          name: cloudData.tree_name + '（分享）',
          memberCount: cloudData.persons ? cloudData.persons.length : 0
        };
        familyTrees.push(newTree);
        wx.setStorageSync('familyTrees', familyTrees);
      }
      
      // 保存数据到本地
      var personsKey = 'persons_' + importedTreeId;
      var relationshipsKey = 'relationships_' + importedTreeId;
      wx.setStorageSync(personsKey, cloudData.persons || []);
      wx.setStorageSync(relationshipsKey, cloudData.relationships || []);
      wx.setStorageSync('currentTreeId', importedTreeId);
      
      // 关键修复：导入别人的分享树后，清除 sharedTreeId
      // 避免后续切换回自己的树时，autoSaveToCloud 被 sharedTreeId 检查拦截
      // 导致自己的树无法保存到云端，分享时 sharedTreeId 仍指向别人的文档
      wx.removeStorageSync('sharedTreeId');
      console.log('[loadSharedTree] 已清除 sharedTreeId，避免数据污染');
      
      wx.hideLoading();
      wx.showToast({ title: '家谱加载成功', icon: 'success' });
      
      console.log('[loadSharedTree] 导入完成，准备调用 loadData');
      console.log('[loadSharedTree] 当前 currentTreeId:', wx.getStorageSync('currentTreeId'));
      
      // 同步重置加载锁，再加载数据
      that._loadingSharedTree = false;
      console.log('[loadSharedTree] 加载锁已重置为 false');
      // 重新加载页面数据
      that.loadData();
      
      // v9 修复：导入树不需要创建云端文档（只在本地保存），移除 getMyDocId 调用
      console.log('[loadSharedTree] 导入树仅在本地保存，不创建云端文档');
    }).catch(function (err) {
      wx.hideLoading();
      console.error('加载分享数据失败:', err);
      wx.showToast({ title: '加载失败: ' + (err.errMsg || '未知错误'), icon: 'none' });
      // 同步重置加载锁，回退到本地数据
      that._loadingSharedTree = false;
      that.loadData();
    });
  },

  onShow: function () {
    // 如果正在加载分享数据，跳过 loadData，避免覆盖（同步检查）
    if (this._loadingSharedTree) {
      console.log('[onShow] 正在加载分享数据，跳过本地数据加载');
      return;
    }
    this.loadData();
    
    // v31-fix: 检查是否需要从云端恢复（如删除重装后）
    var localTrees = wx.getStorageSync('family_trees') || {};
    var hasLocalData = false;
    var keys = Object.keys(localTrees);
    for (var i = 0; i < keys.length; i++) {
      var tree = localTrees[keys[i]];
      if (tree && tree.persons && tree.persons.length > 0) {
        hasLocalData = true;
        break;
      }
    }
    
    if (!hasLocalData && getApp().globalData.cloudInitialized) {
      console.log('[onShow] 本地无数据但云已初始化，尝试云端恢复');
      this.restoreFromCloud();
    }
  },

  
  // v31-fix: 从云端恢复数据
  restoreFromCloud: function() {
    var that = this;
    var cloudSync = require('../../utils/cloud-sync.js');
    
    cloudSync.restoreFromCloud().then(function(result) {
      if (result.success && result.data) {
        console.log('[index] 云端恢复成功，重新加载页面');
        that.loadData();
      }
    }).catch(function(err) {
      console.error('[index] 云端恢复失败:', err);
    });
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
    
    // 备用：尝试不带后缀的 key
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
    
    // v448 修复：动态计算实际辈分级数
    var totalGenerations = this.calculateGenerations(persons, relationships);
    
    this.setData({ 
      persons: persons, 
      relationships: relationships,
      totalPersons: persons.length,
      totalRelationships: relationships.length,
      totalGenerations: totalGenerations,
      familyName: familyName
    }, function() {
      // setData 回调：数据已更新到 this.data
      if (persons.length > 0) {
        console.log('[loadData] setData 完成，persons:', persons.length);
        // 修复：只在 currentPersonId 为空时才设置为第一个人，否则保持当前选择
        var savedCurrentPersonId = wx.getStorageSync('currentPersonId_' + currentTreeId);
        if (!savedCurrentPersonId) {
          this.setCurrentPerson(persons[0].id);
        } else {
          // 使用保存的 currentPersonId
          this.setCurrentPerson(savedCurrentPersonId);
        }
        this.autoSaveToCloud(persons, relationships, familyName);
      } else {
        console.log('[loadData] 无数据');
        // v9 修复：即使没有数据，也为当前树预创建云端文档
        var that = this;
        cloudSync.getTreeDocId(currentTreeId).then(function(docId) {
          console.log('[loadData] 空数据场景 - 树 ' + currentTreeId + ' 的云端文档已预缓存:', docId);
        }).catch(function(err) {
          console.error('[loadData] getTreeDocId 失败:', err);
        });
      }
    }.bind(this));
  },

  // v448 修复：动态计算辈分级数（从最高祖先到最晚辈的总代数）
  calculateGenerations: function(persons, relationships) {
    if (persons.length === 0) return 0;
    
    // 构建父母 - 子女关系图
    var parentChildMap = {}; // personId -> [childrenIds]
    var childParentMap = {}; // personId -> [parentIds]
    
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      // 支持 5 种关系类型：son/daughter/parent-child/father/mother
      if (r.type === 'parent-child' || r.type === 'son' || r.type === 'daughter') {
        // son/daughter/parent-child: from=父母，to=子女
        var parentId = r.from;
        var childId = r.to;
        if (!parentChildMap[parentId]) parentChildMap[parentId] = [];
        parentChildMap[parentId].push(childId);
        if (!childParentMap[childId]) childParentMap[childId] = [];
        childParentMap[childId].push(parentId);
      } else if (r.type === 'father' || r.type === 'mother') {
        // father/mother: from=子女，to=父母
        var childId = r.from;
        var parentId = r.to;
        if (!parentChildMap[parentId]) parentChildMap[parentId] = [];
        parentChildMap[parentId].push(childId);
        if (!childParentMap[childId]) childParentMap[childId] = [];
        childParentMap[childId].push(parentId);
      }
    }
    
    // 找到所有没有父母的最高祖先
    var rootIds = [];
    for (var i = 0; i < persons.length; i++) {
      var id = persons[i].id;
      if (!childParentMap[id] || childParentMap[id].length === 0) {
        rootIds.push(id);
      }
    }
    
    // 如果没有根节点（所有人都有父母，可能是数据问题），返回 1
    if (rootIds.length === 0) return 1;
    
    // 从每个根节点开始 BFS 向下遍历，计算最大深度
    var maxDepth = 1;
    for (var i = 0; i < rootIds.length; i++) {
      var queue = [{id: rootIds[i], depth: 1}];
      var visited = {};
      visited[rootIds[i]] = true;
      
      while (queue.length > 0) {
        var current = queue.shift();
        if (current.depth > maxDepth) maxDepth = current.depth;
        
        var children = parentChildMap[current.id] || [];
        for (var j = 0; j < children.length; j++) {
          var childId = children[j];
          if (!visited[childId]) {
            visited[childId] = true;
            queue.push({id: childId, depth: current.depth + 1});
          }
        }
      }
    }
    
    return maxDepth;
  },

  // 基于 v287 修复三个核心问题
  setCurrentPerson: function (personId) {
    var persons = this.data.persons || [];
    var relationships = this.data.relationships || [];
    
    var person = persons.find(function(p) { return p.id === personId; });
    if (!person) {
      person = { name: '待添加', gender: 'male' };
    }

    var app = getApp();
    app.globalData.currentPersonId = personId;
    
    // v711-51-fix-v201 修复：直接从 storage 读取 currentTreeId，避免使用 this.data.currentTreeId（可能未初始化）
    var currentTreeId = wx.getStorageSync('currentTreeId') || 'tree_default';
    wx.setStorageSync('currentPersonId_' + currentTreeId, personId);
    console.log('[setCurrentPerson-index] 已保存 currentPersonId:', personId, 'currentTreeId:', currentTreeId);

    var spouses = [];
    var elders = [];
    var brothers = [];
    var sisters = [];
    var children = [];
    var hasFather = false;
    var hasMother = false;

    // ========== 第一步：推断配偶关系 ==========
    // 方式 1：通过共同子女推断
    // 如果当前人有子女，且子女有另一方父母，则另一方父母是配偶
    // 关系格式 A：{from: 父母，to: 子女，type: 'son/daughter'}
    // 关系格式 B：{from: 子女，to: 父母，type: 'father/mother'}
    var inferredSpouseIds = [];
    
    // 检查格式 A：当前人是父母，from=当前人，to=子女
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if ((r.type === 'son' || r.type === 'daughter') && r.from === personId) {
        var childId = r.to;
        // 查找这个子女的另一方父母
        for (var j = 0; j < relationships.length; j++) {
          var r2 = relationships[j];
          if ((r2.type === 'son' || r2.type === 'daughter') && 
              r2.to === childId && 
              r2.from !== personId) {
            var otherParentId = r2.from;
            if (otherParentId && inferredSpouseIds.indexOf(otherParentId) === -1) {
              inferredSpouseIds.push(otherParentId);
            }
          }
        }
      }
    }
    
    // 检查格式 B：当前人是父母，to=当前人，from=子女
    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      if ((r.type === 'father' || r.type === 'mother') && r.to === personId) {
        var childId = r.from;
        // 查找这个子女的另一方父母
        var otherType = r.type === 'father' ? 'mother' : 'father';
        for (var j = 0; j < relationships.length; j++) {
          var r2 = relationships[j];
          if (r2.type === otherType && r2.from === childId) {
            var spouseId = r2.to;
            if (spouseId && inferredSpouseIds.indexOf(spouseId) === -1) {
              inferredSpouseIds.push(spouseId);
            }
          }
        }
      }
    }

    for (var i = 0; i < relationships.length; i++) {
      var r = relationships[i];
      
      // ========== 1. 配偶关系 ==========
      if (r.type === 'spouse') {
        if (r.from === personId) {
          // from=当前人，to=配偶
          var spouseId = r.to;
          if (spouseId && !spouses.some(function(s){return s.id===spouseId;})) {
            var spouse = persons.find(function(p){return p.id===spouseId;});
            if (spouse) {
              spouses.push({ 
                id: spouse.id, 
                name: spouse.name, 
                avatar: spouse.gender === 'male' ? '👨' : '👩', 
                gender: spouse.gender, 
                status: spouse.status || 'alive', 
                relation: spouse.gender === 'male' ? '丈夫' : '妻子' 
              });
            }
          }
        } else if (r.to === personId) {
          // to=当前人，from=配偶
          var spouseId = r.from;
          if (spouseId && !spouses.some(function(s){return s.id===spouseId;})) {
            var spouse = persons.find(function(p){return p.id===spouseId;});
            if (spouse) {
              spouses.push({ 
                id: spouse.id, 
                name: spouse.name, 
                avatar: spouse.gender === 'male' ? '👨' : '👩', 
                gender: spouse.gender, 
                status: spouse.status || 'alive', 
                relation: spouse.gender === 'male' ? '丈夫' : '妻子' 
              });
            }
          }
        }
      }
      
      // ========== 2. 父亲关系（双向推断） ==========
      if (r.type === 'father') {
        if (r.from === personId) {
          // from=当前人（子女），to=父亲
          var fatherId = r.to;
          if (fatherId && !elders.some(function(e){return e.id===fatherId;})) {
            hasFather = true;
            var father = persons.find(function(p){return p.id===fatherId;});
            if (father) {
              elders.push({ 
                id: father.id, 
                name: father.name, 
                avatar: '👨', 
                gender: 'male',
                status: father.status || 'alive', 
                relation: '父亲' 
              });
            }
          }
        } else if (r.to === personId) {
          // to=当前人（父亲），from=子女
          // 推断：from 是当前人的儿子/女儿
          var childId = r.from;
          if (childId && !children.some(function(c){return c.id===childId;})) {
            var child = persons.find(function(p){return p.id===childId;});
            if (child) {
              children.push({ 
                id: child.id, 
                name: child.name, 
                avatar: child.gender === 'male' ? '👨' : '👩', 
                gender: child.gender, 
                status: child.status || 'alive', 
                relation: child.gender === 'male' ? '儿子' : '女儿' 
              });
            }
          }
        }
      }
      
      // ========== 3. 母亲关系（双向推断） ==========
      if (r.type === 'mother') {
        if (r.from === personId) {
          // from=当前人（子女），to=母亲
          var motherId = r.to;
          if (motherId && !elders.some(function(e){return e.id===motherId;})) {
            hasMother = true;
            var mother = persons.find(function(p){return p.id===motherId;});
            if (mother) {
              elders.push({ 
                id: mother.id, 
                name: mother.name, 
                avatar: '👩', 
                gender: 'female',
                status: mother.status || 'alive', 
                relation: '母亲' 
              });
            }
          }
        } else if (r.to === personId) {
          // to=当前人（母亲），from=子女
          // 推断：from 是当前人的儿子/女儿
          var childId = r.from;
          if (childId && !children.some(function(c){return c.id===childId;})) {
            var child = persons.find(function(p){return p.id===childId;});
            if (child) {
              children.push({ 
                id: child.id, 
                name: child.name, 
                avatar: child.gender === 'male' ? '👨' : '👩', 
                gender: child.gender, 
                status: child.status || 'alive', 
                relation: child.gender === 'male' ? '儿子' : '女儿' 
              });
            }
          }
        }
      }
      
      // ========== 4. 兄弟姐妹关系（双向推断） ==========
      if (r.type === 'brother' || r.type === 'sister') {
        var siblingId = null;
        if (r.from === personId) siblingId = r.to;
        else if (r.to === personId) siblingId = r.from;
        
        if (siblingId && siblingId !== personId) {
          var sibling = persons.find(function(p){return p.id===siblingId;});
          if (sibling) {
            var list = r.type === 'brother' ? brothers : sisters;
            if (!list.some(function(s){return s.id===siblingId;})) {
              // 根据 subtype 确定具体称谓（哥哥/弟弟/姐姐/妹妹）
              var relation = '兄弟';
              if (r.type === 'brother') {
                relation = (r.subtype === '哥哥') ? '哥哥' : '弟弟';
              } else {
                relation = (r.subtype === '姐姐') ? '姐姐' : '妹妹';
              }
              list.push({ 
                id: sibling.id, 
                name: sibling.name, 
                avatar: sibling.gender === 'male' ? '👨' : '👩', 
                gender: sibling.gender, 
                status: sibling.status || 'alive', 
                relation: relation 
              });
            }
          }
        }
      }
      
      // ========== 5. 子女关系（双向推断） ==========
      if (r.type === 'son' || r.type === 'daughter') {
        if (r.from === personId) {
          // from=当前人（父母），to=子女
          var childId = r.to;
          if (childId && !children.some(function(c){return c.id===childId;})) {
            var child = persons.find(function(p){return p.id===childId;});
            if (child) {
              children.push({ 
                id: child.id, 
                name: child.name, 
                avatar: child.gender === 'male' ? '👨' : '👩', 
                gender: child.gender, 
                status: child.status || 'alive', 
                relation: r.type === 'son' ? '儿子' : '女儿' 
              });
            }
          }
        } else if (r.to === personId) {
          // to=当前人（子女），from=父母
          // 推断：from 是当前人的父亲/母亲
          var parentId = r.from;
          var parent = persons.find(function(p){return p.id===parentId;});
          if (parent) {
            if (!elders.some(function(e){return e.id===parentId;})) {
              if (parent.gender === 'male') {
                hasFather = true;
                elders.push({ 
                  id: parent.id, 
                  name: parent.name, 
                  avatar: '👨', 
                  gender: 'male',
                  status: parent.status || 'alive', 
                  relation: '父亲' 
                });
              } else {
                hasMother = true;
                elders.push({ 
                  id: parent.id, 
                  name: parent.name, 
                  avatar: '👩', 
                  gender: 'female',
                  status: parent.status || 'alive', 
                  relation: '母亲' 
                });
              }
            }
          }
        }
      }
    }
    
    // ========== 第二步：添加推断的配偶（问题 2） ==========
    for (var i = 0; i < inferredSpouseIds.length; i++) {
      var spouseId = inferredSpouseIds[i];
      if (!spouses.some(function(s){return s.id===spouseId;})) {
        var spouse = persons.find(function(p){return p.id===spouseId;});
        if (spouse) {
          spouses.push({ 
            id: spouse.id, 
            name: spouse.name, 
            avatar: spouse.gender === 'male' ? '👨' : '👩', 
            gender: spouse.gender, 
            status: spouse.status || 'alive', 
            relation: spouse.gender === 'male' ? '丈夫' : '妻子' 
          });
        }
      }
    }

    this.setData({
      currentPersonId: personId,
      currentPerson: { 
        name: person.name || '待添加', 
        avatar: person.gender === 'male' ? '👨' : '👩', 
        gender: person.gender || 'male' 
      },
      spouses: spouses,
      elders: elders,
      brothers: brothers,
      sisters: sisters,
      children: children,
      hasFather: hasFather,
      hasMother: hasMother
    });
  },

  handleCurrentPersonTap: function () {
    wx.navigateTo({
      url: '/subpkg-tools/pages/member/edit?id=' + this.data.currentPersonId
    });
  },

  // 编辑当前人资料（AI 家谱主页面 - 当前人下面的编辑资料按钮）
  editCurrentMember: function () {
    // v418 修复：家庭成员为 0 时，点击"待添加"直接进入编辑界面
    if (!this.data.currentPersonId) {
      // 没有当前人，跳转到添加成员页面
      wx.navigateTo({
        url: '/subpkg-tools/pages/member/add?type=current'
      });
      return;
    }
    wx.navigateTo({
      url: '/subpkg-tools/pages/member/edit?id=' + this.data.currentPersonId
    });
  },

  editMember: function () {
    wx.navigateTo({
      url: '/subpkg-tools/pages/member/edit?id=' + this.data.currentPersonId
    });
  },

  showSwitchIdentity: function () {
    console.log('[showSwitchIdentity-index] this.data.persons:', this.data.persons);
    var allMembers = [];
    for (var i = 0; i < this.data.persons.length; i++) {
      allMembers.push({ 
        id: this.data.persons[i].id, 
        name: this.data.persons[i].name 
      });
    }
    console.log('[showSwitchIdentity-index] allMembers:', allMembers);
    this.setData({ 
      showMembersModal: true,
      allMembers: allMembers
    });
  },

  switchToMember: function (e) {
    var personId = e.currentTarget.dataset.id;
    console.log('[switchToMember-index] 点击切换成员：', personId);
    console.log('[switchToMember-index] dataset:', e.currentTarget.dataset);
    console.log('[switchToMember-index] allMembers:', this.data.allMembers);
    this.setCurrentPerson(personId);
    this.setData({ showMembersModal: false });
  },

  hideMembers: function () {
    this.setData({ showMembersModal: false });
  },

  addRelative: function (e) {
    var type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: '/subpkg-tools/pages/member/add?type=' + type + '&parentId=' + this.data.currentPersonId
    });
  },

  viewMember: function (e) {
    wx.navigateTo({ url: '/subpkg-tools/pages/member/member?id=' + e.currentTarget.dataset.id });
  },

  showFamilyTree: function () {
    wx.navigateTo({ url: '/subpkg-family/pages/family-tree/family-tree' });
  },

  showMembers: function () {
    var allMembers = [];
    for (var i = 0; i < this.data.persons.length; i++) {
      allMembers.push({ id: this.data.persons[i].id, name: this.data.persons[i].name });
    }
    this.setData({ showMembersModal: true, allMembers: allMembers });
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
    var that = this;
    var currentTreeId = wx.getStorageSync('currentTreeId') || '';
    var familyTrees = wx.getStorageSync('familyTrees') || [];
    var newName = this.data.familyName || '主家谱';

    for (var i = 0; i < familyTrees.length; i++) {
      if (familyTrees[i].id === currentTreeId) {
        familyTrees[i].name = newName;
        break;
      }
    }

    wx.setStorageSync('familyTrees', familyTrees);

    // 先关闭弹窗并提示，云端保存异步进行
    this.setData({ showEditFamilyName: false });
    wx.showToast({ title: '保存成功' });

    // 通知其他页面刷新（通过全局事件）
    try {
      var app = getApp();
      if (app && app.globalData) {
        app.globalData.treeNameChanged = newName;
      }
    } catch (e) { }

    // 异步保存到云端（不阻塞UI）
    var personsKey = 'persons_' + currentTreeId;
    var relationshipsKey = 'relationships_' + currentTreeId;
    var treeData = {
      persons: wx.getStorageSync(personsKey) || wx.getStorageSync('persons') || [],
      relationships: wx.getStorageSync(relationshipsKey) || wx.getStorageSync('relationships') || []
    };
    try {
      var cloudSync5 = require('../../utils/cloud-sync.js');
      cloudSync5.saveTreeToCloud(currentTreeId, {
        tree_name: newName,
        local_tree_id: currentTreeId,
        persons: treeData.persons,
        relationships: treeData.relationships
      }).then(function() {
        console.log('[saveFamilyName] 云端保存成功');
      }).catch(function(err) {
        console.error('[saveFamilyName] 云端保存失败:', err);
      });
    } catch (e) {
      console.error('[saveFamilyName] 异常:', e);
    }
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
    var memberName = e.currentTarget.dataset.name;
    var memberRelation = e.currentTarget.dataset.relation;
    var currentPersonId = this.data.currentPersonId;
    
    var that = this;
    wx.showActionSheet({
      itemList: ['编辑资料', '切换到此成员', '删除此关系'],
      success: function (res) {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: '/subpkg-tools/pages/member/edit?id=' + memberId });
        } else if (res.tapIndex === 1) {
          that.setCurrentPerson(memberId);
        } else if (res.tapIndex === 2) {
          // 删除此关系
          that.deleteRelation(currentPersonId, memberId, memberRelation);
        }
      }
    });
  },

  // 删除当前人与某成员之间的关系（不删除成员资料）
  deleteRelation: function (currentPersonId, memberId, relation) {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除与"' + memberId + '"的' + relation + '关系吗？（成员资料将保留）',
      success: function (res) {
        if (res.confirm) {
          var currentTreeId = wx.getStorageSync('currentTreeId') || '';
          var relationshipsKey = 'relationships_' + currentTreeId;
          var relationships = wx.getStorageSync(relationshipsKey) || [];
          
          // 备用：尝试不带后缀的 key
          if (relationships.length === 0) {
            relationships = wx.getStorageSync('relationships') || [];
          }
          
          // 找到并删除相关关系
          var newRelationships = [];
          var deletedCount = 0;
          for (var i = 0; i < relationships.length; i++) {
            var r = relationships[i];
            // 检查是否是当前人与该成员之间的关系
            var isRelation = (r.from === currentPersonId && r.to === memberId) ||
                            (r.from === memberId && r.to === currentPersonId);
            
            if (isRelation) {
              deletedCount++;
              // 跳过这条关系（不添加到新数组）
            } else {
              newRelationships.push(r);
            }
          }
          
          if (deletedCount > 0) {
            wx.setStorageSync(relationshipsKey, newRelationships);
            // 同时清理旧格式数据 (兼容)
            var oldRelationships = wx.getStorageSync('relationships') || [];
            var newOldRelationships = [];
            for (var i = 0; i < oldRelationships.length; i++) {
              var r = oldRelationships[i];
              var isRelation = (r.from === currentPersonId && r.to === memberId) ||
                              (r.from === memberId && r.to === currentPersonId);
              if (!isRelation) {
                newOldRelationships.push(r);
              }
            }
            wx.setStorageSync('relationships', newOldRelationships);
            
            // v30: 删除关系后自动保存到云端
            var cloudSync4 = require('../../utils/cloud-sync.js');
            var drPersons = wx.getStorageSync(relationshipsKey.replace('relationships', 'persons')) || wx.getStorageSync('persons') || [];
            cloudSync4.saveTreeToCloud(currentTreeId, {
              tree_name: '我的家谱',
              local_tree_id: currentTreeId,
              persons: drPersons,
              relationships: newRelationships
            }, function() { console.log('[deleteRelation] 云端保存成功'); });
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            // 重新加载数据
            that.loadData();
          } else {
            wx.showToast({
              title: '未找到关系',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  shareFamilyTree: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 分享给朋友
  onShareAppMessage: function () {
    var currentTreeId = wx.getStorageSync('currentTreeId') || '';
    var familyTrees = wx.getStorageSync('familyTrees') || [];
    var familyName = '靠谱 ai 电子家谱';
    for (var i = 0; i < familyTrees.length; i++) {
      if (familyTrees[i].id === currentTreeId) {
        familyName = familyTrees[i].name;
        break;
      }
    }
    
    // v9 修复：使用树专属云端文档 ID，每棵本地树对应独立云端文档
    // 解决多树场景下 sharedTreeId 指向错误云端文档的问题
    var shareId = '';
    var mapping = wx.getStorageSync('cloud_tree_mapping') || {};
    shareId = mapping[currentTreeId] || '';
    
    if (shareId) {
      console.log('[onShareAppMessage] 使用树 ' + currentTreeId + ' 的云端文档:', shareId);
      return {
        title: '我在【' + familyName + '】创建了电子家谱，一起来记录家族故事吧！',
        path: '/pages/index/index?sharedTreeId=' + shareId,
        imageUrl: ''
      };
    }
    
    // 云端文档尚未创建，触发异步创建（下次分享时可用）
    if (currentTreeId) {
      cloudSync.getTreeDocId(currentTreeId).then(function(docId) {
        console.log('[onShareAppMessage] 异步创建树 ' + currentTreeId + ' 的云端文档:', docId);
      }).catch(function(err) {
        console.error('[onShareAppMessage] getTreeDocId 失败:', err);
      });
      console.log('[onShareAppMessage] 树 ' + currentTreeId + ' 的云端文档尚未创建，触发创建');
    }
    
    return {
      title: '我在【' + familyName + '】创建了电子家谱，一起来记录家族故事吧！',
      path: '/pages/index/index',
      imageUrl: ''
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    var currentTreeId = wx.getStorageSync('currentTreeId') || '';
    var familyTrees = wx.getStorageSync('familyTrees') || [];
    var familyName = '靠谱 ai 电子家谱';
    for (var i = 0; i < familyTrees.length; i++) {
      if (familyTrees[i].id === currentTreeId) {
        familyName = familyTrees[i].name;
        break;
      }
    }
    
    return {
      title: '【' + familyName + '】电子家谱',
      query: '',
      imageUrl: '' // 使用默认截图
    };
  }
});

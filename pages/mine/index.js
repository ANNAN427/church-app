// pages/profile/profile.js
var cloudSync = require('../../utils/cloud-sync.js');

Page({
  data: {
    avatarUrl: '',
    nickname: '',
    hasLogin: false,
    totalMerit: 0,
    muyuMerit: 0,
    bowlMerit: 0,
    beadsMerit: 0,
    showMeritModal: false,
    meritLog: [],
    wishes: [],
    familyTrees: [],
    currentTreeId: ''
  },

  onLoad: function () {
    this.checkLoginStatus();
    this.loadAllData();
  },

  onShow: function () {
    this.checkLoginStatus();
    this.loadMeritAndWishes();
    this.loadFamilyTrees();
  },

  checkLoginStatus: function () {
    var openId = wx.getStorageSync('user_openid');
    var userInfo = wx.getStorageSync('userInfo');
    if (openId || (userInfo && userInfo.openid)) {
      this.setData({
        hasLogin: true,
        avatarUrl: userInfo ? (userInfo.avatarUrl || '') : wx.getStorageSync('user_avatar') || '',
        nickname: userInfo ? (userInfo.nickname || '') : wx.getStorageSync('user_nickname') || ''
      });
    } else {
      this.setData({ hasLogin: false });
    }
  },

  login: function () {
    var that = this;
    wx.showLoading({ title: '登录中...' });
    wx.login({
      success: function (res) {
        if (res.code) {
          wx.cloud.callFunction({
            name: 'getOpenId',
            data: { code: res.code },
            success: function (cloudRes) {
              wx.hideLoading();
              var result = cloudRes.result;
              var openId = result && result.openid ? result.openid : (cloudRes.openid || '');
              if (openId) {
                wx.setStorageSync('user_openid', openId);
                var userInfo = {
                  openid: openId,
                  nickname: wx.getStorageSync('user_nickname') || '用户',
                  avatarUrl: wx.getStorageSync('user_avatar') || ''
                };
                wx.setStorageSync('userInfo', userInfo);
                that.setData({
                  hasLogin: true,
                  avatarUrl: userInfo.avatarUrl,
                  nickname: userInfo.nickname
                });
                wx.showToast({ title: '登录成功', icon: 'success' });
                console.log('登录成功，openId:', openId);
              } else {
                wx.showToast({ title: '登录失败，请重试', icon: 'none' });
              }
            },
            fail: function (err) {
              wx.hideLoading();
              console.error('获取 openId 失败:', err);
              wx.showToast({ title: '登录失败，请重试', icon: 'none' });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: '登录失败，请重试', icon: 'none' });
        }
      },
      fail: function (err) {
        wx.hideLoading();
        console.error('登录失败:', err);
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    });
  },

  // 一次性加载所有数据
  loadAllData: function () {
    if (!this.data) return;
    
    try {
      var avatarUrl = wx.getStorageSync('user_avatar') || '';
      var nickname = wx.getStorageSync('user_nickname') || '';
      // 分项读取功德值
      var muyuMerit = wx.getStorageSync('muyu_meritCount') || 0;
      var bowlMerit = wx.getStorageSync('bowl_meritCount') || 0;
      var beadsMerit = wx.getStorageSync('beads_meritCount') || 0;
      var meditationMerit = wx.getStorageSync('meditation_meritCount') || 0;
      var totalMerit = muyuMerit + bowlMerit + beadsMerit + meditationMerit;
      var wishes = wx.getStorageSync('wishes') || [];
      var familyTrees = wx.getStorageSync('familyTrees') || [];
      var currentTreeId = wx.getStorageSync('currentTreeId') || '';
      
      // 如果没有家谱，创建默认家谱
      if (familyTrees.length === 0) {
        var defaultTree = {
          id: 'tree_' + Date.now(),
          name: '主家谱',
          memberCount: 0,
          createTime: new Date().toISOString()
        };
        familyTrees = [defaultTree];
        currentTreeId = defaultTree.id;
        wx.setStorageSync('familyTrees', familyTrees);
        wx.setStorageSync('currentTreeId', currentTreeId);
      }
      
      // 更新每个家谱的人数
      for (var i = 0; i < familyTrees.length; i++) {
        var tree = familyTrees[i];
        var persons = wx.getStorageSync('persons_' + tree.id) || [];
        tree.memberCount = persons.length;
      }
      
      // 只显示最近 10 条愿望
      wishes = wishes.slice(0, 10);
      
      // 一次性批量更新
      this.setData({
        avatarUrl: avatarUrl,
        nickname: nickname,
        totalMerit: totalMerit,
        muyuMerit: muyuMerit,
        bowlMerit: bowlMerit,
        beadsMerit: beadsMerit,
        wishes: wishes,
        familyTrees: familyTrees,
        currentTreeId: currentTreeId
      });
    } catch (e) {
      console.error('加载数据失败', e);
    }
  },

  // 刷家谱列表（用于从家谱页返回时同步名称）
  loadFamilyTrees: function () {
    try {
      var familyTrees = wx.getStorageSync('familyTrees') || [];
      var currentTreeId = wx.getStorageSync('currentTreeId') || '';
      for (var i = 0; i < familyTrees.length; i++) {
        var tree = familyTrees[i];
        var persons = wx.getStorageSync('persons_' + tree.id) || [];
        tree.memberCount = persons.length;
      }
      this.setData({ familyTrees: familyTrees, currentTreeId: currentTreeId });
    } catch (e) {
      console.error('loadFamilyTrees error:', e);
    }
  },

  // 只刷新功德和愿望
  loadMeritAndWishes: function () {
    if (!this.data) return;
    
    try {
      // v35: 直接读取 totalMerit 存储值（已包含美美历程消耗）
      var totalMerit = wx.getStorageSync('totalMerit') || 0;
      var muyuMerit = wx.getStorageSync('muyu_meritCount') || 0;
      var bowlMerit = wx.getStorageSync('bowl_meritCount') || 0;
      var beadsMerit = wx.getStorageSync('beads_meritCount') || 0;
      var meditationMerit = wx.getStorageSync('meditation_meritCount') || 0;
      var wishes = wx.getStorageSync('wishes') || [];
      wishes = wishes.slice(0, 10);
      
      // v33: 加载功德明细
      var meritLog = [];
      try {
        meritLog = JSON.parse(wx.getStorageSync('meritLog') || '[]');
      } catch(e) {}
      
      this.setData({
        totalMerit: totalMerit,
        muyuMerit: muyuMerit,
        bowlMerit: bowlMerit,
        beadsMerit: beadsMerit,
        meditationMerit: meditationMerit,
        wishes: wishes,
        meritLog: meritLog
      });
    } catch (e) {
      console.error('加载功德和愿望失败', e);
    }
  },

  // 选择头像（带内容安全检测）
  chooseAvatar: function () {
    var that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePath = res.tempFiles[0].tempFilePath;
        var fileSize = res.tempFiles[0].size;
        
        // 检查文件大小（不超过 5MB）
        if (fileSize > 5 * 1024 * 1024) {
          wx.showToast({ title: '图片大小不能超过 5MB', icon: 'none' });
          return;
        }
        
        // 调用内容安全检测
        that.checkImageSecurity(tempFilePath);
      },
      fail: function (err) {
        if (err.errMsg !== 'chooseMedia:fail cancel') {
          console.error('选择图片失败:', err);
          wx.showToast({ title: '选择图片失败', icon: 'none' });
        }
      }
    });
  },

  // 图片内容安全检测
  checkImageSecurity: function (filePath) {
    var that = this;
    wx.showLoading({ title: '检测中...' });
    
    // 先上传到云存储获取 fileID
    var cloudEnv = wx.getStorageSync('cloudEnv') || 'cloudbase-d8gjw8wd893c08627';
    wx.cloud.uploadFile({
      cloudPath: 'avatar/' + Date.now() + '_' + Math.floor(Math.random() * 10000) + '.jpg',
      filePath: filePath,
      success: function (uploadRes) {
        var fileID = uploadRes.fileID;
        
        // 调用云函数进行图片内容安全检测
        wx.cloud.callFunction({
          name: 'imgSecCheck',
          data: { fileID: fileID },
          success: function (checkRes) {
            var result = checkRes.result;
            wx.hideLoading();
            
            if (result && result.errCode === 0) {
              // 检测通过，保存头像
              that.setData({ avatarUrl: filePath });
              wx.setStorageSync('user_avatar', filePath);
              wx.showToast({ title: '头像设置成功', icon: 'success' });
            } else if (result && result.errCode === 87014) {
              // 内容违规
              wx.showToast({ title: '图片内容包含违规信息，请重新选择', icon: 'none', duration: 3000 });
              // 删除云端临时文件
              that.deleteCloudFile(fileID);
            } else {
              // 检测服务异常，降级处理：允许保存
              console.log('图片安全检测异常，降级允许保存:', result);
              that.setData({ avatarUrl: filePath });
              wx.setStorageSync('user_avatar', filePath);
              wx.showToast({ title: '头像设置成功', icon: 'success' });
            }
          },
          fail: function (err) {
            wx.hideLoading();
            console.error('图片安全检测失败:', err);
            // 云函数调用失败，降级处理
            that.setData({ avatarUrl: filePath });
            wx.setStorageSync('user_avatar', filePath);
            wx.showToast({ title: '头像设置成功', icon: 'success' });
          }
        });
      },
      fail: function (err) {
        wx.hideLoading();
        console.error('图片上传失败:', err);
        // 上传失败，降级处理：本地保存
        that.setData({ avatarUrl: filePath });
        wx.setStorageSync('user_avatar', filePath);
        wx.showToast({ title: '头像设置成功', icon: 'success' });
      }
    });
  },

  // 删除云端临时文件
  deleteCloudFile: function (fileID) {
    try {
      wx.cloud.deleteFile({
        fileList: [fileID],
        success: function (res) { console.log('临时文件已删除:', res); },
        fail: function (err) { console.error('删除临时文件失败:', err); }
      });
    } catch (e) { console.error('deleteCloudFile error:', e); }
  },

  // 选择昵称（带内容安全检测）
  chooseNickname: function () {
    var that = this;
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: function (res) {
        if (res.confirm && res.content) {
          var content = res.content.trim();
          if (!content) return;
          // 调用文字内容安全检测
          that.checkTextSecurity(content);
        }
      }
    });
  },

  // 文字内容安全检测
  checkTextSecurity: function (content) {
    var that = this;
    wx.cloud.callFunction({
      name: 'msgSecCheck',
      data: { content: content },
      success: function (res) {
        var result = res.result;
        if (result && result.errCode === 0) {
          // 检测通过
          that.setData({ nickname: content });
          wx.setStorageSync('user_nickname', content);
          wx.showToast({ title: '昵称设置成功', icon: 'success' });
        } else if (result && result.errCode === 87014) {
          // 内容违规
          wx.showToast({ title: '昵称包含违规内容，请修改后重试', icon: 'none', duration: 3000 });
        } else {
          // 检测异常，降级处理
          console.log('文字安全检测异常，降级允许设置:', result);
          that.setData({ nickname: content });
          wx.setStorageSync('user_nickname', content);
          wx.showToast({ title: '昵称设置成功', icon: 'success' });
        }
      },
      fail: function (err) {
        console.error('文字安全检测失败:', err);
        // 云函数调用失败，降级处理
        that.setData({ nickname: content });
        wx.setStorageSync('user_nickname', content);
        wx.showToast({ title: '昵称设置成功', icon: 'success' });
      }
    });
  },

  // 前往敲木鱼
  goToFish: function () {
    wx.navigateTo({
      url: '/subpkg-zen/pages/fish/fish'
    });
  },

  // 切换家谱
  switchFamilyTree: function (e) {
    var treeId = e.currentTarget.dataset.id;
    if (treeId === this.data.currentTreeId) return;
    
    var that = this;
    wx.showModal({
      title: '切换家谱',
      content: '确定要切换到这个家谱吗？',
      success: function (res) {
        if (res.confirm) {
          console.log('=== 开始切换家谱 ===');
          console.log('切换到:', treeId);
          
          // 1. 先检查新家谱是否有数据
          var personsKey = 'persons_' + treeId;
          var relationshipsKey = 'relationships_' + treeId;
          
          var persons = wx.getStorageSync(personsKey) || [];
          var relationships = wx.getStorageSync(relationshipsKey) || [];
          
          console.log('读取数据 key:', personsKey, relationshipsKey);
          console.log('读取到数据：persons:', persons.length, 'relationships:', relationships.length);
          
          // 2. 如果新家谱数据为空，保持空数据（不初始化示例数据）
          if (!persons || persons.length === 0) {
            console.log('新家谱数据为空，这是正常的');
          }
          
          // 3. 获取新家谱名称
          var familyTrees = wx.getStorageSync('familyTrees') || [];
          var familyName = '家谱';
          for (var i = 0; i < familyTrees.length; i++) {
            if (familyTrees[i].id === treeId) {
              familyName = familyTrees[i].name;
              break;
            }
          }
          
          console.log('新家谱名称:', familyName);
          
          // 4. 关键：保存 currentTreeId 到 storage 和全局变量
          wx.setStorageSync('currentTreeId', treeId);
          console.log('currentTreeId 已保存到 storage:', treeId);
          
          // 关键修复：切换家谱时清除 sharedTreeId
          // 避免切换回自己的树后，autoSaveToCloud 被旧的 sharedTreeId 拦截
          wx.removeStorageSync('sharedTreeId');
          console.log('[switchFamilyTree] 已清除 sharedTreeId');
          
          // v9 修复：切换到家谱时，为该家谱创建/获取专属云端文档
          cloudSync.getTreeDocId(treeId).then(function(docId) {
            console.log('[switchFamilyTree] 家谱 ' + treeId + ' 的云端文档已就绪:', docId);
          }).catch(function(err) {
            console.error('[switchFamilyTree] getTreeDocId 失败:', err);
          });
          
          // 验证保存
          var verifyTreeId = wx.getStorageSync('currentTreeId');
          console.log('验证 currentTreeId:', verifyTreeId);
          
          that.setData({ currentTreeId: treeId });
          wx.showToast({ title: '切换成功', icon: 'success' });
          
          // 5. 使用 globalData 传递 currentTreeId
          var app = getApp();
          app.globalData.currentTreeId = treeId;
          console.log('globalData.currentTreeId 已设置:', treeId);
          
          // 使用 wx.switchTab 跳转
          setTimeout(function () {
            console.log('执行 wx.switchTab');
            wx.switchTab({
              url: '/pages/index/buddhism',
              success: function() {
                console.log('switchTab 成功');
              },
              fail: function(err) {
                console.error('switchTab 失败:', err);
              }
            });
          }, 300);
        }
      }
    });
  },

  // 添加家谱
  addFamilyTree: function () {
    var that = this;
    wx.showModal({
      title: '创建新家谱',
      editable: true,
      placeholderText: '请输入家谱名称',
      success: function (res) {
        if (res.confirm && res.content) {
          var familyTrees = that.data.familyTrees;
          var newTree = {
            id: 'tree_' + Date.now(),
            name: res.content,
            memberCount: 0,
            createTime: new Date().toISOString()
          };
          familyTrees.push(newTree);
          
          // 保存家谱列表
          wx.setStorageSync('familyTrees', familyTrees);
          
          // 新家谱初始化为空数据
          wx.setStorageSync('persons_' + newTree.id, []);
          wx.setStorageSync('relationships_' + newTree.id, []);
          wx.setStorageSync('currentTreeId', newTree.id);
          
          // 关键修复：创建新家谱时清除 sharedTreeId，避免数据污染
          wx.removeStorageSync('sharedTreeId');
          console.log('[addFamilyTree] 已清除 sharedTreeId');
          
          // v9 修复：创建新家谱时，为该家谱创建专属云端文档
          cloudSync.getTreeDocId(newTree.id).then(function(docId) {
            console.log('[addFamilyTree] 新家谱 ' + newTree.id + ' 的云端文档已就绪:', docId);
          }).catch(function(err) {
            console.error('[addFamilyTree] getTreeDocId 失败:', err);
          });
          
          that.setData({
            familyTrees: familyTrees,
            currentTreeId: newTree.id
          });
          
          wx.showToast({ title: '创建成功', icon: 'success' });
          
          // 使用 globalData 传递 currentTreeId
          var app = getApp();
          app.globalData.currentTreeId = newTree.id;
          
          // 使用 switchTab 跳转
          setTimeout(function() {
            wx.switchTab({
              url: '/pages/index/buddhism'
            });
          }, 300);
        }
      }
    });
  },

  // 编辑家谱
  editFamilyTree: function (e) {
    var treeId = e.currentTarget.dataset.id;
    var familyTrees = this.data.familyTrees;
    var tree = familyTrees.find(function(t) { return t.id === treeId; });
    
    if (!tree) return;
    
    var that = this;
    wx.showModal({
      title: '编辑家谱',
      editable: true,
      placeholderText: tree.name,
      success: function (res) {
        if (res.confirm && res.content) {
          tree.name = res.content;
          wx.setStorageSync('familyTrees', familyTrees);
          that.setData({ familyTrees: familyTrees });
          wx.showToast({ title: '修改成功', icon: 'success' });
        }
      }
    });
  },

  // 删除家谱
  deleteFamilyTree: function (e) {
    var treeId = e.currentTarget.dataset.id;
    var familyTrees = this.data.familyTrees;
    var tree = familyTrees.find(function(t) { return t.id === treeId; });
    
    if (!tree) return;
    
    var that = this;
    wx.showModal({
      title: '删除家谱',
      content: '确定要删除「' + tree.name + '」吗？此操作不可恢复！',
      confirmColor: '#ff4757',
      success: function (res) {
        if (res.confirm) {
          console.log('=== 开始删除家谱 ===');
          console.log('删除家谱 ID:', treeId);
          
          // 1. 从家谱列表中移除
          var newFamilyTrees = [];
          for (var i = 0; i < familyTrees.length; i++) {
            if (familyTrees[i].id !== treeId) {
              newFamilyTrees.push(familyTrees[i]);
            }
          }
          wx.setStorageSync('familyTrees', newFamilyTrees);
          console.log('家谱列表已更新，剩余:', newFamilyTrees.length);
          
          // 2. 清理该家谱的本地缓存数据
          wx.removeStorageSync('persons_' + treeId);
          wx.removeStorageSync('relationships_' + treeId);
          console.log('已清理本地缓存: persons_' + treeId + ', relationships_' + treeId);
          
          // 清理该家谱的云端文档映射
          var treeMapping = wx.getStorageSync('cloud_tree_mapping') || {};
          delete treeMapping[treeId];
          wx.setStorageSync('cloud_tree_mapping', treeMapping);
          console.log('已清理云端文档映射: ' + treeId);
          
          // 3. 如果删除的是当前正在查看的家谱，切换到另一个家谱
          var currentTreeId = wx.getStorageSync('currentTreeId') || '';
          if (currentTreeId === treeId) {
            if (newFamilyTrees.length > 0) {
              // 切换到列表中的第一个家谱
              var newTreeId = newFamilyTrees[0].id;
              wx.setStorageSync('currentTreeId', newTreeId);
              console.log('删除当前家谱，自动切换到:', newTreeId);
            } else {
              // 如果没有其他家谱，清除 currentTreeId
              wx.removeStorageSync('currentTreeId');
              console.log('没有其他家谱，已清除 currentTreeId');
            }
            // 清除 sharedTreeId 避免数据污染
            wx.removeStorageSync('sharedTreeId');
          }
          
          // 4. 更新页面显示
          that.setData({
            familyTrees: newFamilyTrees,
            currentTreeId: wx.getStorageSync('currentTreeId') || ''
          });
          
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  // 前往功德木鱼
  goToMuyu: function () {
    wx.navigateTo({
      url: '/subpkg-zen/pages/muyu/muyu'
    });
  },

  // 前往解压颂钵
  goToBowl: function () {
    wx.navigateTo({
      url: '/subpkg-zen/pages/bowl/bowl'
    });
  },

  // 前往静心念珠
  goToBeads: function () {
    wx.navigateTo({
      url: '/subpkg-zen/pages/beads/beads'
    });
  },

  // v33: 显示功德明细弹窗
  showMeritDetail: function () {
    var meritLog = [];
    try {
      meritLog = JSON.parse(wx.getStorageSync('meritLog') || '[]');
    } catch(e) {}
    // v35: 动态计算运行余额
    var runningBalance = 0;
    var displayList = [];
    for (var i = 0; i < meritLog.length; i++) {
      var entry = meritLog[i];
      var changeVal = parseFloat(entry.change) || 0;
      runningBalance += changeVal;
      displayList.push({
        time: entry.time,
        action: entry.action,
        change: entry.change,
        balance: runningBalance,
        isPositive: entry.change.indexOf('+') >= 0
      });
    }
    // 倒序排列，最新的在最上面
    displayList.reverse();
    this.setData({
      showMeritModal: true,
      meritLog: displayList
    });
  },

  // v33: 隐藏功德明细弹窗
  hideMeritDetail: function () {
    this.setData({ showMeritModal: false });
  }
});

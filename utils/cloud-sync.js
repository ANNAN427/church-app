// utils/cloud-sync.js - 微信云开发数据库操作封装（v9 修复版）
// v9 核心修复：每棵本地树对应独立云端文档，解决多树分享时 sharedTreeId 指向错误的问题

var cloudEnvId = 'YOUR_CLOUD_ENV_ID';
var docId = null; // 向后兼容缓存

function getDb() {
  return wx.cloud.database({ env: cloudEnvId });
}

/**
 * v9 新增：获取/创建指定 treeId 对应的云端文档 ID
 * 每棵本地树独立映射一个云端文档，避免多树分享时互相覆盖
 */
function getTreeDocId(treeId) {
  return new Promise(function (resolve, reject) {
    if (!treeId) {
      reject(new Error('treeId is required'));
      return;
    }

    // 读取 tree -> cloud doc 映射
    var mapping = wx.getStorageSync('cloud_tree_mapping') || {};
    var cachedDocId = mapping[treeId];

    if (cachedDocId) {
      console.log('[getTreeDocId] 缓存命中 treeId=' + treeId + ' -> docId=' + cachedDocId);
      resolve(cachedDocId);
      return;
    }

    // 没有映射，创建新云端文档
    var db = getDb();
    db.collection('family_trees').add({
      data: {
        tree_name: '家谱',
        local_tree_id: treeId,
        tree_id: treeId,
        persons: [],
        relationships: [],
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      },
      success: function (addRes) {
        var newDocId = addRes._id;
        mapping[treeId] = newDocId;
        wx.setStorageSync('cloud_tree_mapping', mapping);
        console.log('[getTreeDocId] 为 treeId=' + treeId + ' 创建云端文档: ' + newDocId);
        resolve(newDocId);
      },
      fail: function (err) {
        console.error('[getTreeDocId] 创建云端文档失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 获取当前用户的文档 ID（向后兼容）
 */
function getMyDocId() {
  return new Promise(function (resolve, reject) {
    // 如果已有缓存，直接返回
    if (docId) {
      resolve(docId);
      return;
    }
    
    // 从本地缓存读取
    var cached = wx.getStorageSync('my_tree_doc_id');
    if (cached) {
      docId = cached;
      resolve(docId);
      return;
    }
    
    var db = getDb();
    
    // 查询自己的文档（云数据库自动按 _openid 过滤）
    db.collection('family_trees').where({}).limit(1).get({
      success: function (res) {
        if (res.data && res.data.length > 0) {
          // 已有文档
          docId = res.data[0]._id;
          wx.setStorageSync('my_tree_doc_id', docId);
          resolve(docId);
        } else {
          // 还没有文档，先创建一个空的
          var tempId = 'tree_' + Date.now();
          db.collection('family_trees').add({
            data: {
              tree_name: '我的家谱',
              persons: [],
              relationships: [],
              created_at: db.serverDate(),
              updated_at: db.serverDate()
            },
            success: function (addRes) {
              docId = addRes._id;
              wx.setStorageSync('my_tree_doc_id', docId);
              resolve(docId);
            },
            fail: function (err) {
              reject(err);
            }
          });
        }
      },
      fail: function (err) {
        reject(err);
      }
    });
  });
}

/**
 * 将指定 treeId 的家谱数据保存到云端
 * v9 修改：使用 getTreeDocId 获取树对应的云端文档
 */
function saveTreeToCloud(treeId, data) {
  return new Promise(function (resolve, reject) {
    console.log('=== 云端保存开始 (treeId: ' + treeId + ') ===');
    
    getTreeDocId(treeId).then(function (treeDocId) {
      console.log('树的云端文档 ID:', treeDocId);
      
      var db = getDb();
      
      console.log('保存人数:', data.persons.length, '关系数:', data.relationships.length);
      
      // 更新文档 - 保存完整数据（不做精简）
      db.collection('family_trees').doc(treeDocId).update({
        data: {
          tree_name: data.tree_name || '家谱',
          local_tree_id: data.local_tree_id || treeId,
          tree_id: data.tree_id || treeId,
          persons: data.persons || [],
          relationships: data.relationships || [],
          updated_at: db.serverDate()
        },
        success: function () {
          console.log('云端保存成功 (treeId: ' + treeId + ')');
          // v31-fix: 保存云端文档ID到本地，用于重装后快速恢复
          wx.setStorageSync('my_tree_doc_id', treeDocId);
          resolve({ success: true, treeId: treeDocId });
        },
        fail: function (err) {
          console.error('云端保存失败:', err);
          reject(err);
        }
      });
    }).catch(function (err) {
      console.error('获取树文档 ID 失败:', err);
      reject(err);
    });
  });
}

/**
 * 将家谱数据保存到云端（向后兼容，使用 getTreeDocId）
 */
function saveToCloud(data) {
  return new Promise(function (resolve, reject) {
    console.log('=== 云端保存开始 ===');
    
    var currentTreeId = wx.getStorageSync('currentTreeId') || '';
    if (!currentTreeId) {
      reject(new Error('currentTreeId not found'));
      return;
    }
    
    getTreeDocId(currentTreeId).then(function (treeDocId) {
      console.log('树的云端文档 ID:', treeDocId);
      
      var db = getDb();
      
      console.log('保存人数:', data.persons.length, '关系数:', data.relationships.length);
      
      // 更新文档 - 保存完整数据（不做精简）
      db.collection('family_trees').doc(treeDocId).update({
        data: {
          tree_name: data.tree_name || '家谱',
          local_tree_id: data.local_tree_id || currentTreeId,
          tree_id: data.tree_id || currentTreeId,
          persons: data.persons || [],
          relationships: data.relationships || [],
          updated_at: db.serverDate()
        },
        success: function () {
          console.log('云端保存成功');
          resolve({ success: true, treeId: treeDocId });
        },
        fail: function (err) {
          console.error('云端保存失败:', err);
          reject(err);
        }
      });
    }).catch(function (err) {
      console.error('获取文档 ID 失败:', err);
      reject(err);
    });
  });
}

/**
 * 从云端加载家谱数据（通过分享链接）
 */
function loadFromCloud(sharedTreeId) {
  return new Promise(function (resolve, reject) {
    console.log('=== 云端加载开始 ===');
    console.log('sharedTreeId:', sharedTreeId);
    
    var db = getDb();
    
    db.collection('family_trees').doc(sharedTreeId).get({
      success: function (res) {
        console.log('云端加载成功，人数:', res.data.persons ? res.data.persons.length : 0);
        resolve({
          success: true,
          data: res.data
        });
      },
      fail: function (err) {
        console.error('云端加载失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * v27 新增：从云端恢复当前用户的家谱数据（删除小程序后重新安装时使用）
 * 自动查找当前用户的云端文档，恢复到本地缓存
 */
function restoreFromCloud() {
  return new Promise(function (resolve, reject) {
    console.log('=== 云端恢复开始 ===');
    
    var db = getDb();
    
    // v31-fix: 先检查是否有 my_tree_doc_id（之前保存过的文档ID）
    var myTreeDocId = wx.getStorageSync('my_tree_doc_id');
    if (myTreeDocId) {
      console.log('[restoreFromCloud] 找到 my_tree_doc_id:', myTreeDocId);
      db.collection('family_trees').doc(myTreeDocId).get({
        success: function (res) {
          console.log('[restoreFromCloud] 通过 my_tree_doc_id 找到文档');
          var cloudData = res.data;
          if (cloudData.persons && cloudData.persons.length > 0) {
            _restoreDataToLocal(cloudData);
            resolve({ success: true, data: cloudData });
            return;
          }
        },
        fail: function (err) {
          console.log('[restoreFromCloud] my_tree_doc_id 文档不存在:', err);
          // 继续下面的查询
          _queryByLocalTreeId(db, resolve, reject);
        }
      });
    } else {
      console.log('[restoreFromCloud] 没有 my_tree_doc_id，按 local_tree_id 查询');
      _queryByLocalTreeId(db, resolve, reject);
    }
  });
}

function _queryByLocalTreeId(db, resolve, reject) {
    // 查找有 local_tree_id 的文档（用户自己创建的树）
    db.collection('family_trees').where({
      local_tree_id: db.RegExp({
        regexp: '^tree_',
        options: 'i'
      })
    }).orderBy('updated_at', 'desc').limit(1).get({
      success: function (res) {
        if (res.data && res.data.length > 0) {
          var cloudData = res.data[0];
          console.log('[restoreFromCloud] 找到云端文档:', cloudData._id);
          console.log('[restoreFromCloud] 人数:', cloudData.persons ? cloudData.persons.length : 0);
          console.log('[restoreFromCloud] 关系数:', cloudData.relationships ? cloudData.relationships.length : 0);
          
          // 检查云端是否有有效数据
          if (cloudData.persons && cloudData.persons.length > 0) {
            // 保存 my_tree_doc_id
            wx.setStorageSync('my_tree_doc_id', cloudData._id);
            
            // 如果有 local_tree_id，也保存映射
            if (cloudData.local_tree_id) {
              var mapping = wx.getStorageSync('cloud_tree_mapping') || {};
              mapping[cloudData.local_tree_id] = cloudData._id;
              wx.setStorageSync('cloud_tree_mapping', mapping);
              wx.setStorageSync('currentTreeId', cloudData.local_tree_id);
              console.log('[restoreFromCloud] 恢复 treeId:', cloudData.local_tree_id);
            }
            
            resolve({
              success: true,
              data: cloudData
            });
          } else {
            console.log('[restoreFromCloud] 云端数据为空，无需恢复');
            resolve({ success: false, reason: 'empty' });
          }
        } else {
          console.log('[restoreFromCloud] 未找到云端文档');
          resolve({ success: false, reason: 'no_doc' });
        }
      },
      fail: function (err) {
        console.error('[restoreFromCloud] 查询云端文档失败:', err);
        reject(err);
      }
    });
}

// v31-fix: 辅助函数 - 将云端数据恢复到本地存储
function _restoreDataToLocal(cloudData) {
  var localTrees = {};
  var treeId = cloudData.local_tree_id || 'tree_' + Date.now();
  localTrees[treeId] = {
    treeId: treeId,
    tree_name: cloudData.tree_name || '我的家谱',
    persons: cloudData.persons || [],
    relationships: cloudData.relationships || [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  wx.setStorageSync('family_trees', localTrees);
  wx.setStorageSync('familyTrees', [{
    id: treeId,
    name: cloudData.tree_name || '我的家谱',
    memberCount: cloudData.persons ? cloudData.persons.length : 0,
    createTime: new Date().toISOString()
  }]);
  wx.setStorageSync('currentTreeId', treeId);
  wx.setStorageSync('my_tree_doc_id', cloudData._id);

  // 同时保存 persons 和 relationships 到独立 key
  wx.setStorageSync('persons_' + treeId, cloudData.persons || []);
  wx.setStorageSync('relationships_' + treeId, cloudData.relationships || []);

  console.log('[restoreFromCloud] 数据已恢复到本地, treeId:', treeId);
  console.log('[restoreFromCloud] familyTrees:', wx.getStorageSync('familyTrees').length, '棵树');
}

module.exports = {
  saveToCloud: saveToCloud,
  saveTreeToCloud: saveTreeToCloud,
  loadFromCloud: loadFromCloud,
  getMyDocId: getMyDocId,
  getTreeDocId: getTreeDocId,
  restoreFromCloud: restoreFromCloud
};

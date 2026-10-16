// pages/temple-admin/temple-admin.js
var templeData = require('../../data/temples.js');

Page({
  data: {
    searchText: '',
    searchResults: [],
    editingTemple: null,
    formData: {},
    originalIndex: -1,
    uploadedImages: []
  },

  onLoad: function () {
    this._allTemples = templeData;
  },

  onSearchInput: function (e) {
    this.setData({ searchText: e.detail.value });
  },

  searchTemple: function () {
    var keyword = this.data.searchText.trim().toLowerCase();
    var allTemples = this._allTemples;

    if (!keyword) {
      this.setData({ searchResults: [] });
      return;
    }

    var results = [];
    for (var i = 0; i < allTemples.length; i++) {
      var t = allTemples[i];
      var nameMatch = t.name && t.name.toLowerCase().indexOf(keyword) !== -1;
      var addrMatch = t.address && t.address.toLowerCase().indexOf(keyword) !== -1;
      var provMatch = t.province && t.province.toLowerCase().indexOf(keyword) !== -1;

      if (nameMatch || addrMatch || provMatch) {
        results.push(t);
      }

      if (results.length >= 20) break; // Limit results
    }

    this.setData({ searchResults: results });
  },

  selectTemple: function (e) {
    var index = e.currentTarget.dataset.index;
    var temple = this.data.searchResults[index];

    // Find original index in allTemples
    var allTemples = this._allTemples;
    var origIdx = -1;
    for (var i = 0; i < allTemples.length; i++) {
      if (allTemples[i].name === temple.name && allTemples[i].province === temple.province) {
        origIdx = i;
        break;
      }
    }

    // Initialize images
    this._initImages(temple);

    this.setData({
      editingTemple: temple,
      originalIndex: origIdx,
      formData: {
        name: temple.name || '',
        province: temple.province || '',
        address: temple.address || '',
        phone: temple.phone || '',
        ticket: temple.ticket || '',
        openTime: temple.openTime || '',
        history: temple.history || '',
        architecture: temple.architecture || '',
        features: temple.features || ''
      }
    });
  },

  cancelEdit: function () {
    this.setData({
      editingTemple: null,
      formData: {},
      originalIndex: -1,
      uploadedImages: []
    });
  },

  // 图片上传相关
  _initImages: function (temple) {
    // 初始化图片列表 - 分为已上传（云存储）和外部URL
    var uploadedImages = [];
    var externalUrls = [];
    
    if (temple.images && temple.images.length > 0) {
      for (var i = 0; i < temple.images.length; i++) {
        var url = temple.images[i];
        if (url.indexOf('cloud://') === 0 || url.indexOf('https://7574-') === 0) {
          // 云存储图片
          uploadedImages.push({ url: url, type: 'cloud' });
        } else {
          // 外部URL
          externalUrls.push(url);
        }
      }
    }
    
    this.setData({
      uploadedImages: uploadedImages,
      'formData.imagesText': externalUrls.join('\n')
    });
  },

  uploadImage: function () {
    var that = this;
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album'],
      success: function (res) {
        that._uploadFiles(res.tempFiles);
      }
    });
  },

  uploadImageCamera: function () {
    var that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: function (res) {
        that._uploadFiles(res.tempFiles);
      }
    });
  },

  _uploadFiles: function (tempFiles) {
    var that = this;
    var total = tempFiles.length;
    var uploaded = 0;

    wx.showLoading({ title: '上传中 0/' + total });

    function uploadNext(index) {
      if (index >= tempFiles.length) {
        wx.hideLoading();
        wx.showToast({ title: '上传完成', icon: 'success' });
        return;
      }

      var file = tempFiles[index];
      var tempFilePath = file.tempFilePath || file.path;
      var fileName = 'temple-images/' + Date.now() + '_' + index + '.jpg';

      wx.cloud.uploadFile({
        cloudPath: fileName,
        filePath: tempFilePath,
        success: function (uploadRes) {
          uploaded++;
          var newImages = that.data.uploadedImages.concat([{
            url: uploadRes.fileID,
            type: 'cloud'
          }]);
          that.setData({ uploadedImages: newImages });
          wx.showLoading({ title: '上传中 ' + uploaded + '/' + total });
          uploadNext(index + 1);
        },
        fail: function (err) {
          console.error('图片上传失败:', err);
          uploaded++;
          wx.showLoading({ title: '上传中 ' + uploaded + '/' + total });
          uploadNext(index + 1);
        }
      });
    }

    uploadNext(0);
  },

  removeImage: function (e) {
    var index = e.currentTarget.dataset.index;
    var images = this.data.uploadedImages.slice();
    images.splice(index, 1);
    this.setData({ uploadedImages: images });
  },

  onFormInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    var formData = this.data.formData;
    formData[field] = value;
    this.setData({ formData: formData });
  },

  previewTemple: function () {
    var formData = this.data.formData;
    // 合并上传图片和外部URL图片
    var allImages = [];
    for (var i = 0; i < this.data.uploadedImages.length; i++) {
      allImages.push(this.data.uploadedImages[i].url);
    }
    var externalUrls = formData.imagesText ? formData.imagesText.split('\n').filter(function (u) { return u.trim(); }) : [];
    for (var j = 0; j < externalUrls.length; j++) {
      allImages.push(externalUrls[j]);
    }

    var previewTemple = {
      name: formData.name,
      province: formData.province,
      address: formData.address,
      phone: formData.phone,
      ticket: formData.ticket,
      openTime: formData.openTime,
      history: formData.history,
      architecture: formData.architecture,
      features: formData.features,
      images: allImages
    };

    wx.setStorageSync('currentTemple', previewTemple);
    wx.navigateTo({
      url: '/subpkg-temple/pages/temple-detail/temple-detail'
    });
  },

  saveTemple: function () {
    var formData = this.data.formData;
    // 合并上传图片和外部URL图片
    var allImages = [];
    for (var i = 0; i < this.data.uploadedImages.length; i++) {
      allImages.push(this.data.uploadedImages[i].url);
    }
    var externalUrls = formData.imagesText ? formData.imagesText.split('\n').filter(function (u) { return u.trim(); }) : [];
    for (var j = 0; j < externalUrls.length; j++) {
      allImages.push(externalUrls[j]);
    }

    var updatedTemple = {
      name: formData.name,
      province: formData.province,
      address: formData.address,
      phone: formData.phone,
      ticket: formData.ticket,
      openTime: formData.openTime,
      history: formData.history,
      architecture: formData.architecture,
      features: formData.features,
      images: allImages
    };

    // Update local data
    if (this.data.originalIndex >= 0) {
      this._allTemples[this.data.originalIndex] = updatedTemple;
    }

    // Save to cloud
    this._saveToCloud(updatedTemple);
  },

  _saveToCloud: function (temple) {
    var that = this;
    wx.showLoading({ title: '保存中...' });

    // Try to use cloud database
    try {
      var db = wx.cloud.database();
      db.collection('temple_updates').where({
        name: temple.name,
        province: temple.province
      }).get({
        success: function (res) {
          if (res.data.length > 0) {
            // Update existing
            db.collection('temple_updates').doc(res.data[0]._id).update({
              data: {
                templeData: temple,
                updatedAt: new Date()
              },
              success: function () {
                wx.hideLoading();
                wx.showToast({ title: '保存成功', icon: 'success' });
              },
              fail: function () {
                // Fallback to local storage
                that._saveToLocal(temple);
              }
            });
          } else {
            // Insert new
            db.collection('temple_updates').add({
              data: {
                name: temple.name,
                province: temple.province,
                templeData: temple,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              success: function () {
                wx.hideLoading();
                wx.showToast({ title: '保存成功', icon: 'success' });
              },
              fail: function () {
                // Fallback to local storage
                that._saveToLocal(temple);
              }
            });
          }
        },
        fail: function () {
          // Fallback to local storage
          that._saveToLocal(temple);
        }
      });
    } catch (e) {
      this._saveToLocal(temple);
    }
  },

  _saveToLocal: function (temple) {
    var updates = wx.getStorageSync('temple_updates') || [];
    var found = false;
    for (var i = 0; i < updates.length; i++) {
      if (updates[i].name === temple.name && updates[i].province === temple.province) {
        updates[i] = temple;
        found = true;
        break;
      }
    }
    if (!found) {
      updates.push(temple);
    }
    wx.setStorageSync('temple_updates', updates);
    wx.hideLoading();
    wx.showToast({ title: '已保存到本地', icon: 'success' });
  }
});

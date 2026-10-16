// subpkg-church/church-recommend/church-recommend.js
// 省份名称简化映射（仅用于前端显示）
var provinceMap = {
  '内蒙古自治区': '内蒙古',
  '宁夏回族自治区': '宁夏',
  '广西壮族自治区': '广西',
  '新疆维吾尔自治区': '新疆',
  '西藏自治区': '西藏',
  '澳门特别行政区': '澳门',
  '香港特别行政区': '香港',
  '北京市': '北京',
  '上海市': '上海',
  '天津市': '天津',
  '重庆市': '重庆'
};

// 简化省份名称
function simplifyProvince(name) {
  if (provinceMap[name]) {
    return provinceMap[name];
  }
  if (name && name.charAt(name.length - 1) === '省') {
    return name.slice(0, -1);
  }
  return name;
}

Page({
  data: {
    provinces: [],
    provinceDisplayNames: [],
    currentProvince: '',
    currentProvinceDisplay: '',
    searchText: '',
    filteredChurches: [],
    scrollLeft: 0,
    loading: false
  },

  onLoad: async function () {
    this.setData({ loading: true });
    
    try {
      // 从云数据库获取所有教堂数据
      const res = await wx.cloud.callFunction({
        name: 'getChurches',
        data: { action: 'list' }
      });
      
      console.log('云函数返回:', res);
      
      if (res.result && res.result.code === 200 && res.result.data) {
        const allChurches = res.result.data.churches || [];
        console.log('教堂总数:', allChurches.length);
        
        // 提取唯一省份
        var provinceMapObj = {};
        for (var i = 0; i < allChurches.length; i++) {
          var p = allChurches[i].province;
          if (p && !provinceMapObj[p]) {
            provinceMapObj[p] = true;
          }
        }
        var provinces = Object.keys(provinceMapObj).sort();
        
        // 构建显示名称数组
        var displayNames = [];
        for (var j = 0; j < provinces.length; j++) {
          displayNames.push(simplifyProvince(provinces[j]));
        }
      
        this.setData({
          provinces: provinces,
          provinceDisplayNames: displayNames,
          filteredChurches: allChurches.slice(0, 50),
          loading: false
        });

        this._allChurches = allChurches;
      }
    } catch (err) {
      console.error('加载失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 加载更多
  loadMore: function () {
    var current = this.data.filteredChurches.length;
    var all = this._allChurches;
    var more = all.slice(current, current + 50);
    if (more.length > 0) {
      var updated = this.data.filteredChurches.concat(more);
      this.setData({ filteredChurches: updated });
    }
  },

  // 点击省份标签
  onProvinceTap: function (e) {
    var displayProvince = e.currentTarget.dataset.province;
    var allChurches = this._allChurches;
    var provinces = this.data.provinces;
    var filtered;
    var originalProvince;

    if (displayProvince === '' || displayProvince === '全部') {
      filtered = allChurches.slice(0, 50);
      originalProvince = '';
    } else {
      // 映射显示名称回原始名称
      originalProvince = this.getOriginalProvince(displayProvince);
      var matched = [];
      for (var i = 0; i < allChurches.length; i++) {
        if (allChurches[i].province === originalProvince) {
          matched.push(allChurches[i]);
        }
      }
      filtered = matched.slice(0, 50);
    }

    this.setData({
      currentProvince: originalProvince,
      currentProvinceDisplay: displayProvince,
      filteredChurches: filtered
    });
  },

  // 获取原始省份名称
  getOriginalProvince: function (displayName) {
    if (displayName === '' || displayName === '全部') {
      return '';
    }
    // 反向查找
    for (var key in provinceMap) {
      if (provinceMap[key] === displayName) {
        return key;
      }
    }
    // 默认加"省"字
    return displayName + '省';
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({ searchText: e.detail.value });
  },

  // 搜索
  onSearch: function () {
    var text = this.data.searchText;
    if (!text) {
      this.onProvinceTap({ currentTarget: { dataset: { province: '' } } });
      return;
    }

    var all = this._allChurches;
    var filtered = [];
    var lowerText = text.toLowerCase();

    for (var i = 0; i < all.length; i++) {
      var church = all[i];
      if (church.name && church.name.toLowerCase().indexOf(lowerText) >= 0) {
        filtered.push(church);
      } else if (church.address && church.address.toLowerCase().indexOf(lowerText) >= 0) {
        filtered.push(church);
      } else if (church.province && church.province.toLowerCase().indexOf(lowerText) >= 0) {
        filtered.push(church);
      }
    }

    this.setData({
      currentProvince: '',
      currentProvinceDisplay: '',
      filteredChurches: filtered.slice(0, 50)
    });
  },

  // 跳转到详情
  goToDetail: function (e) {
    var index = e.currentTarget.dataset.index;
    var church = this.data.filteredChurches[index];
    wx.navigateTo({
      url: '/subpkg-church/church-recommend/church-detail?id=' + church._id
    });
  },

  onShareAppMessage: function () {
    return {
      title: '教会推荐 - 探索全国 ' + this._allChurches.length + ' 座基督教堂',
      path: '/subpkg-church/church-recommend/church-recommend'
    };
  }
});

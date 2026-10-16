// pages/temple-intro/temple-intro.js
var templeData = require('../../data/temples.js');

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

// 简化省份名称（去掉"省"、"市"、"自治区"等后缀）
function simplifyProvince(name) {
 if (provinceMap[name]) {
   return provinceMap[name];
 }
 // 默认去掉"省"字
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
   searchText: '',
   filteredTemples: [],
   scrollLeft: 0
 },

 onLoad: function () {
    // v046: Enable share menu
    try{wx.showShareMenu({menus:['shareAppMessage','shareTimeline']})}catch(e){}
   // Extract unique provinces
   var allTemples = templeData;
   var provinceMapObj = {};
   for (var i = 0; i < allTemples.length; i++) {
     var p = allTemples[i].province;
     if (p && !provinceMapObj[p]) {
       provinceMapObj[p] = true;
     }
   }
   var provinces = Object.keys(provinceMapObj).sort();
   
   // Build display names array (simplified)
   var displayNames = [];
   for (var j = 0; j < provinces.length; j++) {
     displayNames.push(simplifyProvince(provinces[j]));
   }
  
  this.setData({
    provinces: provinces,
     provinceDisplayNames: displayNames,
     filteredTemples: allTemples.slice(0, 50) // Show first 50 initially for performance
   });

   this._allTemples = allTemples;
 },

 // Load more temples when scrolling
 loadMore: function () {
   var current = this.data.filteredTemples.length;
   var all = this._allTemples;
   var more = all.slice(current, current + 50);
   if (more.length > 0) {
     var updated = this.data.filteredTemples.concat(more);
     this.setData({ filteredTemples: updated });
   }
 },

 onProvinceTap: function (e) {
   var displayProvince = e.currentTarget.dataset.province;
   var allTemples = this._allTemples;
   var provinces = this.data.provinces;
   var filtered;
   var originalProvince;

   if (displayProvince === '' || displayProvince === '全部') {
     filtered = allTemples.slice(0, 50);
     originalProvince = '';
   } else {
     // Map display name back to original name
     originalProvince = this.getOriginalProvince(displayProvince);
     var matched = [];
     for (var i = 0; i < allTemples.length; i++) {
       if (allTemples[i].province === originalProvince) {
         matched.push(allTemples[i]);
       }
     }
     filtered = matched.slice(0, 50);
   }

   this.setData({
     currentProvince: originalProvince,
     filteredTemples: filtered,
     searchText: ''
   });
 },

 // 将简化名称映射回原始名称
 getOriginalProvince: function (displayName) {
   var provinces = this.data.provinces;
   var displayNames = this.data.provinceDisplayNames;
   for (var i = 0; i < displayNames.length; i++) {
     if (displayNames[i] === displayName) {
       return provinces[i];
     }
   }
   return displayName;
 },

 onSearchInput: function (e) {
   this.setData({ searchText: e.detail.value });
 },

 onSearch: function () {
   var keyword = this.data.searchText.trim().toLowerCase();
   var allTemples = this._allTemples;

   if (!keyword) {
     this.setData({
       filteredTemples: allTemples.slice(0, 50),
       currentProvince: ''
     });
     return;
   }

   var filtered = [];
   for (var i = 0; i < allTemples.length; i++) {
     var t = allTemples[i];
     var nameMatch = t.name && t.name.toLowerCase().indexOf(keyword) !== -1;
     var addrMatch = t.address && t.address.toLowerCase().indexOf(keyword) !== -1;
     var provMatch = t.province && t.province.toLowerCase().indexOf(keyword) !== -1;
     var featMatch = t.features && t.features.toLowerCase().indexOf(keyword) !== -1;

     if (nameMatch || addrMatch || provMatch || featMatch) {
       filtered.push(t);
     }
   }

   this.setData({
     filteredTemples: filtered.slice(0, 50),
     currentProvince: ''
   });
 },

 goToDetail: function (e) {
   var index = e.currentTarget.dataset.index;
   var temple = this.data.filteredTemples[index];
   var templeJson = JSON.stringify(temple);
   // Use wx.setStorageSync to pass large data
   wx.setStorageSync('currentTemple', temple);
   wx.navigateTo({
     url: '/subpkg-tools/pages/temple-detail/temple-detail'
   });
 },



 onReachBottom: function () {
   // Load more when reaching bottom
   var current = this.data.filteredTemples.length;
   var all = this._allTemples;
   var province = this.data.currentProvince;
   var keyword = this.data.searchText.trim().toLowerCase();

   if (keyword) {
     // For search, re-filter from full list
     var filtered = [];
     for (var i = 0; i < all.length; i++) {
       var t = all[i];
       var nameMatch = t.name && t.name.toLowerCase().indexOf(keyword) !== -1;
       var addrMatch = t.address && t.address.toLowerCase().indexOf(keyword) !== -1;
       var provMatch = t.province && t.province.toLowerCase().indexOf(keyword) !== -1;
       var featMatch = t.features && t.features.toLowerCase().indexOf(keyword) !== -1;
       if (nameMatch || addrMatch || provMatch || featMatch) {
         filtered.push(t);
       }
     }
     var more = filtered.slice(current, current + 50);
     if (more.length > 0) {
       var updated = this.data.filteredTemples.concat(more);
       this.setData({ filteredTemples: updated });
     }
   } else if (province) {
     var matched = [];
     for (var j = 0; j < all.length; j++) {
       if (all[j].province === province) {
         matched.push(all[j]);
       }
     }
     var moreProv = matched.slice(current, current + 50);
     if (moreProv.length > 0) {
       var updated2 = this.data.filteredTemples.concat(moreProv);
       this.setData({ filteredTemples: updated2 });
     }
   } else {
     var moreAll = all.slice(current, current + 50);
     if (moreAll.length > 0) {
       var updated3 = this.data.filteredTemples.concat(moreAll);
       this.setData({ filteredTemples: updated3 });
     }
  }
},

onShareAppMessage: function () {
  return {
    title: '佛教寺庙景点介绍 - 探索全国古刹名寺',
    path: '/subpkg-tools/pages/temple-intro/temple-intro',
    imageUrl: ''
  };
},

onShareTimeline: function () {
  return {
    title: '佛教寺庙景点介绍 - 探索全国古刹名寺',
    query: ''
  };
}
});

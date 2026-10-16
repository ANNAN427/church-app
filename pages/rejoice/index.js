"use strict";
const e = require("../../common/vendor.js");

const n = {
  __name: "index",
  setup(n) {
    e.onLoad(() => {
      e.index.setNavigationBarTitle({ title: "主内关怀 · 聆听您的声音" });
    });

    // 处理客服消息
    const handleContact = (e) => {
      console.log("客服消息:", e.detail);
      // 可以在这里处理客服消息的回调
    };

    return (a, l) => e.e({
      k: e.p({"show-tab-bar": !0})
    });
  }
};

const o = e._export_sfc(n, [["__scopeId", "data-v-cs001"]]);
o.onShareAppMessage=function(){return{title:"主内关怀 · 聆听您的声音",path:"/pages/rejoice/index"}};
o.onShareTimeline=function(){return{title:"主内关怀 · 聆听您的声音",query:""}};
wx.createPage(o);

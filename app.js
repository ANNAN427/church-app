"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const e = require("./common/vendor.js"), o = require("./plugins/souys/index.js");

const n = {
  __name: "App",
  setup: o => (
    e.onLaunch(() => {
      console.log('[App] onLaunch 启动');
      
      // 初始化云开发
      try {
        wx.cloud.init({
          env: 'YOUR_CLOUD_ENV_ID',
          traceUser: true
        });
        console.log('[App] 云开发初始化成功');
      } catch (err) {
        console.error('[App] 云开发初始化失败:', err);
      }
      
      n.autoLogin();
    }),
    e.onShow(() => {
      console.log('[App] onShow');
    }),
    e.onHide(() => {}),
    () => {}
  )
};

n.autoLogin = function() {
  console.log('[autoLogin] 开始检查登录状态...');
  
  var userInfo = wx.getStorageSync("userInfo");
  var openid = wx.getStorageSync("user_openid");
  
  if (userInfo && userInfo.openid) {
    console.log('[autoLogin] 已登录，跳过:', userInfo.openid);
    return;
  }
  
  console.log('[autoLogin] 开始微信登录...');
  wx.login({
    success: function(res) {
      console.log('[autoLogin] wx.login success, code:', res.code);
      if (res.code) {
        var tempOpenid = "u_" + res.code;
        wx.setStorageSync("user_openid", tempOpenid);
        wx.setStorageSync("userInfo", {
          openid: tempOpenid,
          nickname: "用户",
          avatarUrl: ""
        });
        console.log('[autoLogin] 登录成功:', tempOpenid);
      }
    },
    fail: function(err) {
      console.error('[autoLogin] 登录失败:', err);
    }
  });
};

function createApp() {
  const app = e.createSSRApp(n);
  return app.use(e.createPinia()),
  app.config.globalProperties.$souys = o.souys,
  e.index.$souys = o.souys,
  { app: app, Pinia: e.Pinia }
}
createApp().app.mount("#app"), exports.createApp = createApp;

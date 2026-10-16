"use strict";
const e = require("../common/vendor.js");
const t = require("../common/enum/store-key.js");
const o = require("../utils/storage.js");
const r = require("../utils/auth.js");
const s = require("../api/auth/login-api.js");

const n = e.defineStore("user", () => {
  const n = e.ref(r.getToken());
  const i = e.ref((() => {
    try {
      return o.storage.get(t.STORE_KEY_ENUM.USER_INFO) || {};
    } catch (e) {
      return {};
    }
  })());
  
  const a = e.computed(() => !!n.value);
  const u = e.computed(() => 0 === Object.keys(i.value).length);
  
  const c = e => {
    console.log('[user.setToken] setting token:', e);
    n.value = e;
    r.setToken(e);
  };
  
  const g = async e => {
    console.log('[user.setUserInfo] setting userInfo:', e);
    i.value = { ...i.value, ...e };
    o.storage.set(t.STORE_KEY_ENUM.USER_INFO, i.value);
  };
  
  return {
    token: n,
    userInfo: i,
    isLogined: a,
    isUserInfoEmpty: u,
    setToken: c,
    setUserInfo: g,
    checkToken: async () => {
      const e = await s.loginApi.isLogin();
      if (!1 === e) {
        n.value = "";
        r.removeToken();
      }
      return e;
    },
    wechatLogin: async e => {
      try {
        const t = await s.loginApi.wechatLogin(e);
        c(t);
        return t;
      } catch (t) {
        throw t;
      }
    },
    getLoginUser: async () => {
      try {
        const e = await s.loginApi.getLoginUser();
        i.value = e;
        g(e);
        return e;
      } catch (e) {
        throw e;
      }
    }
  };
});

exports.useUserStore = n;

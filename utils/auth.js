"use strict";
const e = require("../common/vendor.js");
const TOKEN_KEY = "token";

exports.getToken = () => {
  const token = e.index.getStorageSync(TOKEN_KEY);
  console.log('[auth.getToken] token:', token);
  return token;
};

exports.removeToken = () => {
  console.log('[auth.removeToken] removing token');
  e.index.removeStorageSync(TOKEN_KEY);
};

exports.setToken = (t) => {
  console.log('[auth.setToken] setting token:', t);
  e.index.setStorageSync(TOKEN_KEY, t);
};

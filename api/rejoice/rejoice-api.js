"use strict";
const config = require("../../config/index.js");

// 随喜功德 API（完全绕过 request 封装，避免 token 问题）
const rejoiceApi = {
  // 创建随喜记录（不携带 token）
  rejoiceAddRecord: async (data) => {
    return new Promise((resolve, reject) => {
      wx.request({
        url: config.sysConfig.API_URL + config.sysConfig.API_PREFIX + "/rejoice/add",
        method: "POST",
        data: data,
        header: {
          "content-type": "application/json"
          // 完全不添加 token header
        },
        success: function(res) {
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject({ errMsg: "创建订单失败", statusCode: res.statusCode, data: res.data });
          }
        },
        fail: function(err) {
          reject({ errMsg: err.errMsg || "网络请求失败" });
        }
      });
    });
  }
};

exports.rejoiceApi = rejoiceApi;

"use strict";
const config = require("../../config/index.js");

// 小程序虚拟支付 API（完全绕过 request 封装，避免 token 问题）
const payApi = {
  // 创建订单并获取虚拟支付参数
  createOrder: async (data) => {
    console.log("[payApi.createOrder] 请求参数:", data);
    
    return new Promise((resolve, reject) => {
      // 直接使用 wx.request，不经过 request.js 封装
      wx.request({
        url: config.sysConfig.API_URL + config.sysConfig.API_PREFIX + "/pay/wechat/v3/jsapi",
        method: "POST",
        data: data,
        header: {
          "content-type": "application/json"
          // 完全不添加 token header
        },
        success: function(res) {
          console.log("[payApi.createOrder] 后端返回:", res.data);
          
          if (res.statusCode === 200 && res.data) {
            // 确保返回的数据格式正确
            const result = res.data;
            
            // 检查必要字段
            if (!result.productId) {
              result.productId = data.productId || "";
            }
            if (!result.outTradeNo) {
              result.outTradeNo = data.orderNo || "";
            }
            if (!result.totalFee) {
              result.totalFee = data.amount || 0;
            }
            if (!result.signature) {
              result.signature = result.paySign || result.sign || "";
            }
            if (!result.extInfo) {
              result.extInfo = result.package || result.prepayId || "";
            }
            
            console.log("[payApi.createOrder] 处理后的支付参数:", result);
            resolve(result);
          } else {
            console.error("[payApi.createOrder] 后端返回错误:", res);
            reject({ 
              errMsg: "支付接口调用失败：" + (res.data?.errMsg || res.data?.msg || "未知错误"), 
              statusCode: res.statusCode, 
              data: res.data 
            });
          }
        },
        fail: function(err) {
          console.error("[payApi.createOrder] 网络请求失败:", err);
          reject({ errMsg: err.errMsg || "网络请求失败" });
        }
      });
    });
  },
  
  // 调用小程序虚拟支付
  requestVirtualPayment: (orderInfo) => {
    console.log("[payApi.requestVirtualPayment] 支付参数:", orderInfo);
    
    return new Promise((resolve, reject) => {
      wx.requestOrderPayment({
        productId: orderInfo.productId || "",
        outTradeNo: orderInfo.outTradeNo || "",
        totalFee: orderInfo.totalFee || 0,
        signature: orderInfo.signature || "",
        extInfo: orderInfo.extInfo || "",
        success: function(res) {
          console.log("[payApi.requestVirtualPayment] 支付成功:", res);
          resolve(res);
        },
        fail: function(err) {
          console.error("[payApi.requestVirtualPayment] 支付失败:", err);
          reject(err);
        }
      });
    });
  }
};

exports.payApi = payApi;

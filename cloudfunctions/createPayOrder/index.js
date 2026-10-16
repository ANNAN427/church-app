// 云函数入口文件
const cloud = require('wx-server-sdk');

// 云函数入口函数
exports.main = async (event, context) => {
  // 初始化云开发环境
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  
  // 获取请求参数
  const { amount, orderId, orderNo, productId } = event;
  
  console.log('收到支付请求:', JSON.stringify(event));
  
  // 参数验证
  if (!amount || !orderNo || !productId) {
    console.error('参数不完整:', { amount, orderNo, productId });
    return {
      code: 400,
      msg: '参数不完整'
    };
  }
  
  try {
    // 调用微信支付统一下单 API（正式模式）
    const res = await cloud.cloudPay.unifiedOrder({
      body: '爱心奉献',
      outTradeNo: orderNo,
      spendId: productId,
      spendInfo: 'church_donation',
      totalFee: amount,
      tradeType: 'JSAPI'
    });
    
    console.log('微信支付下单成功:', JSON.stringify(res));
    
    // 返回前端需要的支付参数
    return {
      code: 200,
      data: {
        productId: productId,
        outTradeNo: orderNo,
        totalFee: amount,
        signature: res.paySign,
        extInfo: JSON.stringify({
          timeStamp: res.timeStamp,
          nonceStr: res.nonceStr,
          package: res.package,
          signType: res.signType
        })
      }
    };
    
  } catch (err) {
    console.error('支付下单失败:', err);
    return {
      code: 500,
      msg: err.message || '支付下单失败',
      error: err
    };
  }
};

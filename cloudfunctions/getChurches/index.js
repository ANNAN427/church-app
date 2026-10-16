// 云函数入口文件 - 从微信云数据库获取教堂数据
const cloud = require('wx-server-sdk');

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  
  // 获取请求参数
  const { action, id } = event;
  
  console.log('收到请求:', JSON.stringify(event));
  
  try {
    const db = cloud.database();
    
    if (action === 'detail' && id) {
      // 获取教堂详情
      const res = await db.collection('churches')
        .where({
          _id: id,
          status: 1
        })
        .get();
      
      if (res.data.length === 0) {
        return {
          code: 404,
          msg: '教堂不存在'
        };
      }
      
      return {
        code: 200,
        msg: 'success',
        data: {
          church: res.data[0]
        }
      };
      
    } else {
      // 默认获取教堂列表（获取全部数据）
      // 使用 limit(1000) 获取最多 1000 条记录
      const res = await db.collection('churches')
        .where({
          status: 1
        })
        .orderBy('sort_order', 'asc')
        .orderBy('_id', 'asc')
        .limit(1000)
        .get();
      
      return {
        code: 200,
        msg: 'success',
        data: {
          churches: res.data,
          total: res.data.length
        }
      };
    }
    
  } catch (err) {
    console.error('数据库操作失败:', err);
    return {
      code: 500,
      msg: '数据库操作失败：' + err.message,
      error: err
    };
  }
};

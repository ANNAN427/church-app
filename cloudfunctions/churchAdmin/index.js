// 教堂管理后台云函数
const cloud = require('wx-server-sdk');

// 管理员账号密码（请修改为您的账号密码）
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'YOUR_ADMIN_PASSWORD_HERE';

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  
  const { action, username, password, data, id } = event;
  
  console.log('收到管理请求:', JSON.stringify({ action, username, id }));
  
  try {
    const db = cloud.database();
    
    // 验证管理员账号
    if (action !== 'login') {
      if (!username || !password) {
        return {
          code: 401,
          msg: '请先登录'
        };
      }
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return {
          code: 401,
          msg: '账号或密码错误'
        };
      }
    }
    
    // 处理不同操作
    if (action === 'login') {
      // 登录验证
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return {
          code: 200,
          msg: '登录成功',
          data: {
            username: username,
            token: 'admin_token_' + Date.now()
          }
        };
      } else {
        return {
          code: 401,
          msg: '账号或密码错误'
        };
      }
      
    } else if (action === 'list') {
      // 获取教堂列表
      const res = await db.collection('churches')
        .orderBy('sort_order', 'asc')
        .get();
      
      return {
        code: 200,
        msg: 'success',
        data: {
          churches: res.data,
          total: res.data.length
        }
      };
      
    } else if (action === 'add') {
      // 添加教堂
      const newChurch = {
        ...data,
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      };
      
      const res = await db.collection('churches').add({
        data: newChurch
      });
      
      return {
        code: 200,
        msg: '添加成功',
        data: {
          id: res._id
        }
      };
      
    } else if (action === 'update') {
      // 更新教堂
      const updateData = {
        ...data,
        updated_at: db.serverDate()
      };
      
      await db.collection('churches')
        .doc(id)
        .update({
          data: updateData
        });
      
      return {
        code: 200,
        msg: '更新成功'
      };
      
    } else if (action === 'delete') {
      // 删除教堂
      await db.collection('churches')
        .doc(id)
        .remove();
      
      return {
        code: 200,
        msg: '删除成功'
      };
      
    } else {
      return {
        code: 400,
        msg: '未知操作'
      };
    }
    
  } catch (err) {
    console.error('管理操作失败:', err);
    return {
      code: 500,
      msg: '操作失败：' + err.message,
      error: err
    };
  }
};

# 拾光赞美诗

一款专注于基督教信仰生活的微信小程序，为信徒提供丰富的灵修工具和教会服务。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WeChat Mini Program](https://img.shields.io/badge/Platform-WeChat_Mini_Program-07C160)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/your-username/church-app/releases)

## 📱 项目简介

**拾光赞美诗** 是一款集成了多种宗教功能的微信小程序，旨在帮助信徒更好地进行日常灵修、参与教会活动和深化信仰生活。

> 🙏 愿荣耀归于上帝！

## ✨ 核心功能

### 🎵 圣乐赞美
- 赞美诗在线播放
- 支持歌词同步显示
- 分类浏览与搜索功能

### 🙏 祷告服务
- **祷告墙**：分享代祷事项，彼此守望
- **献上祷告**：个人祷告记录与提交
- **功德木鱼**：冥想辅助工具

### 🌳 家庭树
- 家族信仰传承记录
- 家谱管理与展示
- 亲人信息维护

### 🧘 灵修工具
- **冥想音乐**：静心灵修背景音乐
- **智慧菩提**：灵修问答与指导
- **每日福卡**：每日灵修卡片收集

### ⛪ 教会服务
- **教会推荐**：各地教会信息查询
- **教堂详情**：教会详细信息展示
- **风景场景**：教会环境预览

### 📿 其他功能
- **每日占卜**：灵修指引工具
- **会员系统**：用户信息管理
- **指纹识别**：安全验证功能
- **星光记忆**：信仰历程记录

## 🛠️ 技术架构

- **平台**: 微信小程序
- **开发语言**: JavaScript (ES6+)
- **UI 框架**: 原生小程序组件
- **包结构**: 多子包架构（分包加载优化）
- **AI 集成**: 阿里云 DashScope
- **云服务**: 微信云开发

### 项目结构

```
church-app/
├── app.js                 # 应用入口
├── app.json               # 应用配置
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置
├── .env.example           # 环境变量示例
├── .gitignore            # Git 忽略规则
├── pages/                 # 主页面目录
│   ├── index/            # 首页
│   ├── music-praise/     # 圣乐赞美
│   ├── pray/             # 祷告相关
│   ├── muyu/             # 功德木鱼
│   ├── meditation/       # 冥想音乐
│   ├── bodhi-chat/       # 智慧菩提
│   ├── family/           # 家庭树
│   ├── tree/             # 家族树
│   ├── blessing/         # 每日福卡
│   └── ...
├── subpkg-church/         # 教会服务子包
│   └── church-recommend/ # 教会推荐
├── subpkg-tools/          # 工具子包
│   ├── pages/
│   │   ├── daily-question/  # 每日问答
│   │   ├── member/          # 会员管理
│   │   ├── naming/          # 起名服务
│   │   ├── fingerprint/     # 指纹识别
│   │   └── star-memory/     # 星光记忆
│   └── data/
├── subpkg-family/         # 家族子包
├── subpkg-temple/         # 寺庙子包
├── subpkg-large/          # 大型功能子包
├── cloudfunctions/        # 云函数
│   ├── uploadChurchImage/ # 上传图片
│   ├── churchAdmin/       # 教会管理
│   └── ...
├── components/            # 组件库
├── utils/                 # 工具函数
├── api/                   # API 接口
├── stores/                # 状态管理
├── common/                # 公共模块
├── config/                # 配置文件
├── data/                  # 数据文件
├── static/                # 静态资源
└── node-modules/          # 第三方组件
    ├── z-paging/         # 分页组件
    └── @dcloudio/uni-ui/ # uni-ui 组件
```

## 🚀 快速开始

### 环境要求

- 微信开发者工具（最新版本）
- Node.js 14+
- 小程序 AppID

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/church-app.git
   cd church-app
   ```

2. **配置环境变量**
   ```bash
   # 复制环境变量示例文件
   cp .env.example .env
   
   # 编辑 .env 文件，填入实际配置
   ```

3. **导入项目**
   - 打开微信开发者工具
   - 选择"导入项目"
   - 选择项目目录
   - 填入你的小程序 AppID

4. **安装依赖**
   ```bash
   # 如有需要
   npm install
   ```

5. **配置云函数**
   ```bash
   # 进入云函数目录
   cd cloudfunctions/function-name
   
   # 安装依赖
   npm install
   ```

6. **编译运行**
   - 点击"编译"按钮
   - 在开发者工具中预览效果

## 📦 部署发布

### 开发版本
1. 在微信开发者工具中点击"预览"
2. 使用微信扫码在手机上测试

### 体验版本
1. 点击"上传"按钮上传代码
2. 在微信公众平台设置为体验版本
3. 邀请体验成员扫码体验

### 正式发布
1. 提交审核
2. 审核通过后发布上线

详细部署指南请参考 [DEPLOYMENT.md](DEPLOYMENT.md)

## 🔧 开发指南

### 添加新页面

1. 在 `pages` 目录创建新文件夹
2. 创建页面所需的 `.js`、`.wxml`、`.wxss`、`.json` 文件
3. 在 `app.json` 的 `pages` 数组中注册新页面

### 代码规范

- 使用 ES6+ 语法
- 使用 2 个空格缩进
- 函数添加 JSDoc 注释
- 使用中文注释

详细规范请参考 [CONTRIBUTING.md](CONTRIBUTING.md)

### 分包使用

本项目采用分包加载优化性能：
- `subpkg-church`: 教会相关功能
- `subpkg-tools`: 工具类功能
- `subpkg-family`: 家族相关功能
- `subpkg-temple`: 寺庙相关功能
- `subpkg-large`: 大型功能模块

参考微信官方文档了解[分包加载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html)最佳实践。

## 🔒 安全说明

### 敏感信息处理

本项目已清理所有敏感信息，包括：
- ✅ API 密钥
- ✅ 管理员密码
- ✅ 小程序 AppID
- ✅ 云环境 ID

**重要**: 在本地开发时，请：
1. 复制 `.env.example` 为 `.env`
2. 填入实际的配置信息
3. 确保 `.env` 不会被提交到 Git

详细安全审计报告请参考 [SECURITY_AUDIT.md](SECURITY_AUDIT.md)

### 密钥管理

```bash
# 不要提交敏感文件
git add .env  # ❌ 错误
git add .env.example  # ✅ 正确
```

## 📝 注意事项

- 本项目为宗教类小程序，请确保内容符合相关法律法规
- 使用微信支付等功能需完成相应资质认证
- 涉及用户数据请做好隐私保护措施
- 建议定期备份重要数据

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

详细贡献指南请参考 [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📄 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issues: https://github.com/your-username/church-app/issues
- 开发者邮箱1：ansdsg123@gmail.com
- 开发者邮箱 2：2112680948@qq.com

## 🙏 致谢

感谢所有为此项目做出贡献的开发者和用户！

感谢上帝赐予我们智慧和力量完成这个项目。

---

**拾光赞美诗** - 让信仰之光照亮每一天 🕊️

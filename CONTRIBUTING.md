# 贡献指南

感谢你考虑为 **拾光赞美诗** 项目做出贡献！

## 📋 目录

- [代码规范](#代码规范)
- [开发环境](#开发环境)
- [提交流程](#提交流程)
- [问题反馈](#问题反馈)

## 代码规范

### JavaScript 代码风格

- 使用 ES6+ 语法
- 使用 `const` 和 `let`，避免 `var`
- 使用双引号 `"` 或单引号 `'`（保持项目一致性）
- 行尾不加分号（可选，但要保持一致）
- 使用 2 个空格缩进

### 命名规范

- 文件名：小写 + 连字符（如 `user-profile.js`）
- 变量名：小驼峰（如 `userName`）
- 常量名：大写下划线（如 `API_URL`）
- 类名：大驼峰（如 `UserProfile`）

### 注释规范

- 函数必须添加 JSDoc 注释
- 复杂逻辑需要添加行内注释
- 使用中文注释

```javascript
/**
 * 用户登录函数
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 登录结果
 */
async function login(username, password) {
  // 验证用户输入
  if (!username || !password) {
    throw new Error('用户名和密码不能为空')
  }
  // ...
}
```

## 开发环境

### 环境要求

- 微信开发者工具（最新版本）
- Node.js 14+
- Git

### 安装步骤

1. Fork 并克隆仓库
```bash
git clone https://github.com/your-username/church-app.git
cd church-app
```

2. 安装依赖（如有）
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

4. 导入微信开发者工具
- 打开微信开发者工具
- 导入项目，选择项目目录
- 填入你的小程序 AppID

## 提交流程

### 1. 创建分支

```bash
# 基于 main 分支创建新功能分支
git checkout -b feature/your-feature-name

# 或修复 bug 的分支
git checkout -b fix/bug-description
```

### 2. 提交代码

```bash
# 添加更改
git add .

# 提交代码（使用清晰的提交信息）
git commit -m "feat: 添加 xxx 功能"

# 提交信息格式：
# feat: 新功能
# fix: 修复 bug
# docs: 文档更新
# style: 代码格式调整
# refactor: 代码重构
# test: 测试相关
# chore: 构建/工具相关
```

### 3. 推送并创建 PR

```bash
# 推送到远程
git push origin feature/your-feature-name

# 然后在 GitHub 上创建 Pull Request
```

### PR 要求

- 标题清晰描述更改内容
- 描述中说明更改原因和影响
- 关联相关 Issue（如有）
- 确保代码通过测试

## 问题反馈

### 提交 Issue

在创建 Issue 前，请先搜索是否已有类似问题。

#### Bug 报告

请提供以下信息：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（微信版本、设备型号等）
- 截图或录屏（如有）

#### 功能建议

请提供以下信息：
- 功能描述
- 使用场景
- 预期效果
- 类似功能参考（如有）

## 代码审查

所有 PR 都需要经过代码审查。审查要点：

- 代码风格是否符合规范
- 功能是否正常工作
- 是否有安全隐患
- 是否有性能问题
- 是否有适当的测试

## 发布流程

1. 更新版本号（遵循语义化版本）
2. 更新 CHANGELOG.md
3. 创建 Release
4. 提交审核（微信小程序）

## 联系方式

如有问题，请通过以下方式联系：

- 项目 Issues
- 开发者邮箱

## 行为准则

请遵守以下原则：

- 尊重他人，友好交流
- 对事不对人，建设性批评
- 包容不同观点和经验
- 承认并改正错误

---

感谢你的贡献！🙏

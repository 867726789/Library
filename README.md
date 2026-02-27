# 个人书籍仓库

一个基于 GitHub Pages 和 Supabase 的个人书籍仓库系统，支持书籍上传、下载、标签分类和检索功能。

## 功能特性

- 📚 书籍上传和下载
- 🏷️ 标签分类管理
- 🔍 书籍搜索功能
- 👤 邮箱登录认证
- 📱 响应式设计
- ☁️ 基于云存储的文件管理

## 技术栈

- **前端**: HTML, CSS, JavaScript
- **后端**: Supabase (PostgreSQL + Storage)
- **部署**: GitHub Pages

## 项目结构

```
Library/
├── index.html              # 主页面
├── css/
│   └── styles.css          # 样式文件
├── js/
│   ├── main.js             # 主JavaScript文件
│   ├── supabase-client.js  # Supabase客户端配置
│   └── book-manager.js     # 书籍管理功能
├── assets/
│   └── images/             # 图片资源
├── README.md               # 项目说明
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Actions部署配置
```

## 快速开始

### 1. 配置 Supabase

1. 访问 [Supabase](https://supabase.io) 并创建新项目
2. 在 "Authentication" 设置中启用邮件登录
3. 在 "Database" -> "Policies" 中设置行级安全(RLS)策略
4. 创建以下数据库表：

```sql
-- 创建 books 表
CREATE TABLE books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  upload_date TIMESTAMP DEFAULT NOW(),
  download_count INTEGER DEFAULT 0
);
```

3. 在 Supabase 项目设置中获取 API URL 和匿名密钥

### 2. 配置项目

1. 编辑 `js/supabase-client.js` 文件
2. 替换 `YOUR_SUPABASE_PROJECT_URL` 和 `YOUR_SUPABASE_ANON_KEY` 为你的实际值

### 3. 设置存储桶

1. 在 Supabase 仪表板中创建名为 `books` 的存储桶
2. 配置存储桶策略以允许上传和下载

### 4. 部署到 GitHub Pages

1. 将项目推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 `gh-pages` 分支作为源

## 使用说明

### 用户认证

1. 点击右上角的"登录"按钮
2. 使用已授权的邮箱注册或登录
3. 邮箱验证完成后方可使用全部功能

### 上传书籍

1. 确保已登录且邮箱已验证
2. 点击"上传书籍"部分
3. 填写书籍信息（标题、作者、描述）
4. 添加标签（用逗号分隔）
5. 选择要上传的文件（支持 PDF, EPUB, MOBI, TXT, DOC, DOCX 格式）
6. 点击"上传书籍"按钮

### 搜索和过滤

- 确保已登录后，使用顶部搜索框按标题、作者或描述搜索书籍
- 使用标签下拉菜单按类别过滤书籍

### 下载书籍

- 确保已登录后，点击书籍卡片上的"下载书籍"按钮即可下载

## 安全考虑

- 限制上传文件类型和大小
- 使用 Supabase RLS (Row Level Security) 控制访问权限
- 对用户输入进行验证和转义

## 扩展功能

项目预留了以下扩展功能接口：

- 用户认证系统
- 书籍评分功能
- 推荐系统
- 阅读进度跟踪

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

MIT
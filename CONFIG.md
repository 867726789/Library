# 项目配置指南

本文档将指导您如何正确配置和运行个人书籍仓库项目。

## 项目功能说明

本项目支持两种访问模式：

1. **游客模式**：无需登录即可浏览、搜索和下载书籍
2. **登录用户模式**：登录后可以上传书籍、管理书库等高级功能

## Supabase 配置

### 1. 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.io)
2. 点击 "Start your project"
3. 创建新账户或登录现有账户
4. 输入项目名称并创建项目

### 2. 配置数据库

在 Supabase 仪表板中执行以下 SQL 命令创建书籍表：

```sql
-- 创建 books 表
CREATE TABLE books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  tags TEXT[],  -- 数组类型用于存储多个标签
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  upload_date TIMESTAMP DEFAULT NOW(),
  download_count INTEGER DEFAULT 0
);
```

### 3. 配置存储

1. 在左侧导航栏点击 "Storage"
2. 点击 "New bucket"
3. 创建名为 `books` 的存储桶
4. 点击 `books` 存储桶进入设置
5. 点击 "Bucket policies" 选项卡
6. 添加以下策略允许上传和下载：

```sql
-- 允许认证用户上传文件
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'books');

-- 允许所有人下载文件
CREATE POLICY "Allow all users to download"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'books');

-- 允许认证用户删除文件
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'books');
```

### 5. 配置认证策略

在左侧导航栏点击 "Authentication" -> "Policies"，添加以下 RLS (Row Level Security) 策略到 `books` 表：

```sql
-- 启用 RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- 为所有用户提供读取权限（支持游客模式）
CREATE POLICY "Allow all users to read books" ON books 
FOR SELECT TO public 
USING (true);

-- 为认证用户提供插入权限
CREATE POLICY "Allow authenticated users to insert books" ON books 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- 为认证用户提供更新权限
CREATE POLICY "Allow authenticated users to update books" ON books 
FOR UPDATE TO authenticated 
USING (true);

-- 为认证用户提供删除权限
CREATE POLICY "Allow authenticated users to delete books" ON books 
FOR DELETE TO authenticated 
USING (true);
```

### 6. 获取 API 凭据

1. 在项目仪表板顶部点击 "Project Settings"
2. 点击 "API" 选项卡
3. 复制 "Project URL"
4. 将 Project URL 填入 `js/supabase-client.js` 文件中的 `SUPABASE_URL`
5. 保持 `SUPABASE_ANON_KEY` 为空字符串，因为我们只使用认证用户访问

## 本地开发配置

### 修改 Supabase 客户端配置

编辑 `js/supabase-client.js` 文件：

```javascript
// 从环境变量获取 Supabase 配置
const SUPABASE_URL = 'your_supabase_project_url_here'; // 替换为你的 Supabase 项目 URL
const SUPABASE_ANON_KEY = 'your_supabase_anon_key_here'; // 替换为你的 Supabase anon key
```

将 `your_supabase_project_url_here` 替换为您的 Supabase 项目 URL，
将 `your_supabase_anon_key_here` 替换为您的 anon key。

**注意**：确保 anon key 已正确配置，这样游客模式才能正常工作。

## GitHub Pages 部署

### 1. 初始化 GitHub 仓库

1. 在 GitHub 上创建新仓库
2. 将本地项目推送至该仓库

### 2. 启用 GitHub Pages

1. 进入仓库的 "Settings" 选项卡
2. 向下滚动到 "Pages" 部分
3. 在 "Source" 下拉菜单中选择 "Deploy from a branch"
4. 选择 `gh-pages` 分支和 `/ (root)` 文件夹
5. 点击 "Save"

### 3. 配置 GitHub Actions

项目已经包含 `.github/workflows/deploy.yml` 文件，它会在每次推送到 main 分支时自动部署到 GitHub Pages。

## 安全建议

1. **限制文件上传类型**：当前实现只允许特定类型的文件上传
2. **文件大小限制**：当前实现限制单个文件不超过 100MB
3. **访问控制**：使用 Supabase RLS 控制数据访问权限
4. **敏感信息保护**：避免在客户端代码中暴露敏感数据

## 故障排除

### 常见问题

1. **无法上传文件**：
   - 检查存储桶策略是否正确配置
   - 确认文件类型和大小符合要求

2. **无法加载书籍列表**：
   - 检查 Supabase 项目 URL 和密钥是否正确
   - 确认数据库表是否存在且名称正确

3. **下载链接无效**：
   - 检查存储桶的公共访问权限设置

### 调试技巧

1. 打开浏览器开发者工具查看控制台错误
2. 检查网络请求状态码
3. 验证 Supabase 仪表板中的数据和配置

## 扩展功能

### 用户认证

项目已经集成了邮箱登录认证功能：

1. 在 Supabase 仪表板中启用 "Authentication"
2. 在 "Configuration" -> "Email" 选项卡中启用邮件确认
3. 配置邮件模板（可选）
4. 确保数据库策略允许认证用户上传文件

### 高级搜索

可以使用 Supabase 的全文搜索功能增强搜索能力。
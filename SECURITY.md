# 安全配置说明

本文档详细介绍了如何在GitHub Pages + Supabase架构中实现安全的数据访问控制。

## 安全架构概述

我们的应用采用了完全基于用户认证的安全模型：

- 所有操作都需要用户登录
- 不提供匿名访问权限
- 使用Supabase的RLS（Row Level Security）策略
- 通过Supabase Auth进行身份验证

## 安全配置要点

### 1. Supabase RLS 策略

在Supabase控制台的SQL编辑器中执行以下命令：

```sql
-- 启用 books 表的RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- 仅允许认证用户读取数据
CREATE POLICY "Authenticated users can read books" ON books
FOR SELECT TO authenticated
USING (true);

-- 仅允许认证用户插入数据
CREATE POLICY "Authenticated users can insert books" ON books
FOR INSERT TO authenticated
WITH CHECK (true);

-- 仅允许认证用户更新数据
CREATE POLICY "Authenticated users can update books" ON books
FOR UPDATE TO authenticated
USING (true);

-- 仅允许认证用户删除数据
CREATE POLICY "Authenticated users can delete books" ON books
FOR DELETE TO authenticated
USING (true);
```

### 2. Storage 策略

在Storage设置中，确保只允许认证用户访问：

```sql
-- 仅允许认证用户上传文件
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'books');

-- 仅允许认证用户下载文件
CREATE POLICY "Allow authenticated users to download"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'books');

-- 仅允许认证用户删除文件
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'books');
```

### 3. 客户端配置

在 `js/supabase-client.js` 中：

- `SUPABASE_ANON_KEY` 设置为空字符串
- 所有数据库操作都通过认证用户身份执行
- 实现了完善的错误处理机制

### 4. 认证流程

1. 用户通过邮箱密码注册/登录
2. Supabase验证用户身份
3. 所有后续操作都使用认证后的用户token
4. 未认证用户无法执行任何操作

## 安全优势

1. **零匿名访问**：所有功能都需要认证
2. **最小权限原则**：用户只拥有必要权限
3. **透明的错误处理**：向用户清晰提示认证要求
4. **集中式管理**：通过Supabase控制台统一管理安全策略

## 部署注意事项

1. 在部署到GitHub Pages前，确保所有配置都已正确设置
2. 测试无认证用户访问的场景
3. 验证RLS策略的有效性
4. 确保邮箱验证流程正常工作

## 监控与维护

1. 定期检查Supabase日志
2. 监控未授权访问尝试
3. 定期更新安全策略
4. 验证用户权限分配

通过这种安全模型，我们能够在使用GitHub Pages静态托管的同时，确保数据访问的完全受控和安全。
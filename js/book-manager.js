// 书籍管理功能模块
class BookManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentBooks = [];
        this.allTags = [];
        this.booksTable = window.BOOKS_TABLE || 'books';
        this.bucketName = window.STORAGE_BUCKET_NAME || 'books';
    }

    // 生成安全的文件名
    getSafeFileName(originalName) {
        if (!originalName) return Date.now() + '.tmp';
        
        // 提取扩展名并转小写
        const ext = originalName.includes('.') 
            ? originalName.slice(originalName.lastIndexOf('.')).toLowerCase() 
            : '';
        
        // 防止扩展名中包含非法字符（极端情况）
        const safeExt = ext.replace(/[^a-z0-9.]/g, '');

        // 生成: 时间戳_随机数.扩展名
        const timeStamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        
        return `${timeStamp}_${randomStr}${safeExt}`;
    }

    // 上传书籍到 Supabase
    async uploadBook(bookData, file) {
        try {
            // 检查用户是否已认证
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            
            if (authError || !user) {
                throw new Error('请先登录后再上传书籍');
            }
            
            // 首先上传文件到 Supabase Storage
            // 安全处理文件名，移除不支持的字符
            console.log('原始文件名:', file.name);
            const fileName = this.getSafeFileName(file.name);
            console.log('处理后的文件名:', fileName);
            const { data: uploadData, error: uploadError } = await this.supabase
                .storage
                .from(this.bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error(`文件上传失败: ${uploadError.message}`);
            }

            // 存储文件路径而不是公开 URL
            const filePath = fileName;

            // 将标签字符串转换为数组（支持中英文逗号分隔）
            const tags = bookData.tags ? bookData.tags.replace(/，/g, ',').split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            // 在数据库中插入书籍记录
            const { data: bookRecord, error: dbError } = await this.supabase
                .from(this.booksTable)
                .insert([{
                    title: bookData.title,
                    author: bookData.author,
                    description: bookData.description,
                    tags: tags,
                    file_path: filePath, // 存储文件路径
                    file_name: file.name,
                    file_size: file.size
                }])
                .select()
                .single();

            if (dbError) {
                // 如果数据库插入失败，尝试删除已上传的文件
                await this.supabase.storage.from(this.bucketName).remove([fileName]);
                throw new Error(`数据库操作失败: ${dbError.message}`);
            }

            return { success: true, data: bookRecord };
        } catch (error) {
            console.error('上传书籍时发生错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取所有书籍
    async getAllBooks() {
        try {
            // 游客也可以查看书籍列表
            const { data: books, error } = await this.supabase
                .from(this.booksTable)
                .select('*')
                .order('upload_date', { ascending: false });

            if (error) {
                throw new Error(`获取书籍列表失败: ${error.message}`);
            }

            this.currentBooks = books || [];
            return { success: true, data: this.currentBooks };
        } catch (error) {
            console.error('获取书籍列表时发生错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 按标签获取书籍
    async getBooksByTag(tag) {
        try {
            // 游客也可以按标签查看书籍
            
            const { data: books, error } = await this.supabase
                .from(this.booksTable)
                .select('*')
                .contains('tags', [tag])
                .order('upload_date', { ascending: false });

            if (error) {
                throw new Error(`按标签获取书籍失败: ${error.message}`);
            }

            return { success: true, data: books };
        } catch (error) {
            console.error('按标签获取书籍时发生错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 搜索书籍
    async searchBooks(query) {
        try {
            // 游客也可以搜索书籍
            
            const { data: books, error } = await this.supabase
                .from(this.booksTable)
                .select('*')
                .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`)
                .order('upload_date', { ascending: false });

            if (error) {
                throw new Error(`搜索书籍失败: ${error.message}`);
            }

            return { success: true, data: books };
        } catch (error) {
            console.error('搜索书籍时发生错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取所有标签
    async getAllTags() {
        try {
            // 从现有的书籍数据中提取所有唯一标签
            const allTagsSet = new Set();
            
            for (const book of this.currentBooks) {
                if (book.tags && Array.isArray(book.tags)) {
                    book.tags.forEach(tag => allTagsSet.add(tag));
                }
            }
            
            this.allTags = Array.from(allTagsSet);
            return { success: true, data: this.allTags };
        } catch (error) {
            console.error('获取标签列表时发生错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 生成签名 URL 用于下载
    async getSignedUrl(filePath) {
        try {
            const { data, error } = await this.supabase
                .storage
                .from(this.bucketName)
                .createSignedUrl(filePath, 3600); // 1小时有效期

            if (error) {
                throw new Error(`生成签名 URL 失败: ${error.message}`);
            }

            return { success: true, url: data.signedUrl };
        } catch (error) {
            console.error('生成签名 URL 时发生错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 下载书籍
    async downloadBook(bookId, filePath, fileName) {
        try {
            // 生成签名 URL
            const signedUrlResult = await this.getSignedUrl(filePath);
            console.log('生成的签名 URL:', signedUrlResult);
            if (!signedUrlResult.success) {
                throw new Error(signedUrlResult.error);
            }
            
            // 增加下载计数
            await this.incrementDownloadCount(bookId);
            
            return { success: true, url: signedUrlResult.url, fileName };
        } catch (error) {
            console.error('下载书籍时发生错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新下载次数
    async incrementDownloadCount(bookId) {
        try {
            // 先获取当前下载次数
            const { data, error } = await this.supabase
                .from(this.booksTable)
                .select('download_count')
                .eq('id', bookId)
                .single();
            
            if (error) {
                console.error('获取下载次数失败:', error.message);
                return; // 不抛出错误，因为下载统计不是关键功能
            }
            
            const newCount = (data?.download_count || 0) + 1;
            
            // 更新下载次数
            const { error: updateError } = await this.supabase
                .from(this.booksTable)
                .update({ download_count: newCount })
                .eq('id', bookId);

            if (updateError) {
                console.error('更新下载次数失败:', updateError.message);
            }
            // 这里不抛出错误，因为下载统计不是关键功能
        } catch (error) {
            console.error('更新下载次数时发生错误:', error);
        }
    }

    // 删除书籍
    async deleteBook(bookId, fileName) {
        try {
            // 检查用户是否已认证
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            
            if (authError || !user) {
                throw new Error('请先登录后再删除书籍');
            }
            
            // 从数据库删除记录
            const { error: dbError } = await this.supabase
                .from(this.booksTable)
                .delete()
                .eq('id', bookId);

            if (dbError) {
                throw new Error(`数据库删除失败: ${dbError.message}`);
            }

            // 从 Storage 删除文件
            const { error: storageError } = await this.supabase
                .storage
                .from(this.bucketName)
                .remove([fileName]);

            if (storageError) {
                console.warn('文件删除失败，可能需要手动清理:', storageError.message);
            }

            return { success: true };
        } catch (error) {
            console.error('删除书籍时发生错误:', error);
            return { success: false, error: error.message };
        }
    }
}

// 导出 BookManager 类
window.BookManager = BookManager;
// 书籍管理功能模块
class BookManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.currentBooks = [];
        this.allTags = [];
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
            const fileName = `${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await this.supabase
                .storage
                .from('books')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error(`文件上传失败: ${uploadError.message}`);
            }

            // 获取文件的公开 URL
            const { data: { publicUrl } } = this.supabase
                .storage
                .from('books')
                .getPublicUrl(fileName);

            // 将标签字符串转换为数组
            const tags = bookData.tags ? bookData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            // 在数据库中插入书籍记录
            const { data: bookRecord, error: dbError } = await this.supabase
                .from('books')
                .insert([{
                    title: bookData.title,
                    author: bookData.author,
                    description: bookData.description,
                    tags: tags,
                    file_url: publicUrl,
                    file_name: file.name,
                    file_size: file.size
                }])
                .select()
                .single();

            if (dbError) {
                // 如果数据库插入失败，尝试删除已上传的文件
                await this.supabase.storage.from('books').remove([fileName]);
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
            // 检查用户是否已认证
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            
            if (authError || !user) {
                throw new Error('请先登录后再查看书籍');
            }
            
            const { data: books, error } = await this.supabase
                .from('books')
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
            // 检查用户是否已认证
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            
            if (authError || !user) {
                throw new Error('请先登录后再查看书籍');
            }
            
            const { data: books, error } = await this.supabase
                .from('books')
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
            // 检查用户是否已认证
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            
            if (authError || !user) {
                throw new Error('请先登录后再搜索书籍');
            }
            
            const { data: books, error } = await this.supabase
                .from('books')
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

    // 更新下载次数
    async incrementDownloadCount(bookId) {
        try {
            // 先获取当前下载次数
            const { data, error } = await this.supabase
                .from('books')
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
                .from('books')
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
                .from('books')
                .delete()
                .eq('id', bookId);

            if (dbError) {
                throw new Error(`数据库删除失败: ${dbError.message}`);
            }

            // 从 Storage 删除文件
            const { error: storageError } = await this.supabase
                .storage
                .from('books')
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
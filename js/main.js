// 主应用逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 检查 Supabase 客户端是否已初始化
    if (!window.supabaseClient) {
        console.error('Supabase 客户端未初始化');
        showMessage('错误：Supabase 客户端未正确配置', 'error');
        return;
    }
    
    // 获取DOM元素
    const userInfoSpan = document.getElementById('user-info');
    const authToggleBtn = document.getElementById('auth-toggle-btn');
    const loginModal = document.getElementById('login-modal');
    const closeModal = document.getElementById('close-login-modal');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const toggleAuthMode = document.getElementById('toggle-auth-mode');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    
    // 当前认证模式（true为注册，false为登录）
    let isSignUpMode = false;
    
    // 检查当前用户认证状态
    checkAuthStatus();
    
    // 监听认证状态变化
    if (window.supabaseAuth) {
        window.supabaseAuth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                await handleUserLoggedIn(session.user);
            } else if (event === 'SIGNED_OUT') {
                handleUserLoggedOut();
            }
        });
    }

    // 初始化书籍管理器
    const bookManager = new BookManager(window.supabaseClient);
    
    // 获取DOM元素
    const booksContainer = document.getElementById('books-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const tagFilterSelect = document.getElementById('tag-filter-select');
    
    // 页面加载时直接获取书籍（支持游客模式）
    loadBooks();
    
    // 认证相关事件监听器
    authToggleBtn.addEventListener('click', function() {
        loginModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', function() {
        loginModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });
    
    toggleAuthMode.addEventListener('click', function(e) {
        e.preventDefault();
        toggleAuthModeFunc();
    });
    
    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleAuthSubmit();
    });
    
    // 搜索按钮点击事件
    searchBtn.addEventListener('click', function() {
        performSearch();
    });
    
    // 搜索框回车事件
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 标签过滤变化事件
    tagFilterSelect.addEventListener('change', function() {
        const selectedTag = this.value;
        if (selectedTag) {
            filterBooksByTag(selectedTag);
        } else {
            loadBooks();
        }
    });
    
    // 加载所有书籍
    async function loadBooks() {
        // 游客也可以加载书籍
        toggleLoginPrompt(false);
        booksContainer.innerHTML = '<p class="loading-message">正在加载书籍...</p>';
        
        const result = await bookManager.getAllBooks();
        
        if (result.success) {
            displayBooks(result.data);
            
            // 加载标签选项
            await loadTagOptions();
        } else {
            booksContainer.innerHTML = `<p class="error-message">加载书籍失败: ${result.error}</p>`;
            showMessage(`加载书籍失败: ${result.error}`, 'error');
        }
    }
    
    // 按标签过滤书籍
    async function filterBooksByTag(tag) {
        // 游客也可以按标签过滤
        toggleLoginPrompt(false);
        booksContainer.innerHTML = '<p class="loading-message">正在加载书籍...</p>';
        
        const result = await bookManager.getBooksByTag(tag);
        
        if (result.success) {
            displayBooks(result.data);
        } else {
            booksContainer.innerHTML = `<p class="error-message">加载书籍失败: ${result.error}</p>`;
            showMessage(`加载书籍失败: ${result.error}`, 'error');
        }
    }
    
    // 执行搜索
    async function performSearch() {
        // 游客也可以搜索
        toggleLoginPrompt(false);
        const query = searchInput.value.trim();
        
        if (!query) {
            loadBooks();
            return;
        }
        
        booksContainer.innerHTML = '<p class="loading-message">正在搜索书籍...</p>';
        
        const result = await bookManager.searchBooks(query);
        
        if (result.success) {
            displayBooks(result.data);
        } else {
            booksContainer.innerHTML = `<p class="error-message">搜索失败: ${result.error}</p>`;
            showMessage(`搜索失败: ${result.error}`, 'error');
        }
    }
    
    // 加载标签选项到下拉菜单
    async function loadTagOptions() {
        const result = await bookManager.getAllTags();
        
        if (result.success) {
            // 清空现有选项（保留第一个"全部标签"选项）
            tagFilterSelect.innerHTML = '<option value="">全部标签</option>';
            
            // 添加新的标签选项
            result.data.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag;
                option.textContent = tag;
                tagFilterSelect.appendChild(option);
            });
        }
    }
    
    // 显示书籍列表
    function displayBooks(books) {
        if (!books || books.length === 0) {
            booksContainer.innerHTML = '<p class="empty-message">没有找到书籍</p>';
            return;
        }
        
        booksContainer.innerHTML = '';
        
        books.forEach(book => {
            const bookCard = createBookCard(book);
            booksContainer.appendChild(bookCard);
        });
        
        // 为所有下载按钮添加点击事件
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.preventDefault();
                const bookId = this.getAttribute('data-book-id');
                const filePath = this.getAttribute('data-file-path');
                const fileName = this.getAttribute('data-file-name');
                console.log('下载文件名1:', fileName);
                if (bookId && filePath && fileName) {
                    const result = await bookManager.downloadBook(bookId, filePath, fileName);
                    if (result.success) {
                        // 创建临时链接并触发下载
                        const link = document.createElement('a');
                        link.href = result.url;
                        link.download = fileName;
                        console.log('下载文件名2:', fileName);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else {
                        showMessage(`下载失败: ${result.error}`, 'error');
                    }
                }
            });
        });
    }
    
    // 创建书籍卡片
    function createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        // 创建标签元素
        let tagsHtml = '';
        if (book.tags && book.tags.length > 0) {
            tagsHtml = '<div class="book-tags">';
            book.tags.forEach(tag => {
                tagsHtml += `<span class="tag">${tag}</span>`;
            });
            tagsHtml += '</div>';
        }
        
        // 格式化文件大小
        const fileSize = formatFileSize(book.file_size);
        
        card.innerHTML = `
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-author">作者: ${escapeHtml(book.author)}</p>
            ${book.description ? `<p class="book-description">${escapeHtml(book.description)}</p>` : ''}
            ${tagsHtml}
            <p>文件大小: ${fileSize}</p>
            <p>上传时间: ${formatDate(book.upload_date)}</p>
            <p>下载次数: ${book.download_count || 0}</p>
            <button class="download-btn" data-book-id="${book.id}" data-file-path="${book.file_path}" data-file-name="${book.file_name}">下载书籍</button>
        `;
        
        return card;
    }
    
    // 转义HTML以防止XSS攻击
    function escapeHtml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (!bytes) return '未知大小';
        
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    // 格式化日期
    function formatDate(dateString) {
        if (!dateString) return '未知时间';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    // 显示消息通知
    function showMessage(message, type) {
        // 移除现有的消息元素
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        // 插入到主内容区域的顶部
        const main = document.querySelector('main');
        main.insertBefore(messageEl, main.firstChild);
        
        // 3秒后自动移除消息
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 3000);
    }
    
    // 检查当前用户认证状态
    async function checkAuthStatus() {
        if (!window.supabaseAuth) return;
        
        try {
            const user = await window.supabaseAuth.getCurrentUser();
            if (user) {
                await handleUserLoggedIn(user);
            } else {
                handleUserLoggedOut();
            }
        } catch (error) {
            console.error('检查认证状态时出错:', error);
            handleUserLoggedOut();
        }
    }
    
    // 显示/隐藏登录提示
    function toggleLoginPrompt(show) {
        const loginPrompt = document.getElementById('login-prompt');
        if (loginPrompt) {
            if (show) {
                loginPrompt.style.display = 'block';
            } else {
                loginPrompt.style.display = 'none';
            }
        }
    }
    
    // 处理用户登录
    async function handleUserLoggedIn(user) {
        userInfoSpan.textContent = user.email;
        authToggleBtn.textContent = '登出';
        
        // 更新按钮功能为登出
        authToggleBtn.removeEventListener('click', showLoginModal);
        authToggleBtn.addEventListener('click', handleLogout);
        
        // 隐藏登录提示
        toggleLoginPrompt(false);
        
        showMessage('欢迎回来！', 'success');
    }
    
    // 处理用户登出
    function handleUserLoggedOut() {
        userInfoSpan.textContent = '游客';
        authToggleBtn.textContent = '登录';
        
        // 更新按钮功能为显示登录
        authToggleBtn.removeEventListener('click', handleLogout);
        authToggleBtn.addEventListener('click', showLoginModal);
        
        // 游客模式下不显示登录提示，可以继续浏览
        toggleLoginPrompt(false);
        
        // 重新加载书籍列表以确保游客可以浏览
        loadBooks();
    }
    
    // 显示登录模态框
    function showLoginModal() {
        loginModal.style.display = 'block';
    }
    
    // 处理登出
    async function handleLogout() {
        try {
            await window.supabaseAuth.signOut();
            showMessage('已成功登出', 'success');
        } catch (error) {
            console.error('登出时出错:', error);
            showMessage('登出时出现问题', 'error');
        }
    }
    
    // 切换认证模式（登录/注册）
    function toggleAuthModeFunc() {
        isSignUpMode = !isSignUpMode;
        
        if (isSignUpMode) {
            authTitle.textContent = '注册';
            authSubmitBtn.textContent = '注册';
            confirmPasswordGroup.style.display = 'block';
            toggleAuthMode.textContent = '已有账户？登录';
        } else {
            authTitle.textContent = '登录';
            authSubmitBtn.textContent = '登录';
            confirmPasswordGroup.style.display = 'none';
            toggleAuthMode.textContent = '还没有账户？注册';
        }
    }
    
    // 处理认证表单提交
    async function handleAuthSubmit() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (isSignUpMode) {
            // 验证确认密码
            const confirmPassword = document.getElementById('confirm-password').value;
            if (password !== confirmPassword) {
                showMessage('密码不匹配', 'error');
                return;
            }
            
            try {
                const result = await window.supabaseAuth.signUp(email, password);
                if (result) {
                    showMessage('注册成功！请检查您的邮箱以确认账户', 'success');
                    loginModal.style.display = 'none';
                }
            } catch (error) {
                console.error('注册时出错:', error);
                showMessage(`注册失败: ${error.message}`, 'error');
            }
        } else {
            try {
                const result = await window.supabaseAuth.signIn(email, password);
                if (result) {
                    showMessage('登录成功！', 'success');
                    loginModal.style.display = 'none';
                }
            } catch (error) {
                console.error('登录时出错:', error);
                showMessage(`登录失败: ${error.message}`, 'error');
            }
        }
    }
});
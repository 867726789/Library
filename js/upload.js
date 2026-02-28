// 上传页面逻辑
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
    const uploadSection = document.getElementById('upload');
    
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
    const uploadForm = document.getElementById('upload-form');
    
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
    
    // 上传表单提交事件
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const title = document.getElementById('book-title').value;
        const author = document.getElementById('book-author').value;
        const description = document.getElementById('book-description').value;
        const tags = document.getElementById('book-tags').value;
        const fileInput = document.getElementById('book-file');
        
        if (!fileInput.files[0]) {
            showMessage('请选择要上传的文件', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        
        // 调试：显示文件信息
        console.log('文件名:', file.name);
        console.log('文件类型:', file.type);
        console.log('文件大小:', file.size);
        
        // 验证文件类型
        const allowedTypes = ['application/pdf', 'application/epub+zip', 'application/x-mobipocket-ebook', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        // 额外检查：通过文件扩展名判断EPUB文件
        const isEpubByExtension = file.name.toLowerCase().endsWith('.epub');
        
        if (!allowedTypes.includes(file.type) && !isEpubByExtension) {
            showMessage(`不支持的文件类型: ${file.type}，请上传 PDF, EPUB, MOBI, TXT, DOC 或 DOCX 文件`, 'error');
            return;
        }
        
        // 如果是通过扩展名识别的EPUB文件，标准化类型
        if (isEpubByExtension && !allowedTypes.includes(file.type)) {
            console.log('通过扩展名识别为EPUB文件');
        }
        
        // 验证文件大小（例如限制为 100MB）
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            showMessage('文件过大，请上传小于 100MB 的文件', 'error');
            return;
        }
        
        // 准备书籍数据
        const bookData = {
            title,
            author,
            description,
            tags
        };
        
        // 显示上传进度消息
        showMessage('正在上传书籍...', 'info');
        
        // 上传书籍
        const result = await bookManager.uploadBook(bookData, file);
        
        if (result.success) {
            showMessage('书籍上传成功！', 'success');
            uploadForm.reset(); // 清空表单
            // 上传成功后跳转到书库页面
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage(`上传失败: ${result.error}`, 'error');
        }
    });
    
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
        uploadSection.classList.remove('require-auth');
        
        // 更新按钮功能为登出
        authToggleBtn.removeEventListener('click', showLoginModal);
        authToggleBtn.addEventListener('click', handleLogout);
        
        // 隐藏登录提示
        toggleLoginPrompt(false);
        
        showMessage('欢迎回来！您现在可以上传书籍了。', 'success');
    }
    
    // 处理用户登出
    function handleUserLoggedOut() {
        userInfoSpan.textContent = '游客';
        authToggleBtn.textContent = '登录';
        uploadSection.classList.add('require-auth');
        
        // 更新按钮功能为显示登录
        authToggleBtn.removeEventListener('click', handleLogout);
        authToggleBtn.addEventListener('click', showLoginModal);
        
        // 游客模式下显示登录提示
        toggleLoginPrompt(true);
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
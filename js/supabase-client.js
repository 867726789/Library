// Supabase 客户端配置
// 注意：在生产环境中，这些值应该通过更安全的方式提供
// 或者通过环境变量设置

// 从环境变量获取 Supabase 配置
const SUPABASE_URL = 'https://ffaemlcndhosglpngoyr.supabase.co'; // 替换为你的 Supabase 项目 URL
const SUPABASE_ANON_KEY = ''; // 为空字符串，因为我们只使用认证用户访问

// 创建 Supabase 客户端实例 - 使用空的 anon key，强制用户认证
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 认证相关方法
const auth = {
    // 注册用户
    signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    },
    
    // 登录用户
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        return data;
    },
    
    // 登出用户
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            throw new Error(error.message);
        }
    },
    
    // 获取当前用户
    getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },
    
    // 监听认证状态变化
    onAuthStateChange: (callback) => {
        const { data: listener, error } = supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
        
        if (error) {
            console.error('认证状态监听错误:', error.message);
        }
        
        return listener;
    }
};

// 导出 supabase 实例和认证方法供其他模块使用
window.supabaseClient = supabase;
window.supabaseAuth = auth;

// 检查 Supabase 配置是否正确设置
if (!SUPABASE_URL) {
    console.warn('警告: Supabase 配置未设置，请在 js/supabase-client.js 中填写正确的 URL');
}

// 导出 supabase 实例和认证方法供其他模块使用
window.supabaseClient = supabase;
window.supabaseAuth = auth;

// 检查 Supabase 配置是否正确设置
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('警告: Supabase 配置未设置，请在 js/supabase-client.js 中填写正确的 URL 和密钥');
}
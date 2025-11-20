
import { 
  Mic, 
  Video, 
  Type, 
  Calendar, 
  Sparkles, 
  Trash2, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  Search, 
  Plus, 
  Image, 
  MessageCircle, 
  Send, 
  Settings, 
  User, 
  LogOut, 
  Link as LinkIcon, 
  Database, 
  Lock, 
  Eye, 
  Volume2, 
  Network, 
  Edit: Edit3, 
  Check, 
  Cpu, 
  Refresh: RefreshCw, 
  Globe, 
  Smartphone, 
  Mail, 
  ShieldCheck, 
  Cloud, 
  Key: KeyRound, 
  HelpCircle 
} from 'lucide-react';

import { AIModel, Language } from './types';

export const ICONS = {
  Mic,
  Video,
  Type,
  Calendar,
  Sparkles,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Search,
  Plus,
  Image,
  MessageCircle,
  Send,
  Settings,
  User,
  LogOut,
  Link: LinkIcon,
  Database,
  Lock,
  Eye,     
  Speaker: Volume2, 
  Network, 
  Edit: Edit3,
  Check,
  Cpu,
  Refresh: RefreshCw,
  Globe,
  Smartphone,
  Mail,
  ShieldCheck,
  Cloud,
  Key: KeyRound,
  Help: HelpCircle
};

export const THEME = {
  primary: '#007AFF', 
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  background: '#F5F5F7',
  card: '#FFFFFF',
  textSecondary: '#86868B'
};

export const SUPPORTED_MODELS: AIModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    capabilities: ['text', 'image', 'audio', 'video'],
    description: '全能型选手，速度快，支持所有模态。'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    capabilities: ['text', 'image', 'audio', 'video'],
    description: '推理能力更强，适合复杂分析。'
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    capabilities: ['text'],
    description: '强大的中文推理与编程能力。'
  },
  {
    id: 'qwen-max',
    name: '通义千问 Qwen-Max',
    provider: 'Alibaba',
    capabilities: ['text', 'image'],
    description: '通义千问旗舰模型，支持图文理解。'
  },
  {
    id: 'moonshot-v1-8k',
    name: 'Kimi (Moonshot)',
    provider: 'Moonshot',
    capabilities: ['text'],
    description: '擅长长文本阅读与归纳。'
  },
  {
    id: 'glm-4',
    name: '智谱 GLM-4',
    provider: 'ZhipuAI',
    capabilities: ['text', 'image'],
    description: '新一代基座模型，综合能力强。'
  }
];

export const TEXTS = {
  zh: {
    setupTitle: '连接云服务',
    setupSubtitle: '请输入 Supabase 项目配置以开启真实邮件验证功能',
    urlPlaceholder: 'Project URL (https://....supabase.co)',
    keyPlaceholder: 'Publishable Key (sb_public...)',
    connectButton: '连接服务',
    setupSkip: '我想使用本地离线演示版',
    
    // Auth Text
    loginTab: '登录',
    registerTab: '注册',
    loginTitle: '欢迎回来',
    registerTitle: '创建账号',
    loginSubtitle: '登录以继续记录您的人生',
    registerSubtitle: '开始您的人生记录之旅',
    
    identifierPlaceholder: '电子邮箱地址',
    passwordPlaceholder: '设置密码',
    loginPasswordPlaceholder: '请输入密码',
    
    codePlaceholder: '请输入6位验证码',
    getCode: '获取验证码',
    resendCode: '重新发送',
    
    loginButton: '登录',
    registerButton: '注册并验证',
    verifyButton: '验证并完成',
    nextButton: '下一步',
    
    loginError: '账号不存在或密码错误',
    userNotFoundError: '账号不存在，请先注册',
    registerError: '注册失败，邮箱可能已被占用',
    codeError: '验证码错误',
    formatError: '请输入有效的邮箱地址',
    codeSentAlert: '验证码已发送至您的邮箱，请查收。',
    
    step1: '账号信息',
    step2: '邮箱验证',
    
    helpTitle: '如何获取数字验证码？',
    helpContent: 'Supabase 默认发送链接。要发送6位数字，请去 Supabase 后台 > Authentication > Email Templates > Confirm Signup / Magic Link，将正文中的 {{ .ConfirmationURL }} 替换为 {{ .Token }}。',
    
    // App Text
    timelineEmpty: '记录第一条灵感...',
    composePlaceholder: '写下此时此刻的想法...',
    save: '保存',
    analyzing: '思考中...',
    analyzeButton: '生成 AI 感悟',
    aiInsight: 'AI 感悟',
    deleteConfirm: '确定删除这条记忆吗？',
    settingsTitle: '全局设置',
    profile: '个人资料',
    aiModels: 'AI 模型接入',
    logout: '退出登录',
    language: '语言 / Language',
    chatPlaceholder: '问我任何关于你过去的事...',
    graphMode: '知识图谱',
    chatMode: '对话模式',
    regenerate: '重新生成',
    edit: '编辑',
    saveEdit: '保存修改',
    cancel: '取消',
    clickToAnalyze: '点击生成感悟',
    newMemory: '新记录',
    selectModel: '选择分析模型',
    back: '返回',
    memoryDetail: '记忆详情',
    authModeOtp: '验证码登录',
    authModePwd: '密码登录',
    or: '或',
    registerSuccess: '注册成功！已自动登录。'
  },
  en: {
    setupTitle: 'Connect Cloud',
    setupSubtitle: 'Enter Supabase config for real email auth',
    urlPlaceholder: 'Project URL (https://....supabase.co)',
    keyPlaceholder: 'Publishable Key (sb_public...)',
    connectButton: 'Connect',
    setupSkip: 'Use Local Demo Version',
    
    loginTab: 'Log In',
    registerTab: 'Sign Up',
    loginTitle: 'Welcome Back',
    registerTitle: 'Create Account',
    loginSubtitle: 'Log in to continue your journey',
    registerSubtitle: 'Start logging your life today',
    
    identifierPlaceholder: 'Email Address',
    passwordPlaceholder: 'Set Password',
    loginPasswordPlaceholder: 'Password',
    
    codePlaceholder: 'Enter 6-digit Code',
    getCode: 'Get Code',
    resendCode: 'Resend',
    
    loginButton: 'Log In',
    registerButton: 'Register & Verify',
    verifyButton: 'Verify & Complete',
    nextButton: 'Next',
    
    loginError: 'Invalid credentials',
    userNotFoundError: 'User not found. Please register.',
    registerError: 'Registration failed. Email might be taken.',
    codeError: 'Invalid verification code',
    formatError: 'Please enter a valid email',
    codeSentAlert: 'Code sent to your email.',
    
    step1: 'Account Info',
    step2: 'Email Verification',
    
    helpTitle: 'How to get digits?',
    helpContent: 'Go to Supabase Dashboard > Authentication > Email Templates. Replace {{ .ConfirmationURL }} with {{ .Token }} to receive 6-digit codes instead of links.',

    timelineEmpty: 'Log your first inspiration...',
    composePlaceholder: 'What\'s on your mind?',
    save: 'Save',
    analyzing: 'Thinking...',
    analyzeButton: 'Generate AI Insight',
    aiInsight: 'AI Insight',
    deleteConfirm: 'Delete this memory?',
    settingsTitle: 'Settings',
    profile: 'Profile',
    aiModels: 'AI Models',
    logout: 'Log Out',
    language: 'Language / 语言',
    chatPlaceholder: 'Ask anything about your past...',
    graphMode: 'Knowledge Graph',
    chatMode: 'Chat Mode',
    regenerate: 'Regenerate',
    edit: 'Edit',
    saveEdit: 'Save Changes',
    cancel: 'Cancel',
    clickToAnalyze: 'Click to Analyze',
    newMemory: 'New Memory',
    selectModel: 'Select Model',
    back: 'Back',
    memoryDetail: 'Memory Detail',
    authModeOtp: 'Code Login',
    authModePwd: 'Password',
    or: 'or',
    registerSuccess: 'Registered! You are logged in.'
  }
};

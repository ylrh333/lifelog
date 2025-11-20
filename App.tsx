
import React, { useState, useEffect, useRef } from 'react';
import { Memory, MediaType, AIAnalysis, UserProfile, UserModelConfig, GraphData, Language, SupabaseConfig } from './types';
import { saveMemoryToDB, getMemoriesFromDB, deleteMemoryFromDB } from './services/db';
import { MemoryCard } from './components/MemoryCard';
import { askLifeCoach, analyzeMemory, generateGraphData } from './services/geminiService';
import { initSupabase, signInWithOtp, verifyOtp, signInWithPassword, signUpWithPassword, logout as supabaseLogout } from './services/supabaseService';
import { SettingsScreen } from './components/Settings';
import { NetworkGraph } from './components/NetworkGraph';
import { ICONS, SUPPORTED_MODELS, TEXTS } from './constants';

type ViewMode = 'timeline' | 'compose' | 'chat' | 'settings' | 'auth' | 'setup' | 'memory-detail';

// --- Setup Screen ---
const SetupScreen = ({ onComplete, language }: { onComplete: () => void, language: Language }) => {
  const t = TEXTS[language];
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
     if (!url || !key) {
         setError("Missing fields");
         return;
     }
     const success = initSupabase({ url, key });
     if (success) {
         onComplete();
     } else {
         setError("Failed to initialize. Check URL format.");
     }
  };

  const handleSkip = () => {
     onComplete(); 
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 text-center animate-fade-in">
       <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
          <ICONS.Cloud className="text-white" size={32} />
       </div>
       <h1 className="text-2xl font-bold mb-2 text-gray-900">{t.setupTitle}</h1>
       <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">{t.setupSubtitle}</p>
       
       <div className="w-full max-w-sm space-y-4">
           <input 
             type="text" 
             placeholder={t.urlPlaceholder}
             value={url}
             onChange={(e) => setUrl(e.target.value)}
             className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
           />
           <div>
             <input 
               type="password" 
               placeholder={t.keyPlaceholder}
               value={key}
               onChange={(e) => setKey(e.target.value)}
               className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
             />
             <p className="text-[10px] text-gray-400 text-left mt-1 ml-1 flex items-center gap-1">
                <ICONS.Key size={10} /> Copy the <b>Publishable key</b> (starts with <code>sb_public</code>).
             </p>
           </div>
           
           {error && <p className="text-red-500 text-xs text-left">{error}</p>}
           
           <button 
             onClick={handleConnect}
             className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-transform active:scale-95 shadow-lg shadow-blue-200"
           >
             {t.connectButton}
           </button>

           <button onClick={handleSkip} className="text-xs text-gray-400 hover:text-gray-600 mt-4 underline">
             {t.setupSkip}
           </button>
       </div>
    </div>
  );
};

// --- Auth Screen ---
const AuthScreen = ({ onLogin, language }: { onLogin: () => void, language: Language }) => {
  const t = TEXTS[language];
  
  // Top level mode: 'login' or 'register'
  const [mainMode, setMainMode] = useState<'login' | 'register'>('login');
  
  // Login sub-mode: 'otp' or 'password'
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('password');
  
  // Register flow step: 'form' (email/pwd) -> 'verify' (code)
  const [registerStep, setRegisterStep] = useState<'form' | 'verify'>('form');

  // Common Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    let interval: number;
    if (timer > 0) {
      interval = window.setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validateEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  // --- Logic: REGISTER FLOW ---
  const handleRegisterStep1 = async () => {
    if (!validateEmail(email)) return setError(t.formatError);
    if (password.length < 6) return setError("Password min 6 chars");
    
    setLoading(true);
    setError('');
    try {
        // Step 1: Sign up with password (triggers email send)
        await signUpWithPassword(email, password);
        setRegisterStep('verify'); // Move to next step
        setTimer(60);
    } catch (e: any) {
        setError(t.registerError + ": " + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleRegisterVerify = async () => {
      setLoading(true);
      setError('');
      try {
          const { session } = await verifyOtp(email, code, 'signup'); // Explicit 'signup' type
          if (session) {
              alert(t.registerSuccess);
              onLogin();
          } else {
              setError(t.codeError);
          }
      } catch (e: any) {
          setError(e.message || t.codeError);
      } finally {
          setLoading(false);
      }
  };

  // --- Logic: LOGIN FLOW ---
  const handleLoginOtpSend = async () => {
      if (!validateEmail(email)) return setError(t.formatError);
      setLoading(true);
      setError('');
      try {
          // Strict login: shouldCreateUser = false
          await signInWithOtp(email, false);
          setTimer(60);
          // We reuse the 'verify' logic but UI state handles the view
          setLoginMethod('otp'); 
      } catch (e: any) {
          // Supabase might throw error if user not found when shouldCreateUser is false
          if (e.message?.includes('Signups not allowed') || e.message?.includes('not found')) {
              setError(t.userNotFoundError);
          } else {
              setError(e.message);
          }
      } finally {
          setLoading(false);
      }
  };

  const handleLoginOtpVerify = async () => {
      setLoading(true);
      setError('');
      try {
          const { session } = await verifyOtp(email, code, 'magiclink'); // Use 'magiclink' or 'email' for login
          if (session) onLogin();
      } catch (e: any) {
          setError(t.codeError);
      } finally {
          setLoading(false);
      }
  };

  const handleLoginPassword = async () => {
      if (!validateEmail(email)) return setError(t.formatError);
      setLoading(true);
      setError('');
      try {
          await signInWithPassword(email, password);
          onLogin();
      } catch (e: any) {
          setError(t.loginError);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-white animate-fade-in relative overflow-hidden">
       
       {/* Help Modal */}
       {showHelp && (
           <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
               <div className="bg-white rounded-2xl p-6 max-w-xs shadow-2xl animate-scale-in">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-gray-900 flex items-center gap-2">
                           <ICONS.Settings size={18}/> Config Supabase
                       </h3>
                       <button onClick={() => setShowHelp(false)}><ICONS.X size={20}/></button>
                   </div>
                   <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line">
                       {t.helpContent}
                   </p>
                   <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono text-gray-800 mb-4 overflow-x-auto">
                       <pre>{`<h2>Verification Code</h2>
<p>Your code is:</p>
<h1>{{ .Token }}</h1>`}</pre>
                   </div>
                   <button onClick={() => setShowHelp(false)} className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold">Got it</button>
               </div>
           </div>
       )}

       {/* Logo */}
       <div className="w-16 h-16 bg-gray-900 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl">
          <ICONS.Sparkles className="text-white" size={32} />
       </div>

       {/* --- TOP TABS: LOGIN vs REGISTER --- */}
       <div className="flex gap-8 mb-8 border-b border-gray-100 w-full max-w-xs justify-center">
           <button 
             onClick={() => { setMainMode('login'); setError(''); }}
             className={`pb-3 text-lg font-bold transition-all border-b-2 ${mainMode === 'login' ? 'text-gray-900 border-gray-900' : 'text-gray-300 border-transparent hover:text-gray-500'}`}
           >
             {t.loginTab}
           </button>
           <button 
             onClick={() => { setMainMode('register'); setError(''); }}
             className={`pb-3 text-lg font-bold transition-all border-b-2 ${mainMode === 'register' ? 'text-gray-900 border-gray-900' : 'text-gray-300 border-transparent hover:text-gray-500'}`}
           >
             {t.registerTab}
           </button>
       </div>

       {/* --- CONTAINER --- */}
       <div className="w-full max-w-xs min-h-[320px]">
           
           {/* 1. REGISTER VIEW */}
           {mainMode === 'register' && (
               <div className="space-y-5 animate-slide-up">
                   {registerStep === 'form' ? (
                       <>
                           <div className="space-y-4">
                               <input 
                                   className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                   placeholder={t.identifierPlaceholder}
                                   value={email}
                                   onChange={(e) => setEmail(e.target.value)}
                               />
                               <input 
                                   type="password"
                                   className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                   placeholder={t.passwordPlaceholder}
                                   value={password}
                                   onChange={(e) => setPassword(e.target.value)}
                               />
                           </div>
                           <button 
                               onClick={handleRegisterStep1}
                               disabled={loading}
                               className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all disabled:opacity-50"
                           >
                               {loading ? '...' : t.registerButton}
                           </button>
                           <p className="text-xs text-gray-400 text-center px-4">
                               Registering will send a verification code to your email.
                           </p>
                       </>
                   ) : (
                       /* Register Step 2: Verify */
                       <div className="space-y-4">
                           <div className="text-center mb-2">
                               <p className="text-sm text-gray-500">Code sent to</p>
                               <p className="font-bold text-gray-900">{email}</p>
                           </div>
                           <div className="relative">
                                <input 
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-center text-lg tracking-widest font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="000000"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    maxLength={6}
                                />
                                <button onClick={() => setShowHelp(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-500">
                                    <ICONS.Help size={16} />
                                </button>
                           </div>
                           <button 
                               onClick={handleRegisterVerify}
                               disabled={loading}
                               className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-100 hover:bg-green-600 transition-all"
                           >
                               {loading ? '...' : t.verifyButton}
                           </button>
                           <button onClick={() => setRegisterStep('form')} className="w-full text-xs text-gray-400">{t.back}</button>
                       </div>
                   )}
               </div>
           )}

           {/* 2. LOGIN VIEW */}
           {mainMode === 'login' && (
               <div className="space-y-5 animate-slide-up">
                   {/* Login Method Switcher */}
                   <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                       <button 
                           onClick={() => { setLoginMethod('password'); setError(''); }}
                           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMethod === 'password' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                       >
                           {t.authModePwd}
                       </button>
                       <button 
                           onClick={() => { setLoginMethod('otp'); setError(''); }}
                           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMethod === 'otp' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                       >
                           {t.authModeOtp}
                       </button>
                   </div>

                   {/* Password Login */}
                   {loginMethod === 'password' && (
                       <>
                           <input 
                               className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                               placeholder={t.identifierPlaceholder}
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                           />
                           <input 
                               type="password"
                               className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                               placeholder={t.loginPasswordPlaceholder}
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                           />
                           <button 
                               onClick={handleLoginPassword}
                               disabled={loading}
                               className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg shadow-gray-200 hover:bg-black hover:scale-[1.02] transition-all disabled:opacity-50"
                           >
                               {loading ? '...' : t.loginButton}
                           </button>
                       </>
                   )}

                   {/* OTP Login */}
                   {loginMethod === 'otp' && (
                       timer > 0 ? (
                           /* OTP Verify Step */
                           <div className="space-y-4">
                               <div className="text-center">
                                   <span className="text-xs text-gray-400">Code sent to {email}</span>
                               </div>
                               <div className="relative">
                                   <input 
                                       className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-center text-lg tracking-widest font-bold outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                                       placeholder="000000"
                                       value={code}
                                       onChange={(e) => setCode(e.target.value)}
                                       maxLength={6}
                                   />
                                   <button onClick={() => setShowHelp(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-500">
                                        <ICONS.Help size={16} />
                                   </button>
                               </div>
                               <button 
                                   onClick={handleLoginOtpVerify}
                                   disabled={loading}
                                   className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg transition-all"
                               >
                                   {t.loginButton}
                               </button>
                               <button onClick={() => setTimer(0)} className="w-full text-xs text-gray-400">{t.back}</button>
                           </div>
                       ) : (
                           /* OTP Request Step */
                           <>
                               <input 
                                   className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                                   placeholder={t.identifierPlaceholder}
                                   value={email}
                                   onChange={(e) => setEmail(e.target.value)}
                               />
                               <button 
                                   onClick={handleLoginOtpSend}
                                   disabled={loading}
                                   className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg shadow-gray-200 hover:bg-black hover:scale-[1.02] transition-all disabled:opacity-50"
                               >
                                   {loading ? '...' : t.getCode}
                               </button>
                           </>
                       )
                   )}
               </div>
           )}

           {/* Error Message */}
           {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-500 rounded-xl text-xs flex items-start gap-2 animate-shake">
                    <ICONS.X size={14} className="mt-0.5 shrink-0"/> 
                    <span className="font-medium">{error}</span>
                </div>
           )}
       </div>
    </div>
  );
};

// ... (Rest of App.tsx remains the same, just exporting the updated App component)
export default function App() {
  // Global State
  const [userConfigs, setUserConfigs] = useState<UserModelConfig[]>([]);
  const [language, setLanguage] = useState<Language>('zh'); // Default zh
  const [activeModelId, setActiveModelId] = useState<string>('gemini-2.5-flash');

  const [profile, setProfile] = useState<UserProfile>({
    name: 'Traveler',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    language: 'zh'
  });

  // App State
  const [view, setView] = useState<ViewMode>('setup'); // Initial view
  const [historyStack, setHistoryStack] = useState<ViewMode[]>([]);
  
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  // Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  // Compose State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState<MediaType>(MediaType.TEXT);
  const [composeText, setComposeText] = useState('');
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const t = TEXTS[language];

  // --- Initialization ---
  useEffect(() => {
    // Check for existing setup
    const savedConfig = localStorage.getItem('lifelog_supabase_config');
    if (savedConfig) {
      const { url, key } = JSON.parse(savedConfig);
      if (initSupabase({ url, key })) {
         setView('auth');
      }
    }
    
    // Load Memories
    getMemoriesFromDB().then(setMemories);
  }, []);

  useEffect(() => {
    setProfile(p => ({ ...p, language }));
  }, [language]);

  // --- Navigation Helpers ---
  const navigateTo = (newView: ViewMode) => {
    if (view !== newView) {
       setHistoryStack([...historyStack, view]);
       setView(newView);
    }
  };

  const goBack = () => {
    const prev = historyStack.pop();
    if (prev) {
       setHistoryStack([...historyStack]); // update stack
       setView(prev);
    } else {
       setView('timeline');
    }
  };

  // --- Memory Actions ---
  const handleSaveMemory = async () => {
    if (!composeText && !mediaBlob) return;
    
    const newMemory: Memory = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      content: composeText,
      mediaType: composeType,
      mediaBlob: mediaBlob || undefined
    };

    await saveMemoryToDB(newMemory);
    setMemories([newMemory, ...memories]);
    
    // Reset
    setComposeText('');
    setMediaBlob(null);
    setComposeType(MediaType.TEXT);
    setIsComposeOpen(false);
  };

  const handleDeleteMemory = async (id: string) => {
    if (confirm(t.deleteConfirm)) {
      await deleteMemoryFromDB(id);
      setMemories(memories.filter(m => m.id !== id));
    }
  };

  const handleAnalyzeUpdate = (id: string, analysis: AIAnalysis) => {
    const updated = memories.map(m => m.id === id ? { ...m, aiAnalysis: analysis } : m);
    setMemories(updated);
    // In real app, update DB here too
  };

  // --- Chat & Search ---
  const handleChatSubmit = async () => {
    if (!chatQuery.trim()) return;
    setIsChatting(true);
    try {
      const response = await askLifeCoach(chatQuery, memories, userConfigs, activeModelId);
      setChatResponse(response);
      
      // Generate graph for context
      if (showGraph) {
          const data = await generateGraphData(memories, userConfigs, activeModelId);
          setGraphData(data);
      }
    } catch (e) {
      console.error(e);
      setChatResponse("Error connecting to LifeLog AI.");
    } finally {
      setIsChatting(false);
    }
  };

  // Handle parsing AI citations [[ID:123]]
  const renderChatResponse = () => {
    const parts = chatResponse.split(/(\[\[ID:.*?\]\])/);
    return parts.map((part, i) => {
      const match = part.match(/\[\[ID:(.*?)\]\]/);
      if (match) {
        const id = match[1];
        return (
          <button 
            key={i} 
            onClick={() => {
                setSelectedMemoryId(id);
                navigateTo('memory-detail');
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold hover:bg-blue-200 transition-colors"
          >
            <ICONS.Link size={10} /> View Memory
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // --- Renderers ---

  const getMediaIcon = (type: MediaType, active: boolean) => {
     const colorClass = active ? 'text-white' : 'text-gray-400';
     switch(type) {
         case MediaType.TEXT: return <ICONS.Type size={18} className={colorClass} />;
         case MediaType.IMAGE: return <ICONS.Image size={18} className={colorClass} />;
         case MediaType.AUDIO: return <ICONS.Mic size={18} className={colorClass} />;
         case MediaType.VIDEO: return <ICONS.Video size={18} className={colorClass} />;
     }
  };

  // Compose Modal
  const renderCompose = () => {
     if (!isComposeOpen) return null;
     return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="w-full max-w-lg bg-[#F5F5F7] sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl h-[90vh] sm:h-[800px] flex flex-col overflow-hidden">
               
               {/* Header */}
               <div className="flex items-center justify-between px-6 py-5 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
                   <button onClick={() => setIsComposeOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                       <ICONS.X size={20} className="text-gray-600" />
                   </button>
                   <h2 className="text-base font-bold text-gray-900">{t.newMemory}</h2>
                   <button 
                     onClick={handleSaveMemory} 
                     className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-full shadow-lg shadow-gray-200 hover:bg-black hover:scale-105 transition-all"
                   >
                       {t.save}
                   </button>
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                   {/* Tabs */}
                   <div className="flex justify-center gap-2 mb-8">
                      {[MediaType.TEXT, MediaType.IMAGE, MediaType.AUDIO, MediaType.VIDEO].map(type => {
                          const isActive = composeType === type;
                          return (
                              <button
                                key={type}
                                onClick={() => setComposeType(type)}
                                className={`
                                    flex items-center justify-center w-14 h-10 rounded-full transition-all duration-300
                                    ${isActive ? 'bg-gray-900 shadow-md scale-110' : 'bg-white border border-gray-100 hover:bg-gray-50'}
                                `}
                              >
                                  {getMediaIcon(type, isActive)}
                              </button>
                          );
                      })}
                   </div>

                   {/* Media Area */}
                   {composeType !== MediaType.TEXT && (
                       <div className="mb-6 animate-slide-up">
                           <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200 min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-400 transition-colors cursor-pointer">
                               {mediaBlob ? (
                                   <>
                                     {composeType === MediaType.IMAGE && <img src={URL.createObjectURL(mediaBlob)} className="w-full h-full object-cover" />}
                                     {composeType === MediaType.VIDEO && <video src={URL.createObjectURL(mediaBlob)} controls className="w-full h-full object-cover" />}
                                     {composeType === MediaType.AUDIO && <div className="p-4 bg-gray-100 rounded-full"><ICONS.Speaker size={32}/></div>}
                                     <button onClick={() => setMediaBlob(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 backdrop-blur-sm">
                                         <ICONS.Trash2 size={16} />
                                     </button>
                                   </>
                               ) : (
                                   <div className="text-center p-8">
                                       <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors">
                                           {composeType === MediaType.IMAGE && <ICONS.Image size={32} />}
                                           {composeType === MediaType.VIDEO && <ICONS.Video size={32} />}
                                           {composeType === MediaType.AUDIO && <ICONS.Mic size={32} />}
                                       </div>
                                       <p className="text-sm text-gray-400 font-medium">Tap to upload or record</p>
                                       <input 
                                          type="file" 
                                          accept={composeType === MediaType.IMAGE ? "image/*" : composeType === MediaType.VIDEO ? "video/*" : "audio/*"}
                                          className="absolute inset-0 opacity-0 cursor-pointer"
                                          onChange={(e) => {
                                              if (e.target.files?.[0]) setMediaBlob(e.target.files[0]);
                                          }}
                                       />
                                   </div>
                               )}
                           </div>
                       </div>
                   )}

                   {/* Text Input (Always Visible) */}
                   <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-1 animate-slide-up">
                       <div className="bg-gray-50/50 rounded-[1.8rem] p-5">
                           <div className="flex items-center gap-2 mb-3 opacity-50">
                               <ICONS.Edit size={12} />
                               <span className="text-[10px] font-bold tracking-widest uppercase">Note</span>
                           </div>
                           <textarea
                               value={composeText}
                               onChange={(e) => setComposeText(e.target.value)}
                               placeholder={t.composePlaceholder}
                               className="w-full bg-transparent border-none outline-none text-gray-800 text-lg placeholder:text-gray-300 min-h-[150px] resize-none leading-relaxed"
                           />
                       </div>
                   </div>
               </div>
           </div>
        </div>
     );
  };

  if (view === 'setup') {
      return <SetupScreen language={language} onComplete={() => setView('auth')} />;
  }

  if (view === 'auth') {
      return <AuthScreen language={language} onLogin={() => setView('timeline')} />;
  }

  if (view === 'settings') {
    return (
        <SettingsScreen 
          profile={profile}
          onUpdateProfile={setProfile}
          userConfigs={userConfigs}
          onUpdateConfig={(cfg) => {
              const existing = userConfigs.findIndex(c => c.modelId === cfg.modelId);
              if (existing >= 0) {
                  const next = [...userConfigs];
                  next[existing] = cfg;
                  setUserConfigs(next);
              } else {
                  setUserConfigs([...userConfigs, cfg]);
              }
          }}
          activeModelId={activeModelId}
          onSetActiveModel={setActiveModelId}
          onLogout={() => {
              supabaseLogout();
              setView('auth');
          }}
          onBack={goBack}
        />
    );
  }

  return (
    <div className="h-screen w-full bg-[#F5F5F7] overflow-hidden flex flex-col relative">
      {/* Render Compose Modal */}
      {renderCompose()}

      {/* Top Bar */}
      <header className="px-6 pt-12 pb-4 bg-white/80 backdrop-blur-md z-10 flex justify-between items-end sticky top-0 border-b border-gray-200/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
             {view === 'memory-detail' && (
                 <button onClick={goBack} className="text-gray-400 hover:text-gray-900 mr-2">
                    <ICONS.ChevronLeft size={24} />
                 </button>
             )}
             {view === 'chat' ? t.chatMode : view === 'memory-detail' ? t.memoryDetail : t.timelineTitle}
          </h1>
        </div>
        
        <div className="flex gap-3">
           {view === 'timeline' && (
             <>
                <button 
                  onClick={() => setView('chat')} 
                  className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-purple-600 hover:scale-105 transition-all"
                >
                  <ICONS.Sparkles size={20} />
                </button>
                <button 
                  onClick={() => setView('settings')} 
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform"
                >
                  <img src={profile.avatar} alt="User" className="w-full h-full object-cover" />
                </button>
             </>
           )}
           {view === 'chat' && (
             <button onClick={() => setView('timeline')} className="p-2 text-gray-500 hover:text-gray-900">
                <ICONS.X size={24} />
             </button>
           )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {view === 'timeline' && (
          <div className="px-4 py-6 max-w-2xl mx-auto">
            {memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                <ICONS.Calendar size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-400 font-medium">{t.timelineEmpty}</p>
              </div>
            ) : (
              memories.map(memory => (
                <MemoryCard 
                  key={memory.id} 
                  memory={memory}
                  onAnalyzeUpdate={handleAnalyzeUpdate}
                  onDelete={handleDeleteMemory}
                  userConfigs={userConfigs}
                  activeModelId={activeModelId}
                  language={language}
                />
              ))
            )}
          </div>
        )}

        {view === 'memory-detail' && selectedMemoryId && (
            <div className="px-4 py-6 max-w-2xl mx-auto animate-slide-up">
                {memories.filter(m => m.id === selectedMemoryId).map(m => (
                    <MemoryCard 
                        key={m.id} 
                        memory={m} 
                        onAnalyzeUpdate={handleAnalyzeUpdate} 
                        onDelete={handleDeleteMemory}
                        highlight={true}
                        userConfigs={userConfigs}
                        activeModelId={activeModelId}
                        language={language}
                    />
                ))}
            </div>
        )}

        {view === 'chat' && (
          <div className="px-4 py-6 max-w-2xl mx-auto h-full flex flex-col">
             <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {!chatResponse && !isChatting && (
                    <div className="text-center mt-20">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-3xl mx-auto mb-6 shadow-lg shadow-purple-200 flex items-center justify-center">
                            <ICONS.Sparkles className="text-white" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">LifeLog AI Coach</h3>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto">{t.chatPlaceholder}</p>
                    </div>
                )}

                {/* Knowledge Graph Toggle */}
                {chatResponse && (
                    <div className="flex justify-end mb-2">
                        <button 
                            onClick={() => setShowGraph(!showGraph)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${showGraph ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                        >
                            <ICONS.Network size={12} /> {t.graphMode}
                        </button>
                    </div>
                )}

                {showGraph && graphData && (
                    <div className="mb-6">
                        <NetworkGraph data={graphData} onNodeClick={(id) => {
                            setSelectedMemoryId(id);
                            navigateTo('memory-detail');
                        }}/>
                    </div>
                )}

                {chatResponse && (
                    <div className="bg-white rounded-[2rem] rounded-tl-none p-6 shadow-sm border border-gray-100 animate-fade-in">
                       <p className="text-gray-800 leading-relaxed text-sm">
                         {renderChatResponse()}
                       </p>
                    </div>
                )}

                {isChatting && (
                    <div className="flex gap-2 items-center text-gray-400 text-sm pl-4 animate-pulse">
                        <ICONS.Cpu size={16} />
                        <span>Connecting memories...</span>
                    </div>
                )}
             </div>

             <div className="sticky bottom-0 bg-[#F5F5F7] pt-2">
                <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 p-2 flex items-center gap-2">
                    <input 
                      value={chatQuery}
                      onChange={(e) => setChatQuery(e.target.value)}
                      placeholder={t.chatPlaceholder}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                      className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-gray-800"
                    />
                    <button 
                      onClick={handleChatSubmit}
                      disabled={isChatting || !chatQuery.trim()}
                      className="p-3 bg-gray-900 text-white rounded-full hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                    >
                        <ICONS.Send size={18} />
                    </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {view === 'timeline' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
          <button 
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center justify-center w-16 h-16 bg-gray-900 text-white rounded-full shadow-2xl hover:scale-110 hover:rotate-90 transition-all duration-300"
          >
            <ICONS.Plus size={28} />
          </button>
        </div>
      )}
    </div>
  );
}

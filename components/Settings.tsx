
import React, { useState, useRef } from 'react';
import { ICONS, SUPPORTED_MODELS, TEXTS } from '../constants';
import { UserProfile, UserModelConfig } from '../types';

interface SettingsProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  userConfigs: UserModelConfig[];
  onUpdateConfig: (c: UserModelConfig) => void;
  activeModelId: string;
  onSetActiveModel: (id: string) => void;
  onLogout: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsProps> = ({
  profile,
  onUpdateProfile,
  userConfigs,
  onUpdateConfig,
  activeModelId,
  onSetActiveModel,
  onLogout,
  onBack
}) => {
  const t = TEXTS[profile.language];
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         onUpdateProfile({ ...profile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    onUpdateProfile({ ...profile, name: tempName });
    setIsEditingProfile(false);
  };

  const toggleLanguage = () => {
      onUpdateProfile({ ...profile, language: profile.language === 'zh' ? 'en' : 'zh' });
  };

  return (
    <div className="h-full flex flex-col animate-fade-in bg-gray-50">
      {/* Header */}
      <div className="px-6 py-6 flex items-center gap-3 sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 border-b border-gray-200/50">
         <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200 transition-colors">
            <ICONS.ChevronLeft size={24} />
         </button>
         <h2 className="text-xl font-bold">{t.settingsTitle}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-8 no-scrollbar">
        
        {/* Profile Section */}
        <section>
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">{t.profile}</h3>
           <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                 </div>
                 <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ICONS.Edit size={16} className="text-white" />
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </div>
              
              <div className="flex-1">
                 {isEditingProfile ? (
                    <div className="flex items-center gap-2">
                        <input 
                           value={tempName} 
                           onChange={(e) => setTempName(e.target.value)}
                           className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button onClick={saveProfile} className="p-1 bg-green-500 text-white rounded-md"><ICONS.Check size={14}/></button>
                    </div>
                 ) : (
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{profile.name}</h3>
                            <p className="text-xs text-gray-500">LifeLog ID: 882910</p>
                        </div>
                        <button onClick={() => setIsEditingProfile(true)} className="text-gray-400 hover:text-blue-500">
                            <ICONS.Edit size={16} />
                        </button>
                    </div>
                 )}
              </div>
           </div>
        </section>

        {/* Language Section */}
        <section>
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">{t.language}</h3>
             <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                     <ICONS.Globe size={18} className="text-gray-500"/>
                     <span className="text-sm font-semibold">{profile.language === 'zh' ? '中文' : 'English'}</span>
                 </div>
                 <button onClick={toggleLanguage} className="relative w-12 h-7 bg-gray-200 rounded-full p-1 transition-colors duration-300 data-[state=en]:bg-blue-500" data-state={profile.language}>
                     <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${profile.language === 'en' ? 'translate-x-5' : ''}`} />
                 </button>
             </div>
        </section>

        {/* Models Section */}
        <section>
           <div className="flex items-center justify-between mb-3 ml-1">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.aiModels}</h3>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Active: {SUPPORTED_MODELS.find(m => m.id === activeModelId)?.name}</span>
           </div>
           
           <div className="space-y-3">
              {SUPPORTED_MODELS.map(model => {
                 const config = userConfigs.find(c => c.modelId === model.id);
                 const hasKey = !!config?.apiKey || (model.provider === 'Google' && !!process.env.API_KEY);
                 const isActive = activeModelId === model.id;
                 
                 return (
                    <div key={model.id} className={`bg-white rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md ${isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}>
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                             <span className="font-semibold text-sm">{model.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="flex gap-1 mr-2">
                                {model.capabilities.includes('text') && <ICONS.Type size={12} className="text-gray-400" />}
                                {model.capabilities.includes('image') && <ICONS.Image size={12} className="text-blue-400" />}
                                {model.capabilities.includes('audio') && <ICONS.Speaker size={12} className="text-green-400" />}
                                {model.capabilities.includes('video') && <ICONS.Eye size={12} className="text-purple-400" />}
                             </div>
                             
                             {isActive ? (
                                <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                    <ICONS.Check size={10} /> {t.currentActive}
                                </span>
                             ) : (
                                <button 
                                    onClick={() => onSetActiveModel(model.id)}
                                    className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                    {t.setActive}
                                </button>
                             )}
                          </div>
                       </div>
                       <p className="text-[10px] text-gray-400 mb-3">{model.description}</p>
                       
                       <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                          <ICONS.Lock size={12} className="text-gray-400" />
                          <input 
                             type="password"
                             placeholder={model.provider === 'Google' ? 'Env Variable / Custom Key' : 'API Key'}
                             value={config?.apiKey || ''}
                             onChange={(e) => onUpdateConfig({ 
                                 modelId: model.id, 
                                 apiKey: e.target.value 
                             })}
                             className="bg-transparent border-none focus:ring-0 w-full text-xs text-gray-600 placeholder:text-gray-300"
                          />
                       </div>
                    </div>
                 );
              })}
           </div>
        </section>

        <button 
          onClick={onLogout} 
          className="w-full py-3 mt-4 bg-white text-red-500 text-sm font-medium rounded-2xl shadow-sm border border-gray-100 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <ICONS.LogOut size={16} />
          {t.logout}
        </button>
      </div>
    </div>
  );
};

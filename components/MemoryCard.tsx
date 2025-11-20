
import React, { useState } from 'react';
import { Memory, MediaType, UserModelConfig, Language } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { ICONS, TEXTS } from '../constants';
import { analyzeMemory } from '../services/geminiService';

interface MemoryCardProps {
  memory: Memory;
  onAnalyzeUpdate: (id: string, analysis: any) => void;
  onDelete: (id: string) => void;
  highlight?: boolean;
  userConfigs: UserModelConfig[];
  activeModelId: string;
  language: Language;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ 
  memory, 
  onAnalyzeUpdate, 
  onDelete, 
  highlight, 
  userConfigs,
  activeModelId,
  language 
}) => {
  const t = TEXTS[language];
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(memory.aiAnalysis?.summary || '');
  
  const [mediaUrl] = useState(
    memory.mediaBlob 
      ? URL.createObjectURL(memory.mediaBlob) 
      : undefined
  );

  const date = new Date(memory.createdAt);
  const dateStr = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeMemory(memory, activeModelId, userConfigs, language);
      onAnalyzeUpdate(memory.id, analysis);
      setEditedSummary(analysis.summary);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Analysis failed. Check API Key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveEdit = () => {
    if (memory.aiAnalysis) {
        const updatedAnalysis = { ...memory.aiAnalysis, summary: editedSummary };
        onAnalyzeUpdate(memory.id, updatedAnalysis);
    }
    setIsEditing(false);
  };

  return (
    <div 
      id={`memory-${memory.id}`}
      className={`
        bg-white rounded-3xl p-6 shadow-sm border mb-6 transition-all duration-500 group break-inside-avoid relative
        ${highlight ? 'ring-4 ring-blue-200 border-blue-500 shadow-lg scale-[1.02]' : 'border-gray-100 hover:shadow-md'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">{dateStr}</span>
          <span className="text-xs text-gray-400">{timeStr}</span>
        </div>
        <div className="flex gap-2">
           {memory.aiAnalysis && (
             <span 
               className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
               style={{ backgroundColor: `${memory.aiAnalysis.color}30`, color: memory.aiAnalysis.color }}
             >
               {memory.aiAnalysis.mood}
             </span>
           )}
           <button onClick={() => onDelete(memory.id)} className="text-gray-300 hover:text-red-500 transition-colors">
             <ICONS.Trash2 size={16} />
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {memory.content && (
          <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap font-normal">
            {memory.content}
          </p>
        )}

        {memory.mediaType === MediaType.IMAGE && mediaUrl && (
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <img src={mediaUrl} alt="Memory" className="w-full h-auto object-cover" loading="lazy" />
          </div>
        )}

        {memory.mediaType === MediaType.AUDIO && memory.mediaBlob && (
          <AudioPlayer blob={memory.mediaBlob} />
        )}

        {memory.mediaType === MediaType.VIDEO && mediaUrl && (
          <div className="rounded-2xl overflow-hidden bg-black w-full aspect-video relative shadow-inner">
             <video src={mediaUrl} controls className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* AI Section */}
      <div className="mt-5 pt-4 border-t border-dashed border-gray-100">
        {memory.aiAnalysis ? (
          <div className="bg-gray-50 rounded-2xl p-4 relative group/ai">
             {/* Tools for AI Box */}
             <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2 text-purple-600">
                    <ICONS.Sparkles size={14} />
                    <span className="text-xs font-semibold">{t.aiInsight}</span>
                 </div>
                 {!isEditing && (
                    <div className="flex gap-1 opacity-0 group-hover/ai:opacity-100 transition-opacity">
                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="p-1 text-gray-400 hover:text-blue-500" title={t.regenerate}>
                            <ICONS.Refresh size={14} className={isAnalyzing ? 'animate-spin' : ''}/>
                        </button>
                        <button onClick={() => { setIsEditing(true); setEditedSummary(memory.aiAnalysis?.summary || ''); }} className="p-1 text-gray-400 hover:text-blue-500" title={t.edit}>
                            <ICONS.Edit size={14} />
                        </button>
                    </div>
                 )}
             </div>

             {isEditing ? (
                 <div className="space-y-2">
                     <textarea 
                        className="w-full text-sm p-2 border rounded-lg text-gray-600 bg-white focus:ring-2 focus:ring-purple-200 outline-none"
                        rows={3}
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                     />
                     <div className="flex justify-end gap-2">
                         <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:text-gray-800">{t.cancel}</button>
                         <button onClick={handleSaveEdit} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700">{t.saveEdit}</button>
                     </div>
                 </div>
             ) : (
                 <p className="text-sm text-gray-600 italic font-serif">"{memory.aiAnalysis.summary}"</p>
             )}
             
             <div className="flex flex-wrap gap-2 mt-3">
                {memory.aiAnalysis.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                    #{tag}
                  </span>
                ))}
             </div>
             <div className="mt-2 text-[10px] text-gray-300 text-right">
                 Model: {memory.aiAnalysis.analyzedByModel || 'Gemini'}
             </div>
          </div>
        ) : (
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-purple-600 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
               <span className="animate-pulse">{t.analyzing}</span>
            ) : (
              <>
                <ICONS.Sparkles size={16} />
                <span>{t.analyzeButton}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

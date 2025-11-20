import React, { useEffect, useState } from 'react';
import { GraphData } from '../types';

interface NetworkGraphProps {
  data: GraphData;
  onNodeClick: (id: string) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ data, onNodeClick }) => {
  // A very simple force-directed-like layout simulator
  const [nodes, setNodes] = useState<any[]>([]);

  useEffect(() => {
    // Randomize initial positions in a circle
    const width = 300;
    const height = 300;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const newNodes = data.nodes.map((node, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const radius = 100; // Distance from center
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
    setNodes(newNodes);
  }, [data]);

  return (
    <div className="w-full h-80 bg-gray-900 rounded-3xl overflow-hidden relative shadow-inner border border-gray-700 flex items-center justify-center">
        {nodes.length === 0 ? (
            <p className="text-gray-500 text-xs">数据不足，无法构建星图</p>
        ) : (
            <svg width="100%" height="100%" viewBox="0 0 300 300" className="animate-fade-in">
                {/* Links */}
                {data.links.map((link, i) => {
                    const source = nodes.find(n => n.id === link.source);
                    const target = nodes.find(n => n.id === link.target);
                    if (!source || !target) return null;
                    return (
                        <g key={i}>
                            <line 
                                x1={source.x} y1={source.y} 
                                x2={target.x} y2={target.y} 
                                stroke="#4B5563" 
                                strokeWidth="1" 
                                opacity="0.6" 
                            />
                        </g>
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => (
                    <g 
                        key={node.id} 
                        onClick={() => onNodeClick(node.id)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <circle 
                            cx={node.x} cy={node.y} 
                            r={node.val ? node.val * 3 : 6} 
                            fill={getNodeColor(node.group)} 
                            stroke="white" strokeWidth="1.5"
                        />
                        <text 
                            x={node.x} y={node.y + 15} 
                            textAnchor="middle" 
                            fill="white" 
                            fontSize="8" 
                            fontWeight="bold"
                            className="pointer-events-none shadow-black drop-shadow-md"
                        >
                            {node.label.substring(0, 6)}
                        </text>
                    </g>
                ))}
            </svg>
        )}
        <div className="absolute bottom-3 right-3 flex gap-2">
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[8px] text-gray-400">Joy</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-[8px] text-gray-400">Idea</span>
            </div>
        </div>
    </div>
  );
};

const getNodeColor = (group: string) => {
    const colors: Record<string, string> = {
        'Joyful': '#3B82F6',
        'Sad': '#6B7280',
        'Creative': '#8B5CF6',
        'Work': '#10B981',
        'Life': '#F59E0B'
    };
    return colors[group] || '#EC4899';
}
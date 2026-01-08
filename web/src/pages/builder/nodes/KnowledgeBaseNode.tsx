import React, { useRef, useState } from 'react';
import { Handle, Position, useReactFlow, Node } from 'reactflow';
import { Database, Upload, Trash2, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config';
import NodeHeader from './NodeHeader';

const KnowledgeBaseNode = ({ id, data, selected }: { id: string; data: any; selected: boolean }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { setNodes } = useReactFlow();

    const updateData = (key: string, value: any) => {
        setNodes((nds: Node[]) =>
            nds.map((node: Node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            [key]: value,
                        },
                    };
                }
                return node;
            })
        );
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(API_ENDPOINTS.UPLOAD, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();

            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                file: {
                                    name: result.filename,
                                    id: result.id,
                                    path: result.file_path
                                }
                            }
                        };
                    }
                    return node;
                })
            );
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            file: null
                        }
                    };
                }
                return node;
            })
        );
    };

    return (
        <div className={`w-[280px] bg-white rounded-xl shadow-card border transition-all ${selected ? 'border-primary ring-1 ring-primary' : 'border-border-color'}`}>
            <NodeHeader
                id={id}
                title="Knowledge Base"
                icon={
                    <div className="w-6 h-6 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-600">
                        <Database size={14} />
                    </div>
                }
            />

            {/* Content */}
            <div className="p-4 space-y-4">
                <div className="text-xs text-gray-500">
                    Let LLM search info in your file
                </div>

                {/* File Upload */}
                <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">File for Knowledge Base</label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.txt,.md"
                    />

                    {data.file ? (
                        <div className="flex items-center justify-between p-2 border border-green-200 bg-green-50 rounded text-green-700 text-xs">
                            <span className="truncate max-w-[180px]" title={data.file.name}>{data.file.name}</span>
                            <button onClick={handleRemoveFile} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={handleFileClick}
                            className={`border border-dashed border-green-300 bg-green-50/50 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {isUploading ? (
                                <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" />
                                    Uploading...
                                </span>
                            ) : (
                                <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                                    <Upload size={12} />
                                    Upload File
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Embedding Model */}
                <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Embedding Model</label>
                    <select
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary text-gray-700"
                        value={data.embeddingModel || 'text-embedding-3-small'}
                        onChange={(e) => updateData('embeddingModel', e.target.value)}
                    >
                        <option>text-embedding-3-large</option>
                        <option>text-embedding-3-small</option>
                    </select>
                </div>

                {/* API Key */}
                <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">API Key</label>
                    <input
                        type="password"
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary text-gray-700"
                        placeholder="******************"
                        value={data.apiKey || ''}
                        onChange={(e) => updateData('apiKey', e.target.value)}
                    />
                </div>
            </div>

            {/* Handles */}
            <div className="absolute -left-3 top-2/3 flex items-center" style={{ top: '60%' }}>
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!bg-orange-400 !w-3 !h-3 !border-2 !border-white !opacity-100"
                />
                <span className="ml-2 text-[10px] font-medium text-gray-500 bg-transparent relative z-10 pointer-events-none">Query</span>
            </div>

            <div className="absolute -right-3 top-2/3 flex items-center" style={{ top: '60%' }}>
                <span className="mr-2 text-[10px] font-medium text-gray-500 bg-transparent relative z-10 pointer-events-none">Context</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!bg-orange-400 !w-3 !h-3 !border-2 !border-white !opacity-100"
                />
            </div>
        </div>
    );
};

export default KnowledgeBaseNode;

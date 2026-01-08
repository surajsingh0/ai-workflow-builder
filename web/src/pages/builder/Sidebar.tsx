import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Database, BrainCircuit, MessageCircle, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
    const navigate = useNavigate();

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside
            className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-border-color flex-shrink-0 flex flex-col h-full transition-all duration-300 relative group/sidebar`}
        >
            <div className={`p-4 flex flex-col gap-4`}>
                <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : ''}`}>
                    {!isCollapsed && <h1 className="font-bold text-lg text-gray-800 tracking-tight">Workflow</h1>}
                    <button
                        onClick={toggleSidebar}
                        className={`p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-opacity ${isCollapsed ? 'absolute -right-3 top-6 bg-white border shadow-sm z-50' : ''}`}
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {!isCollapsed ? (
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg px-3 py-2 flex items-center justify-between group transition-colors shadow-sm"
                    >
                        <span className="text-sm font-medium">← Back to Dashboard</span>
                        <MessageSquare size={14} className="text-gray-400 group-hover:text-gray-600" />
                    </button>
                ) : (
                    <div className="flex justify-center" title="Back to Dashboard">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg"
                        >
                            <MessageSquare size={16} className="text-gray-500" />
                        </button>
                    </div>
                )}

                {!isCollapsed && <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">Components</h2>}
            </div>

            <div className={`space-y-3 ${isCollapsed ? 'px-2' : 'px-4'}`}>

                {/* User Query */}
                <div
                    className={`p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-primary hover:shadow-sm transition-all flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} group`}
                    onDragStart={(event) => onDragStart(event, 'userQuery')}
                    draggable
                    title="Input"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-gray-500">
                            <MessageSquare size={16} />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium text-gray-700">Input</span>}
                    </div>
                    {!isCollapsed && (
                        <div className="text-gray-300 group-hover:text-primary">
                            <GripVertical size={14} />
                        </div>
                    )}
                </div>

                {/* LLM Engine */}
                <div
                    className={`p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-primary hover:shadow-sm transition-all flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} group`}
                    onDragStart={(event) => onDragStart(event, 'llmEngine')}
                    draggable
                    title="LLM (OpenAI)"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-gray-500">
                            <BrainCircuit size={16} />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium text-gray-700">LLM (OpenAI)</span>}
                    </div>
                    {!isCollapsed && (
                        <div className="text-gray-300 group-hover:text-primary">
                            <GripVertical size={14} />
                        </div>
                    )}
                </div>

                {/* Knowledge Base */}
                <div
                    className={`p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-primary hover:shadow-sm transition-all flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} group`}
                    onDragStart={(event) => onDragStart(event, 'knowledgeBase')}
                    draggable
                    title="Knowledge Base"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-gray-500">
                            <Database size={16} />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium text-gray-700">Knowledge Base</span>}
                    </div>
                    {!isCollapsed && (
                        <div className="text-gray-300 group-hover:text-primary">
                            <GripVertical size={14} />
                        </div>
                    )}
                </div>

                {/* Output */}
                <div
                    className={`p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-primary hover:shadow-sm transition-all flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} group`}
                    onDragStart={(event) => onDragStart(event, 'output')}
                    draggable
                    title="Output"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-gray-500">
                            <MessageCircle size={16} />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium text-gray-700">Output</span>}
                    </div>
                    {!isCollapsed && (
                        <div className="text-gray-300 group-hover:text-primary">
                            <GripVertical size={14} />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

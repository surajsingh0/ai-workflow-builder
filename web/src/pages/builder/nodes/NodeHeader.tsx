import { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { Settings, Trash2 } from 'lucide-react';

interface NodeHeaderProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    bgColor?: string; // e.g., 'bg-blue-50/50' for UserQueryNode
}

const NodeHeader = ({ id, title, icon, bgColor = 'bg-white' }: NodeHeaderProps) => {
    const { setNodes, setEdges } = useReactFlow();
    const [showMenu, setShowMenu] = useState(false);

    const deleteNode = () => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    };

    return (
        <div className={`flex items-center justify-between p-3 border-b border-border-color rounded-t-xl ${bgColor}`}>
            <div className="flex items-center gap-2">
                {icon}
                <span className="font-semibold text-sm text-gray-900">{title}</span>
            </div>
            <div className="relative">
                <div
                    className="text-gray-400 cursor-pointer hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                    onClick={() => setShowMenu(!showMenu)}
                >
                    <Settings size={14} />
                </div>
                {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
                        <button
                            onClick={deleteNode}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={12} />
                            Delete Node
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NodeHeader;

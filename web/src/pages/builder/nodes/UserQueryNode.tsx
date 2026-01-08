import { Handle, Position } from 'reactflow';
import { MessageSquare } from 'lucide-react';
import NodeHeader from './NodeHeader';

const UserQueryNode = ({ id, selected }: { id: string; selected: boolean }) => {
    return (
        <div className={`w-[280px] bg-white rounded-xl shadow-card border transition-all ${selected ? 'border-primary ring-1 ring-primary' : 'border-border-color'}`}>
            <NodeHeader
                id={id}
                title="User Input"
                icon={
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                        <MessageSquare size={14} />
                    </div>
                }
                bgColor="bg-blue-50/50"
            />

            <div className="p-4 bg-blue-50/30">
                <div className="mb-2">
                    <label className="text-xs font-medium text-gray-700 block mb-1">Enter point for querys</label>
                </div>
                <div className="bg-white border-2 border-primary/20 rounded-lg p-3">
                    <label className="text-xs font-semibold text-gray-900 block mb-1">User Query</label>
                    <div className="text-xs text-gray-400 italic">
                        Write your query here
                    </div>
                </div>
            </div>

            <div className="absolute -right-3 top-2/3 flex items-center" style={{ top: '75%' }}>
                <span className="mr-2 text-[10px] font-medium text-gray-500 bg-transparent relative z-10 pointer-events-none">Query</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!bg-amber-400 !w-3 !h-3 !border-2 !border-white !opacity-100"
                />
            </div>
        </div>
    );
};

export default UserQueryNode;

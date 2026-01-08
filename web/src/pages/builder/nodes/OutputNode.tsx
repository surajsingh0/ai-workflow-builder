import { Handle, Position } from 'reactflow';
import { MessageCircle } from 'lucide-react';
import NodeHeader from './NodeHeader';

const OutputNode = ({ id, selected }: { id: string; selected: boolean }) => {
    return (
        <div className={`w-[280px] bg-white rounded-xl shadow-card border transition-all ${selected ? 'border-primary ring-1 ring-primary' : 'border-border-color'}`}>
            <NodeHeader
                id={id}
                title="Output"
                icon={
                    <div className="w-6 h-6 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-600">
                        <MessageCircle size={14} />
                    </div>
                }
            />

            {/* Content */}
            <div className="p-4 space-y-4">
                <div className="text-xs text-gray-500">
                    Output of the result nodes as text
                </div>

                {/* Output Text */}
                <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Output Text</label>
                    <div className="w-full text-xs p-3 border border-border-color rounded-lg bg-gray-50 text-gray-400 h-16">
                        Output will be generated based on query
                    </div>
                </div>
            </div>

            {/* Input Handles */}
            <div className="absolute -left-3 top-[55%] flex items-center">
                <Handle
                    type="target"
                    id="output"
                    position={Position.Left}
                    className="!bg-green-500 !w-3 !h-3 !border-2 !border-white !opacity-100"
                />
                <span className="ml-2 text-[10px] font-medium text-gray-500 bg-transparent relative z-10 pointer-events-none">Output</span>
            </div>
        </div>
    );
};

export default OutputNode;

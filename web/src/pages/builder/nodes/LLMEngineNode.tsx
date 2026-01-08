import { Handle, Position, useReactFlow, Node } from 'reactflow';
import { BrainCircuit } from 'lucide-react';
import NodeHeader from './NodeHeader';

const LLMEngineNode = ({ id, data, selected }: { id: string; data: any; selected: boolean }) => {
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

    return (
        <div className={`w-[280px] bg-white rounded-xl shadow-card border transition-all ${selected ? 'border-primary ring-1 ring-primary' : 'border-border-color'}`}>
            <NodeHeader
                id={id}
                title="LLM (OpenAI)"
                icon={
                    <div className="w-6 h-6 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-600">
                        <BrainCircuit size={14} />
                    </div>
                }
            />

            {/* Content */}
            <div className="p-4 space-y-4">
                <div className="text-xs text-gray-500">
                    Run a query with OpenAI LLM
                </div>

                {/* Model */}
                <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Model</label>
                    <select
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary text-gray-700"
                        value={data.model || 'google/gemini-2.0-flash-exp:free'}
                        onChange={(e) => updateData('model', e.target.value)}
                    >
                        <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
                        <option value="google/gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                        <option value="openai/gpt-5.2-pro">GPT-5.2 Pro</option>
                        <option value="deepseek/deepseek-r1">DeepSeek R1</option>
                        <option value="deepseek/deepseek-v3">DeepSeek V3</option>
                        <option value="minimax/minimax-m2">Minimax M2</option>
                        <option value="qwen/qwen3-coder">Qwen 3 Coder</option>
                        <option value="moonshotai/kimi-k2-thinking">Kimi K2 Thinking</option>
                        <option value="anthropic/claude-opus-4-5">Claude Opus 4.5</option>
                        <option value="01-ai/yi-large-turbo">Yi Large Turbo</option>
                    </select>
                </div>

                {/* API Key */}
                <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">OpenRouter API Key</label>
                    <input
                        type="password"
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary text-gray-700"
                        placeholder="******************"
                        value={data.apiKey || ''}
                        onChange={(e) => updateData('apiKey', e.target.value)}
                    />
                </div>

                {/* Prompt */}
                <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Prompt</label>
                    <textarea
                        className="w-full text-xs p-2 border border-border-color rounded-lg bg-gray-50 text-gray-700 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                        value={data.prompt !== undefined ? data.prompt : "You are a helpful PDF assistant. Use web search if the PDF lacks context."}
                        onChange={(e) => updateData('prompt', e.target.value)}
                    />
                    <div className="mt-2 flex flex-col gap-1">
                        <div className="text-[10px] text-blue-500 font-medium">CONTEXT: {'{context}'}</div>
                        <div className="text-[10px] text-blue-500 font-medium">User Query: {'{query}'}</div>
                    </div>
                </div>

                {/* Temperature */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-700">Temperature</label>
                    </div>
                    <input
                        type="number"
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary text-gray-700"
                        value={data.temperature !== undefined ? data.temperature : 0.75}
                        onChange={(e) => updateData('temperature', parseFloat(e.target.value))}
                    />
                </div>

                {/* Web Search Toggle */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        WebSearch Tool
                    </span>
                    <div
                        className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${data.useWebSearch ? 'bg-green-500' : 'bg-gray-300'}`}
                        onClick={() => updateData('useWebSearch', !data.useWebSearch)}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${data.useWebSearch ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                </div>

                {/* SERP API */}
                {data.useWebSearch && (
                    <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">SERP API</label>
                        <input
                            type="password"
                            className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary text-gray-700"
                            placeholder="******************"
                            value={data.serpApiKey || ''}
                            onChange={(e) => updateData('serpApiKey', e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Input Handles */}
            <div className="absolute -left-3 top-[55%] flex items-center">
                <Handle
                    type="target"
                    id="context"
                    position={Position.Left}
                    className="!bg-purple-500 !w-3 !h-3 !border-2 !border-white !opacity-100"
                />
            </div>

            <div className="absolute -left-3 top-[60%] flex items-center" style={{ top: '62%' }}>
                <Handle
                    type="target"
                    id="query"
                    position={Position.Left}
                    className="!bg-purple-500 !w-3 !h-3 !border-2 !border-white !opacity-100"
                />
            </div>

            {/* Output Handles */}
            <div className="absolute -right-3 top-3/4 flex items-center" style={{ top: '85%' }}>
                <span className="mr-2 text-[10px] font-medium text-gray-500 bg-transparent relative z-10 pointer-events-none">Output</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!bg-purple-500 !w-3 !h-3 !border-2 !border-white !opacity-100"
                />
            </div>
        </div>
    );
};

export default LLMEngineNode;

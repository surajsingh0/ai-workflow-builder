import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    MiniMap,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    useReactFlow,
    useViewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from './Sidebar';
import ChatModal from '../../components/ChatModal';
import { nodeTypes } from './nodes';
import { Minus, Plus, Maximize, Play, MessageCircle, Map as MapIcon, ChevronDown, MousePointerClick } from 'lucide-react';
import { API_ENDPOINTS } from '../../config';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const WorkflowControls = ({ showMinimap, setShowMinimap }: { showMinimap: boolean; setShowMinimap: (v: boolean) => void }) => {
    const { zoomIn, zoomOut, fitView, setViewport, getViewport } = useReactFlow();
    const { zoom } = useViewport();
    const [showZoomMenu, setShowZoomMenu] = useState(false);

    const handleZoomSelect = (percent: number) => {
        const { x, y } = getViewport();
        setViewport({ x, y, zoom: percent / 100 });
        setShowZoomMenu(false);
    };

    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-md shadow-sm border border-gray-200 p-1 flex items-center gap-1 z-10 transition-all">
            <button
                onClick={() => setShowMinimap(!showMinimap)}
                className={`p-1.5 rounded transition-colors ${showMinimap ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-500'}`}
                title="Toggle Minimap"
            >
                <MapIcon size={14} />
            </button>
            <div className="w-[1px] h-3 bg-gray-200 mx-0.5"></div>

            <button onClick={() => zoomOut()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                <Minus size={14} />
            </button>

            <div className="relative group mx-1">
                <button
                    onClick={() => setShowZoomMenu(!showZoomMenu)}
                    className="text-xs font-medium text-gray-700 min-w-[3.5rem] text-center hover:bg-gray-50 rounded py-1 flex items-center justify-center gap-1"
                >
                    {Math.round(zoom * 100)}%
                    <ChevronDown size={10} className="text-gray-400" />
                </button>

                {showZoomMenu && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-24 bg-white rounded-md shadow-lg border border-gray-100 py-1 flex flex-col z-20">
                        {[25, 50, 75, 100, 125, 150, 200].map((percent) => (
                            <button
                                key={percent}
                                onClick={() => handleZoomSelect(percent)}
                                className={`text-xs text-left px-3 py-1.5 hover:bg-gray-50 ${Math.round(zoom * 100) === percent ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'}`}
                            >
                                {percent}%
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button onClick={() => zoomIn()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                <Plus size={14} />
            </button>

            <div className="w-[1px] h-3 bg-gray-200 mx-0.5"></div>

            <button onClick={() => fitView()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                <Maximize size={14} />
            </button>
        </div>
    );
};

const WorkflowBuilder: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { project, toObject } = useReactFlow();
    const [showMinimap, setShowMinimap] = useState(false);
    const [showChat, setShowChat] = useState(false);

    // Saving state
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [validationSuccess, setValidationSuccess] = useState(false);

    // Workflow metadata (name/description from database)
    const [workflowName, setWorkflowName] = useState('My GenAI Stack');
    const [workflowDescription, setWorkflowDescription] = useState('Built with AI Workflow Builder');

    // Workflow Validation
    const validateWorkflow = useCallback((): { valid: boolean; error: string | null } => {
        // Check if there are any nodes
        if (nodes.length === 0) {
            return { valid: false, error: "Workflow is empty. Add at least one component." };
        }

        // Check for LLM Engine node (required)
        const hasLLMNode = nodes.some(node => node.type === 'llmEngine');
        if (!hasLLMNode) {
            return { valid: false, error: "Missing LLM Engine node. Add one to generate responses." };
        }

        // Check for Output node (optional but recommended)
        const hasOutputNode = nodes.some(node => node.type === 'output');
        if (!hasOutputNode) {
            console.warn("No Output node found. Results will still be shown in chat.");
        }

        // Check if LLM node has connections (at least one input)
        const llmNode = nodes.find(node => node.type === 'llmEngine');
        if (llmNode) {
            const hasInputConnection = edges.some(edge => edge.target === llmNode.id);
            if (!hasInputConnection && nodes.length > 1) {
                return { valid: false, error: "LLM Engine is not connected. Connect it to other nodes." };
            }
        }

        return { valid: true, error: null };
    }, [nodes, edges]);

    const handleChatClick = () => {
        const { valid, error } = validateWorkflow();
        if (!valid) {
            setValidationError(error);
            setTimeout(() => setValidationError(null), 4000);
            return;
        }
        setShowChat(true);
    };

    const handleBuildClick = () => {
        const { valid, error } = validateWorkflow();
        if (!valid) {
            setValidationError(error);
            setValidationSuccess(false);
            setTimeout(() => setValidationError(null), 4000);
        } else {
            setValidationSuccess(true);
            setValidationError(null);
            setTimeout(() => setValidationSuccess(false), 3000);
        }
    };

    useEffect(() => {
        const fetchWorkflow = async () => {
            if (!id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_ENDPOINTS.WORKFLOWS}/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch workflow');
                }
                const workflow = await response.json();

                // Store workflow metadata
                if (workflow.name) setWorkflowName(workflow.name);
                if (workflow.description) setWorkflowDescription(workflow.description);

                if (workflow.data) {
                    // Restore React Flow state
                    const { nodes: savedNodes = [], edges: savedEdges = [] } = workflow.data;
                    setNodes(savedNodes);
                    setEdges(savedEdges);
                }
            } catch (error) {
                console.error('Error loading workflow:', error);
                alert('Failed to load workflow data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkflow();
    }, [id, setNodes, setEdges]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const flow = toObject();
            const workflowData = {
                name: workflowName,
                description: workflowDescription,
                data: flow
            };

            let response;
            if (id) {
                // Update existing
                response = await fetch(`${API_ENDPOINTS.WORKFLOWS}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(workflowData),
                });
            } else {
                // Create new
                response = await fetch(API_ENDPOINTS.WORKFLOWS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(workflowData),
                });
            }

            if (!response.ok) {
                throw new Error('Failed to save workflow');
            }

            const savedWorkflow = await response.json();

            if (!id && savedWorkflow.id) {
                navigate(`/builder/${savedWorkflow.id}`, { replace: true });
            }

            alert('Workflow saved successfully!');
        } catch (error) {
            console.error('Error saving workflow:', error);
            alert('Failed to save workflow.');
        } finally {
            setIsSaving(false);
        }
    };

    const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowWrapper.current?.getBoundingClientRect();
            if (!position) return;

            const x = event.clientX - position.left;
            const y = event.clientY - position.top;

            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type,
                position: project({ x, y }),
                data: { label: `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [project, setNodes]
    );

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center bg-background">Loading workflow...</div>;
    }

    return (
        <div className="h-screen flex flex-col bg-background font-sans">
            <Header onSave={handleSave} isSaving={isSaving} />
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <Sidebar
                    isCollapsed={isLeftPanelCollapsed}
                    toggleSidebar={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                />

                {/* Canvas Area */}
                <div className="flex-1 h-full bg-gray-50 relative flex flex-col min-w-0">
                    <div className="flex-1 relative" ref={reactFlowWrapper}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            nodeTypes={nodeTypes}
                            fitView={nodes.length > 0}
                            fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
                            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                            attributionPosition="bottom-left"
                            zoomOnDoubleClick={false}
                            minZoom={0.1}
                            maxZoom={2}
                        >
                            <Background gap={12} size={1} />
                            {showMinimap && (
                                <MiniMap
                                    style={{ bottom: 80, right: 20 }}
                                    zoomable
                                    pannable
                                    className="!bg-white !border !border-gray-200 !rounded-lg !shadow-md"
                                />
                            )}
                            <WorkflowControls showMinimap={showMinimap} setShowMinimap={setShowMinimap} />
                        </ReactFlow>

                        {/* Empty State */}
                        {nodes.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center">
                                        <MousePointerClick size={28} className="text-green-500" strokeWidth={1.5} />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium">Drag & drop to get started</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Validation Error Toast */}
                    {validationError && (
                        <div className="absolute bottom-20 right-6 z-20 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                            ⚠️ {validationError}
                        </div>
                    )}

                    {/* Validation Success Toast */}
                    {validationSuccess && (
                        <div className="absolute bottom-20 right-6 z-20 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                            ✅ Workflow is valid and ready to run!
                        </div>
                    )}

                    {/* Chat / Run Actions - Positioned relative to the canvas */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-3 z-10">
                        <button
                            onClick={handleChatClick}
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-full shadow-sm border border-gray-200 transition-all hover:shadow-md font-medium text-xs"
                        >
                            <span className="font-semibold">Chat with Stack</span>
                            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <MessageCircle size={10} fill="currentColor" />
                            </div>
                        </button>

                        <button
                            onClick={handleBuildClick}
                            title="Validate Workflow"
                            className="w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md flex items-center justify-center transition-all hover:shadow-green-500/30 hover:scale-105 active:scale-95"
                        >
                            <Play size={16} fill="currentColor" className="ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Modal */}
            <ChatModal isOpen={showChat} onClose={() => setShowChat(false)} />
        </div>
    );
};

export default function WrappedWorkflowBuilder() {
    return (
        <ReactFlowProvider>
            <WorkflowBuilder />
        </ReactFlowProvider>
    )
}

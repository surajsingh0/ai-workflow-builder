import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Plus, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateStackModal from '../components/CreateStackModal';
import { API_ENDPOINTS } from '../config';

interface Stack {
    id: string;
    name: string;
    description: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stacks, setStacks] = useState<Stack[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStacks();
    }, []);

    const fetchStacks = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.WORKFLOWS);
            if (!response.ok) throw new Error('Failed to fetch stacks');
            const data = await response.json();
            // Backend returns list of workflows
            setStacks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateStack = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleCreate = async (name: string, description: string) => {
        try {
            const newStackData = {
                name,
                description,
                data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
            };

            const response = await fetch(API_ENDPOINTS.WORKFLOWS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStackData),
            });

            if (!response.ok) throw new Error('Failed to create stack');

            const createdStack = await response.json();

            // Navigate to builder with new ID
            navigate(`/builder/${createdStack.id}`);

            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating stack:', error);
            alert('Failed to create stack');
        }
    };

    const handleEditStack = (stackId: string) => {
        navigate(`/builder/${stackId}`);
    };

    const handleDeleteStack = async (e: React.MouseEvent, stackId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this stack?')) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.WORKFLOWS}/${stackId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete stack');

            // Remove from local state
            setStacks((prev) => prev.filter((stack) => stack.id !== stackId));
        } catch (error) {
            console.error('Error deleting stack:', error);
            alert('Failed to delete stack');
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <Header />

            <main className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Stacks</h1>
                    <button
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                        onClick={handleCreateStack}
                    >
                        <Plus size={18} />
                        <span>New Stack</span>
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : stacks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="bg-surface p-8 rounded-xl shadow-card max-w-md w-full text-center">
                            <h2 className="text-xl font-semibold mb-2 text-gray-900">Create New Stack</h2>
                            <p className="text-gray-600 mb-6">
                                Start building your generative AI apps with our essential tools and frameworks
                            </p>
                            <button
                                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                                onClick={handleCreateStack}
                            >
                                <Plus size={18} />
                                <span>New Stack</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {stacks.map((stack) => (
                            <div key={stack.id} className="group relative bg-surface p-6 rounded-xl shadow-card flex flex-col justify-between min-h-[160px] border border-transparent hover:border-gray-200 transition-all">
                                {/* Delete button - subtle, appears on hover */}
                                <button
                                    onClick={(e) => handleDeleteStack(e, stack.id)}
                                    className="absolute top-3 right-3 p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Stack"
                                >
                                    <Trash2 size={14} />
                                </button>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{stack.name}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-2">{stack.description}</p>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded px-3 py-1.5 transition-colors"
                                        onClick={() => handleEditStack(stack.id)}
                                    >
                                        <span>Edit Stack</span>
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <CreateStackModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onCreate={handleCreate}
            />
        </div>
    );
};

export default Dashboard;

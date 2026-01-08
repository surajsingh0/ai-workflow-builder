import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { API_ENDPOINTS } from '../config';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
}

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
    const { id: workflowId } = useParams();
    const { toObject } = useReactFlow();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isStreaming, setIsStreaming] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking, isStreaming]);

    const handleSend = async () => {
        if (!inputValue.trim() || isThinking || isStreaming) return;

        const userQuery = inputValue;
        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userQuery,
        };

        const assistantMessageId = (Date.now() + 1).toString();

        setMessages((prev) => [...prev, newUserMessage]);
        setInputValue('');
        setIsThinking(true);

        try {
            // Get current workflow state
            const flow = toObject();

            const response = await fetch(API_ENDPOINTS.RUN_WORKFLOW_STREAM, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workflow_id: workflowId || "temp",
                    query: userQuery,
                    nodes: flow.nodes,
                    edges: flow.edges
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            setIsThinking(false);
            setIsStreaming(true);

            // Create initial empty assistant message
            setMessages((prev) => [...prev, {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                sources: []
            }]);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';
            let sources: string[] = [];

            if (!reader) {
                throw new Error('No reader available');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'content') {
                                accumulatedContent += data.content;
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, content: accumulatedContent }
                                            : msg
                                    )
                                );
                            } else if (data.type === 'sources') {
                                sources = data.content;
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, sources }
                                            : msg
                                    )
                                );
                            } else if (data.type === 'error') {
                                accumulatedContent += `\n\nError: ${data.content}`;
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, content: accumulatedContent }
                                            : msg
                                    )
                                );
                            }
                        } catch {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }

        } catch (error) {
            console.error(error);
            setMessages((prev) => {
                // Check if we already added an assistant message
                const hasAssistantMessage = prev.some(msg => msg.id === assistantMessageId);
                if (hasAssistantMessage) {
                    return prev.map((msg) =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: "Error: Failed to execute workflow. Please check your configuration and try again." }
                            : msg
                    );
                }
                return [...prev, {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: "Error: Failed to execute workflow. Please check your configuration and try again.",
                }];
            });
        } finally {
            setIsThinking(false);
            setIsStreaming(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <Bot size={14} />
                        </div>
                        <h2 className="font-semibold text-gray-800">GenAI Stack Chat</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <Bot size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">GenAI Stack Chat</h3>
                            <p className="text-gray-500 text-sm">Start a conversation to test your stack</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-4 ${msg.role === 'assistant' ? '' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div className="space-y-1 max-w-[85%]">
                                    <div className="prose prose-sm text-gray-700 leading-relaxed font-sans dark:prose-invert prose-headings:text-gray-800 prose-headings:font-semibold prose-p:my-2 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-3 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-pink-600 prose-code:before:content-none prose-code:after:content-none prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                                        {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
                                            <div className="flex items-center gap-1.5 py-1">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                </div>
                                                <span className="text-sm text-gray-500 ml-2">Generating response...</span>
                                            </div>
                                        ) : (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        )}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Sources:</p>
                                            <ul className="text-xs text-gray-400 space-y-0.5">
                                                {msg.sources.map((src, idx) => (
                                                    <li key={idx} className="line-clamp-1 list-disc list-inside">{src}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isThinking && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                <Bot size={16} />
                            </div>
                            <div className="flex items-center">
                                <Loader2 className="animate-spin text-gray-400" size={18} />
                                <span className="ml-2 text-sm text-gray-500">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-gray-100 bg-white">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Send a message"
                            disabled={isThinking || isStreaming}
                            className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isThinking || isStreaming}
                            className="absolute right-2 p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    UPLOAD: `${API_BASE_URL}/documents/upload`,
    WORKFLOWS: `${API_BASE_URL}/workflows`,
    RUN_WORKFLOW: `${API_BASE_URL}/run_workflow`,
    RUN_WORKFLOW_STREAM: `${API_BASE_URL}/run_workflow_stream`,
};

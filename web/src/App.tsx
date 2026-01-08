import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WorkflowBuilder from './pages/builder/WorkflowBuilder';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/builder" element={<WorkflowBuilder />} />
        <Route path="/builder/:id" element={<WorkflowBuilder />} />
      </Routes>
    </Router>
  )
}

export default App

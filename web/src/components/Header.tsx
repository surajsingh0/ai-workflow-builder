import React from 'react';
import { Bot, Save } from 'lucide-react';

interface HeaderProps {
  onSave?: () => void;
  isSaving?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSave, isSaving }) => {
  return (
    <header className="h-14 bg-surface border-b border-border-color sticky top-0 z-[100] w-full flex items-center bg-white">
      <div className="w-full px-4 h-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white">
            <Bot size={18} />
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">GenAI Stack</span>
        </div>

        <div className="flex items-center gap-3">
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}

          <div className="w-8 h-8 bg-purple-100 text-purple-600 border border-purple-200 rounded-full flex items-center justify-center font-medium text-sm">
            <span>S</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

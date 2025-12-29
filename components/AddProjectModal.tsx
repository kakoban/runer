import React, { useState } from 'react';
import { Project, ProjectType } from '../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'envVars' | 'autoStart'>) => void;
  existingProjects: Project[]; // To check for port conflicts
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSave, existingProjects }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>(ProjectType.REACT);
  const [command, setCommand] = useState('npm run start');
  const [directory, setDirectory] = useState('./my-project');
  const [port, setPort] = useState<number>(3000);

  if (!isOpen) return null;

  // Simple port check logic
  const isPortTaken = existingProjects.some(p => p.port === port);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      type,
      command,
      directory,
      port
    });
    // Reset
    setName('');
    setType(ProjectType.REACT);
    setCommand('npm run start');
    setDirectory('./');
    setPort(3000);
    onClose();
  };

  const handleTypeChange = (newType: ProjectType) => {
    setType(newType);
    // Suggest defaults
    if (newType === ProjectType.NODE) {
      setCommand('npm run dev');
      setPort(8000);
    } else if (newType === ProjectType.PYTHON) {
      setCommand('python manage.py runserver');
      setPort(8000);
    } else if (newType === ProjectType.REACT) {
      setCommand('npm start');
      setPort(3000);
    } else if (newType === ProjectType.VUE) {
      setCommand('npm run serve');
      setPort(8080);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-white mb-4">Add New Process</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
            <input 
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Awesome App"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
               <select 
                 className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                 value={type}
                 onChange={e => handleTypeChange(e.target.value as ProjectType)}
               >
                 {Object.values(ProjectType).map(t => (
                   <option key={t} value={t}>{t}</option>
                 ))}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-400 mb-1">Port</label>
               <input 
                 type="number"
                 required
                 className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-white focus:ring-2 outline-none ${isPortTaken ? 'border-orange-500 focus:ring-orange-500' : 'border-gray-700 focus:ring-blue-500'}`}
                 value={port}
                 onChange={e => setPort(parseInt(e.target.value))}
               />
               {isPortTaken && <p className="text-xs text-orange-400 mt-1">⚠️ Port {port} is assigned to another project.</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Command</label>
            <input 
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="npm start"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Working Directory</label>
            <input 
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={directory}
              onChange={e => setDirectory(e.target.value)}
              placeholder="./services/backend"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-medium transition-colors"
            >
              Create Process
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal;
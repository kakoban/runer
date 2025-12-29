import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProcessStatus, LogEntry, ProcessState, ProjectType } from './types';
import Terminal from './components/Terminal';
import AddProjectModal from './components/AddProjectModal';
import { PlayIcon, SquareIcon, TerminalIcon, TrashIcon, PlusIcon, AlertCircle, CheckCircle, SettingsIcon } from './components/Icons';
import { generateStartupLogs, generateRuntimeLog } from './services/geminiService';

// Mock Initial Data
const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Frontend - React',
    type: ProjectType.REACT,
    command: 'npm start',
    directory: './client',
    port: 3000,
    envVars: [],
    autoStart: false
  },
  {
    id: '2',
    name: 'Backend - Node API',
    type: ProjectType.NODE,
    command: 'npm run dev',
    directory: './server',
    port: 5000,
    envVars: [],
    autoStart: false
  }
];

function App() {
  // State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  
  const [processStates, setProcessStates] = useState<Record<string, ProcessState>>({});
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'running'>('idle');

  // Persistence
  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  // Derived State
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const activePorts = Object.entries(processStates)
    .filter(([_, state]) => (state as ProcessState).status === ProcessStatus.RUNNING)
    .map(([pid]) => projects.find(p => p.id === pid)?.port);

  // Helper: Add Log
  const addLog = useCallback((projectId: string, text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => ({
      ...prev,
      [projectId]: [
        ...(prev[projectId] || []),
        { id: Math.random().toString(36), timestamp: Date.now(), text, type }
      ].slice(-500) // Keep last 500 lines
    }));
  }, []);

  // Process Logic: Start
  const startProcess = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Check Port Conflict
    const isPortBusy = activePorts.includes(project.port);
    if (isPortBusy) {
      addLog(projectId, `ERROR: Port ${project.port} is already in use by another managed process!`, 'error');
      return;
    }

    setProcessStates(prev => ({
      ...prev,
      [projectId]: { status: ProcessStatus.STARTING, startTime: Date.now() }
    }));
    addLog(projectId, `> cd ${project.directory} && ${project.command}`, 'info');

    // Simulate startup time and Gemini Logs
    const startupLines = await generateStartupLogs(project);
    
    startupLines.forEach((line, index) => {
      setTimeout(() => {
        addLog(projectId, line, 'info');
      }, index * 200); // Stagger logs
    });

    setTimeout(() => {
      setProcessStates(prev => ({
        ...prev,
        [projectId]: { status: ProcessStatus.RUNNING, pid: Math.floor(Math.random() * 9000) + 1000 }
      }));
      addLog(projectId, `Process started successfully on port ${project.port}`, 'success');
    }, startupLines.length * 200 + 500);
  };

  // Process Logic: Stop
  const stopProcess = (projectId: string) => {
    setProcessStates(prev => ({
      ...prev,
      [projectId]: { status: ProcessStatus.STOPPING }
    }));
    addLog(projectId, 'Sending signal SIGTERM...', 'info');

    setTimeout(() => {
      setProcessStates(prev => ({
        ...prev,
        [projectId]: { status: ProcessStatus.STOPPED }
      }));
      addLog(projectId, 'Process terminated.', 'error');
    }, 1000);
  };

  // Background Simulation Effect
  useEffect(() => {
    const interval = setInterval(async () => {
      const runningProjectIds = Object.entries(processStates)
        .filter(([_, state]) => (state as ProcessState).status === ProcessStatus.RUNNING)
        .map(([id]) => id);

      if (runningProjectIds.length > 0) {
        setGlobalStatus('running');
        // Randomly pick one running project to emit a log
        const randomId = runningProjectIds[Math.floor(Math.random() * runningProjectIds.length)];
        const project = projects.find(p => p.id === randomId);
        if (project) {
           // 30% chance to generate a log
           if (Math.random() > 0.7) {
             const logLine = await generateRuntimeLog(project, project.name);
             addLog(project.id, logLine, 'info');
           }
        }
      } else {
        setGlobalStatus('idle');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [processStates, projects, addLog]);

  // Handlers
  const handleAddProject = (newProjectData: Omit<Project, 'id' | 'envVars' | 'autoStart'>) => {
    const newProject: Project = {
      ...newProjectData,
      id: Math.random().toString(36).substr(2, 9),
      envVars: [],
      autoStart: false
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
  };

  const handleDeleteProject = (id: string) => {
    if (processStates[id]?.status === ProcessStatus.RUNNING) {
      alert("Please stop the process before deleting.");
      return;
    }
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      
      {/* Sidebar */}
      <div className="w-64 bg-gray-850 flex flex-col border-r border-gray-800">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TerminalIcon className="text-blue-500 w-6 h-6" />
            <h1 className="font-bold text-lg tracking-tight">ProcessDock</h1>
          </div>
          <div className={`w-2 h-2 rounded-full ${globalStatus === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {projects.map(project => {
            const state = processStates[project.id]?.status || ProcessStatus.STOPPED;
            const isRunning = state === ProcessStatus.RUNNING;
            const isStarting = state === ProcessStatus.STARTING;

            return (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative ${
                  selectedProjectId === project.id 
                    ? 'bg-gray-800 border-blue-500/50 shadow-lg shadow-blue-900/10' 
                    : 'bg-gray-800/40 border-transparent hover:bg-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm truncate pr-2">{project.name}</span>
                  {isRunning && <span className="flex h-2 w-2 rounded-full bg-green-500"></span>}
                  {isStarting && <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>}
                  {state === ProcessStatus.STOPPED && <span className="flex h-2 w-2 rounded-full bg-gray-600"></span>}
                </div>
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  <span className="uppercase text-[10px] font-bold bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">{project.type}</span>
                  <span>:{project.port}</span>
                </div>
                
                {/* Quick Action Overlay (Visible on Hover) */}
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Could add mini play/stop here later */}
                </div>
              </button>
            );
          })}
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg border border-dashed border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 hover:bg-gray-800/50 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Add Project</span>
          </button>
        </div>
        
        <div className="p-4 border-t border-gray-800 text-xs text-gray-600 text-center">
          <p>Local Simulation Mode</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-900 min-w-0">
        {selectedProject ? (
          <>
            {/* Header */}
            <header className="bg-gray-850 border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedProject.name}
                  <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
                    Port {selectedProject.port}
                  </span>
                </h2>
                <p className="text-sm text-gray-400 font-mono mt-1 opacity-80">{selectedProject.directory} $ {selectedProject.command}</p>
              </div>

              <div className="flex items-center space-x-3">
                 {/* Status Indicator */}
                 <div className="flex items-center px-4 py-2 bg-gray-900 rounded-lg border border-gray-700">
                    {processStates[selectedProject.id]?.status === ProcessStatus.RUNNING ? (
                        <>
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-sm font-medium text-green-400">Running (PID: {processStates[selectedProject.id]?.pid})</span>
                        </>
                    ) : processStates[selectedProject.id]?.status === ProcessStatus.STARTING ? (
                        <>
                            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-sm font-medium text-yellow-400">Starting...</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-5 h-5 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-500">Stopped</span>
                        </>
                    )}
                 </div>

                 <div className="h-8 w-px bg-gray-700 mx-2"></div>

                 {processStates[selectedProject.id]?.status === ProcessStatus.RUNNING || processStates[selectedProject.id]?.status === ProcessStatus.STARTING ? (
                    <button 
                      onClick={() => stopProcess(selectedProject.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/20"
                    >
                      <SquareIcon className="w-4 h-4 fill-current" />
                      <span className="font-medium">Stop</span>
                    </button>
                 ) : (
                    <button 
                      onClick={() => startProcess(selectedProject.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105"
                    >
                      <PlayIcon className="w-4 h-4 fill-current" />
                      <span className="font-medium">Start</span>
                    </button>
                 )}
                 
                 <button 
                    onClick={() => handleDeleteProject(selectedProject.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete Project"
                 >
                    <TrashIcon className="w-5 h-5" />
                 </button>
              </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 p-6 overflow-hidden flex flex-col">
              {/* Stats / Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Local Address</h3>
                    <div className="text-blue-400 font-mono text-lg truncate hover:underline cursor-pointer">
                        http://localhost:{selectedProject.port}
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Uptime</h3>
                    <div className="text-gray-200 font-mono text-lg">
                        {processStates[selectedProject.id]?.startTime 
                            ? `${Math.floor((Date.now() - processStates[selectedProject.id]!.startTime!) / 1000)}s` 
                            : '--'}
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <h3 className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Memory (Simulated)</h3>
                     <div className="text-gray-200 font-mono text-lg">
                        {processStates[selectedProject.id]?.status === ProcessStatus.RUNNING 
                            ? `${Math.floor(Math.random() * 50 + 50)} MB` 
                            : '0 MB'}
                     </div>
                </div>
              </div>

              {/* Terminal */}
              <div className="flex-1 min-h-0">
                <Terminal 
                  logs={logs[selectedProject.id] || []} 
                  title={`${selectedProject.command}`}
                />
              </div>
            </main>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
               <SettingsIcon className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-xl font-medium text-gray-300">No Project Selected</h2>
            <p className="mt-2 text-sm">Select a project from the sidebar or create a new one.</p>
          </div>
        )}
      </div>

      <AddProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddProject}
        existingProjects={projects}
      />
    </div>
  );
}

export default App;
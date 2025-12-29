export enum ProjectType {
  REACT = 'React',
  NODE = 'Node.js',
  PYTHON = 'Python/Django/Flask',
  VUE = 'Vue',
  NEXT = 'Next.js',
  OTHER = 'Other'
}

export enum ProcessStatus {
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
  STOPPING = 'STOPPING'
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  command: string;
  directory: string;
  port: number;
  envVars: { key: string; value: string }[];
  autoStart: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'info' | 'error' | 'success';
}

export interface ProcessState {
  status: ProcessStatus;
  pid?: number; // Simulated PID
  startTime?: number;
}
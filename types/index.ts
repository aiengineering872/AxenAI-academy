export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'admin';
  xp: number;
  level: number;
  badges: string[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  lessons: Lesson[];
  order: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
  completed: boolean;
}

export interface Quiz {
  id: string;
  moduleId: string;
  questions: Question[];
  passingScore: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  githubLink?: string;
  codeFile?: string;
  isPublic: boolean;
  upvotes: number;
  comments: Comment[];
  aiReview?: AIReview;
  createdAt: any;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
}

export interface AIReview {
  innovation: number;
  accuracy: number;
  presentation: number;
  feedback: string;
  overallScore: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  modules: Module[];
  levels: ('beginner' | 'intermediate' | 'advanced')[];
}

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    accent: string;
    glow: string;
  };
}

export interface Certificate {
  id: string;
  userId: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  shareableLink: string;
}

export interface VideoNote {
  id: string;
  videoId: string;
  userId: string;
  timestamp: number;
  note: string;
  createdAt: string;
}

export interface PracticeTest {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  service: string;
  key: string;
  createdAt: string;
}

export interface Simulator {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  defaultCode?: string;
  instructions?: string;
  supportsDataset?: boolean;
}

export interface ModuleSimulator {
  moduleId: string;
  simulatorType: string;
  order?: number;
}


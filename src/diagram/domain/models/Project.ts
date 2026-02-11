export interface ProjectStack {
  [key: string]: string;
}

export interface ProjectConventions {
  [key: string]: string;
}

export interface Project {
  name: string;
  description?: string;
  stack?: ProjectStack;
  conventions?: ProjectConventions;
}

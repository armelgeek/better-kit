export interface Todo {
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTodoData extends Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> {}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
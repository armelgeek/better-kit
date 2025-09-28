import { Todo, CreateTodoData, ApiResponse } from '../types';

class BetterQueryClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  // Todo CRUD operations
  todo = {
    list: (): Promise<ApiResponse<Todo[]>> => 
      this.request<Todo[]>('/todo/list'),
    
    create: (data: CreateTodoData): Promise<ApiResponse<Todo>> =>
      this.request<Todo>('/todo/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    read: (id: string): Promise<ApiResponse<Todo>> =>
      this.request<Todo>(`/todo/read/${id}`),
    
    update: (id: string, data: Partial<Todo>): Promise<ApiResponse<Todo>> =>
      this.request<Todo>(`/todo/update/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string): Promise<ApiResponse<void>> =>
      this.request<void>(`/todo/delete/${id}`, {
        method: 'DELETE',
      }),
  };
}

// Auto-detect available backends
const possibleEndpoints = [
  'http://localhost:3000/api/query',  // Express/Hono
  'http://localhost:3001/api/query',  // Alternative port
  '/api/query',                       // Same origin (Next.js)
];

let globalClient: BetterQueryClient | null = null;

export async function getBetterQueryClient(): Promise<BetterQueryClient | null> {
  if (globalClient) return globalClient;

  // Try each endpoint to find a working one
  for (const endpoint of possibleEndpoints) {
    try {
      const testClient = new BetterQueryClient(endpoint);
      const result = await testClient.todo.list();
      
      if (!result.error) {
        console.log(`✅ Connected to Better Query API at: ${endpoint}`);
        globalClient = testClient;
        return globalClient;
      }
    } catch (error) {
      console.log(`❌ Failed to connect to ${endpoint}:`, error);
    }
  }

  console.error('❌ Could not connect to any Better Query backend');
  return null;
}

export { BetterQueryClient };
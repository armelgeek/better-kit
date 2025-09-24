import * as React from "react";
import { 
  SimpleAdmin, 
  SimpleResource, 
  SimpleList, 
  SimpleDataTable 
} from "../simple";
import { SimpleTextField } from "../simple/fields";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

// Sample data that would come from better-query
const sampleUsers = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "admin" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "user" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "user" },
];

const samplePosts = [
  { id: "1", title: "Getting Started", authorId: "1", published: true },
  { id: "2", title: "Advanced Features", authorId: "2", published: false },
  { id: "3", title: "Best Practices", authorId: "1", published: true },
];

// User List Component
const UserList = () => (
  <SimpleList title="Users">
    <div className="mb-4">
      <Button variant="default">Create New User</Button>
    </div>
    <SimpleDataTable data={sampleUsers}>
      <SimpleTextField source="id" label="ID" />
      <SimpleTextField source="name" label="Name" />
      <SimpleTextField source="email" label="Email" />
      <SimpleTextField 
        source="role" 
        label="Role"
        render={(record) => (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            record.role === 'admin' 
              ? 'bg-red-100 text-red-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {record.role}
          </span>
        )}
      />
    </SimpleDataTable>
  </SimpleList>
);

// Post List Component
const PostList = () => (
  <SimpleList title="Posts">
    <div className="mb-4">
      <Button variant="default">Create New Post</Button>
    </div>
    <SimpleDataTable data={samplePosts}>
      <SimpleTextField source="id" label="ID" />
      <SimpleTextField source="title" label="Title" />
      <SimpleTextField source="authorId" label="Author ID" />
      <SimpleTextField 
        source="published" 
        label="Status"
        render={(record) => (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            record.published 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {record.published ? 'Published' : 'Draft'}
          </span>
        )}
      />
    </SimpleDataTable>
  </SimpleList>
);

// Dashboard Component
const Dashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Total Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{sampleUsers.length}</div>
        <p className="text-sm text-muted-foreground">Active users</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle>Total Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{samplePosts.length}</div>
        <p className="text-sm text-muted-foreground">Published and draft</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle>Published Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {samplePosts.filter(p => p.published).length}
        </div>
        <p className="text-sm text-muted-foreground">Live content</p>
      </CardContent>
    </Card>
  </div>
);

// Main Demo App
export const BetterAdminDemo = () => {
  const [currentView, setCurrentView] = React.useState<'dashboard' | 'users' | 'posts'>('dashboard');

  return (
    <SimpleAdmin title="Better Admin Demo">
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={currentView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant={currentView === 'users' ? 'default' : 'outline'}
            onClick={() => setCurrentView('users')}
          >
            Users
          </Button>
          <Button 
            variant={currentView === 'posts' ? 'default' : 'outline'}
            onClick={() => setCurrentView('posts')}
          >
            Posts
          </Button>
        </div>

        {/* Content */}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'users' && <UserList />}
        {currentView === 'posts' && <PostList />}
      </div>
    </SimpleAdmin>
  );
};

export default BetterAdminDemo;
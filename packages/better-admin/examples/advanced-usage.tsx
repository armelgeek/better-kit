import {
  Admin,
  Resource,
  List,
  Create,
  Edit,
  Show,
  SimpleForm,
  SimpleShowLayout,
  DataTable,
  TextField,
  TextInput,
  SelectInput,
  DateField,
  BooleanInput,
  BooleanField,
  ReferenceInput,
  ReferenceField,
  createBetterQueryProvider,
  authProvider,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from "better-admin";
import { FC } from "react";

// Custom data provider with filtering and sorting
const dataProvider = createBetterQueryProvider({
  baseUrl: "/api/query",
});

// Custom Dashboard
const Dashboard: FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
    <Card>
      <CardHeader>
        <CardTitle>Total Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">1,234</div>
        <p className="text-muted-foreground">+12% from last month</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle>Published Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">567</div>
        <p className="text-muted-foreground">+8% from last month</p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">2,345</div>
        <p className="text-muted-foreground">+23% from last month</p>
      </CardContent>
    </Card>
  </div>
);

// Enhanced User Components with filtering
const UserList = () => (
  <List
    filters={[
      <TextInput source="q" label="Search" alwaysOn />,
      <SelectInput
        source="role"
        label="Role"
        choices={[
          { id: "admin", name: "Admin" },
          { id: "user", name: "User" },
        ]}
      />,
    ]}
  >
    <DataTable>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="email" />
      <TextField 
        source="role" 
        render={(record) => (
          <Badge variant={record.role === 'admin' ? 'destructive' : 'secondary'}>
            {record.role}
          </Badge>
        )}
      />
      <DateField source="createdAt" />
    </DataTable>
  </List>
);

const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required validate={[required()]} />
      <TextInput source="email" type="email" required validate={[required(), email()]} />
      <SelectInput 
        source="role" 
        choices={[
          { id: "user", name: "User" },
          { id: "admin", name: "Admin" },
        ]} 
        defaultValue="user"
        required
      />
    </SimpleForm>
  </Create>
);

const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required validate={[required()]} />
      <TextInput source="email" type="email" required validate={[required(), email()]} />
      <SelectInput 
        source="role" 
        choices={[
          { id: "user", name: "User" },
          { id: "admin", name: "Admin" },
        ]} 
        required
      />
    </SimpleForm>
  </Edit>
);

// Enhanced Post Components with relationships
const PostList = () => (
  <List
    filters={[
      <TextInput source="q" label="Search" alwaysOn />,
      <BooleanInput source="published" label="Published" />,
      <ReferenceInput source="authorId" reference="user" label="Author">
        <SelectInput />
      </ReferenceInput>,
    ]}
  >
    <DataTable>
      <TextField source="id" />
      <TextField source="title" />
      <ReferenceField source="authorId" reference="user" label="Author">
        <TextField source="name" />
      </ReferenceField>
      <BooleanField 
        source="published" 
        render={(record) => (
          <Badge variant={record.published ? 'default' : 'secondary'}>
            {record.published ? 'Published' : 'Draft'}
          </Badge>
        )}
      />
      <DateField source="createdAt" />
    </DataTable>
  </List>
);

const PostCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" required validate={[required()]} />
      <TextInput 
        source="content" 
        multiline 
        rows={6} 
        required 
        validate={[required()]} 
      />
      <ReferenceInput source="authorId" reference="user" required>
        <SelectInput validate={[required()]} />
      </ReferenceInput>
      <BooleanInput source="published" defaultValue={false} />
      <TextInput 
        source="tags" 
        placeholder="Enter tags separated by commas"
        parse={(value) => value ? value.split(',').map(tag => tag.trim()) : []}
        format={(value) => Array.isArray(value) ? value.join(', ') : ''}
      />
    </SimpleForm>
  </Create>
);

const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" required validate={[required()]} />
      <TextInput 
        source="content" 
        multiline 
        rows={6} 
        required 
        validate={[required()]} 
      />
      <ReferenceInput source="authorId" reference="user" required>
        <SelectInput validate={[required()]} />
      </ReferenceInput>
      <BooleanInput source="published" />
      <TextInput 
        source="tags" 
        placeholder="Enter tags separated by commas"
        parse={(value) => value ? value.split(',').map(tag => tag.trim()) : []}
        format={(value) => Array.isArray(value) ? value.join(', ') : ''}
      />
    </SimpleForm>
  </Edit>
);

const PostShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="content" />
      <ReferenceField source="authorId" reference="user" label="Author">
        <TextField source="name" />
      </ReferenceField>
      <BooleanField source="published" />
      <TextField 
        source="tags" 
        render={(record) => (
          <div className="flex flex-wrap gap-2">
            {record.tags?.map((tag, index) => (
              <Badge key={index} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}
      />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);

// Comment Components
const CommentList = () => (
  <List
    filters={[
      <TextInput source="q" label="Search" alwaysOn />,
      <ReferenceInput source="postId" reference="post" label="Post">
        <SelectInput />
      </ReferenceInput>,
      <ReferenceInput source="authorId" reference="user" label="Author">
        <SelectInput />
      </ReferenceInput>,
    ]}
  >
    <DataTable>
      <TextField source="id" />
      <TextField source="content" />
      <ReferenceField source="postId" reference="post" label="Post">
        <TextField source="title" />
      </ReferenceField>
      <ReferenceField source="authorId" reference="user" label="Author">
        <TextField source="name" />
      </ReferenceField>
      <DateField source="createdAt" />
    </DataTable>
  </List>
);

// Main Advanced Admin App
export function AdvancedAdminApp() {
  return (
    <Admin 
      dataProvider={dataProvider}
      authProvider={authProvider}
      title="Better Admin - Advanced Example"
      dashboard={Dashboard}
    >
      <Resource
        name="user"
        list={UserList}
        create={UserCreate}
        edit={UserEdit}
        show={UserShow}
        icon="👥"
      />
      <Resource
        name="post"
        list={PostList}
        create={PostCreate}
        edit={PostEdit}
        show={PostShow}
        icon="📝"
      />
      <Resource
        name="comment"
        list={CommentList}
        icon="💬"
      />
    </Admin>
  );
}

// Validation helpers (would typically come from a validation library)
const required = () => (value: any) => value ? undefined : 'Required';
const email = () => (value: string) => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Invalid email';

export default AdvancedAdminApp;
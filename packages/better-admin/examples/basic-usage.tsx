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
  createBetterQueryProvider,
  authProvider,
} from "better-admin";

// Data provider configured for Better Query
const dataProvider = createBetterQueryProvider({
  baseUrl: "/api/query",
});

// User resource components
const UserList = () => (
  <List>
    <DataTable>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="email" />
      <TextField source="role" />
      <DateField source="createdAt" />
    </DataTable>
  </List>
);

const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="email" type="email" required />
      <SelectInput 
        source="role" 
        choices={[
          { id: "user", name: "User" },
          { id: "admin", name: "Admin" },
        ]} 
        defaultValue="user"
      />
    </SimpleForm>
  </Create>
);

const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="email" type="email" required />
      <SelectInput 
        source="role" 
        choices={[
          { id: "user", name: "User" },
          { id: "admin", name: "Admin" },
        ]} 
      />
    </SimpleForm>
  </Edit>
);

const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="email" />
      <TextField source="role" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);

// Post resource components
const PostList = () => (
  <List>
    <DataTable>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="authorId" label="Author ID" />
      <TextField source="published" />
      <DateField source="createdAt" />
    </DataTable>
  </List>
);

const PostCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="content" multiline rows={4} required />
      <TextInput source="authorId" required />
      <SelectInput 
        source="published" 
        choices={[
          { id: true, name: "Published" },
          { id: false, name: "Draft" },
        ]} 
        defaultValue={false}
      />
    </SimpleForm>
  </Create>
);

const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="content" multiline rows={4} required />
      <TextInput source="authorId" required />
      <SelectInput 
        source="published" 
        choices={[
          { id: true, name: "Published" },
          { id: false, name: "Draft" },
        ]} 
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
      <TextField source="authorId" label="Author ID" />
      <TextField source="published" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);

// Main Admin App
export function App() {
  return (
    <Admin 
      dataProvider={dataProvider}
      authProvider={authProvider}
      title="Better Admin Example"
    >
      <Resource
        name="user"
        list={UserList}
        create={UserCreate}
        edit={UserEdit}
        show={UserShow}
      />
      <Resource
        name="post"
        list={PostList}
        create={PostCreate}
        edit={PostEdit}
        show={PostShow}
      />
    </Admin>
  );
}

export default App;
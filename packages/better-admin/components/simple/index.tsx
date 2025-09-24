import * as React from "react";

// Simple Admin wrapper without ra-core dependency for demonstration
export interface SimpleAdminProps {
  children: React.ReactNode;
  dataProvider?: any;
  authProvider?: any;
  title?: string;
}

export const SimpleAdmin: React.FC<SimpleAdminProps> = ({ 
  children, 
  title = "Better Admin" 
}) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

// Simple Resource component
export interface SimpleResourceProps {
  name: string;
  list?: React.ComponentType;
  create?: React.ComponentType;
  edit?: React.ComponentType;
  show?: React.ComponentType;
}

export const SimpleResource: React.FC<SimpleResourceProps> = ({ 
  name, 
  list: ListComponent 
}) => {
  if (ListComponent) {
    return <ListComponent />;
  }
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">{name} Resource</h2>
      <p>Configure your {name} list, create, edit, and show components.</p>
    </div>
  );
};

// Simple List component
export interface SimpleListProps {
  children: React.ReactNode;
  title?: string;
}

export const SimpleList: React.FC<SimpleListProps> = ({ children, title }) => {
  return (
    <div className="space-y-4">
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      <div className="bg-card rounded-lg border p-6">
        {children}
      </div>
    </div>
  );
};

// Simple DataTable
export interface SimpleDataTableProps {
  children: React.ReactNode;
  data?: any[];
}

export const SimpleDataTable: React.FC<SimpleDataTableProps> = ({ 
  children,
  data = [] 
}) => {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead className="border-b">
          <tr>
            {React.Children.map(children, (child, index) => (
              <th key={index} className="p-4 text-left font-medium">
                {React.isValidElement(child) ? child.props.source : 'Field'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={React.Children.count(children)} className="p-8 text-center text-muted-foreground">
                No data available
              </td>
            </tr>
          ) : (
            data.map((record, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-muted/50">
                {React.Children.map(children, (child, colIndex) => (
                  <td key={colIndex} className="p-4">
                    {React.isValidElement(child) && child.props.source
                      ? record[child.props.source] 
                      : 'N/A'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
import * as React from "react";

export interface SimpleTextFieldProps {
  source: string;
  label?: string;
  render?: (record: any) => React.ReactNode;
}

export const SimpleTextField: React.FC<SimpleTextFieldProps> = ({ 
  source, 
  label,
  render 
}) => {
  // This is a placeholder component that would receive data from context in a real implementation
  const record = {}; // In real implementation, this would come from context
  
  if (render) {
    return <>{render(record)}</>;
  }
  
  return <span>{record[source] || '-'}</span>;
};
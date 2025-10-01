import type { AdminResourceConfig } from "../types";
import type { FormField } from "../components/admin-form";

/**
 * Converts admin field metadata to form field configuration
 */
export function generateFormFields(
resource: AdminResourceConfig,
operation: "create" | "edit",
defaultValues?: Record<string, any>,
): FormField[] {
// Get the fields to show based on operation
const fieldsConfig = operation === "create" ? resource.create : resource.edit;
const fieldNames = fieldsConfig?.fields || [];

if (fieldNames.length === 0) {
// If no fields configured, use all fields from fieldMetadata
const allFields = resource.fieldMetadata
? Object.keys(resource.fieldMetadata).filter((field) => {
const metadata = resource.fieldMetadata?.[field];
return metadata?.showInForm !== false;
})
: [];
return allFields.map((name) =>
convertFieldMetadataToFormField(
name,
resource.fieldMetadata?.[name],
defaultValues?.[name],
),
);
}

// Convert configured fields to FormField format
return fieldNames.map((fieldName) => {
const metadata = resource.fieldMetadata?.[fieldName];
const defaultValue =
defaultValues?.[fieldName] ??
(operation === "create"
? resource.create?.defaultValues?.[fieldName]
: undefined);

return convertFieldMetadataToFormField(fieldName, metadata, defaultValue);
});
}

/**
 * Converts a single field metadata to form field
 */
function convertFieldMetadataToFormField(
name: string,
metadata:
| {
label?: string;
description?: string;
inputType?:
| "text"
| "number"
| "email"
| "password"
| "textarea"
| "select"
| "checkbox"
| "date"
| "datetime"
| "file"
| "richtext"
| (string & {});
options?: Array<{ label: string; value: string | number }>;
showInForm?: boolean;
  }
| undefined,
defaultValue?: any,
): FormField {
const label =
metadata?.label || name.charAt(0).toUpperCase() + name.slice(1);
const inputType = metadata?.inputType || "text";

// Map admin input types to form field types
let type: FormField["type"];
switch (inputType) {
case "textarea":
type = "textarea";
break;
case "select":
type = "select";
break;
case "number":
type = "number";
break;
case "email":
type = "email";
break;
case "password":
type = "password";
break;
case "date":
type = "date";
break;
case "datetime":
type = "datetime-local";
break;
case "text":
default:
type = "text";
break;
}

return {
name,
label,
type,
placeholder: metadata?.description,
options: metadata?.options,
defaultValue,
required: false, // Can be enhanced with validation rules
};
}

/**
 * Get form fields for a resource from admin configuration
 * This is a client-side utility that requires the admin config to be passed
 */
export function getResourceFormFields(
resourceName: string,
operation: "create" | "edit",
adminConfig: { resources: Map<string, AdminResourceConfig> },
defaultValues?: Record<string, any>,
): FormField[] {
const resource = adminConfig.resources.get(resourceName);
if (!resource) {
throw new Error(`Resource '${resourceName}' not found in admin config`);
}

return generateFormFields(resource, operation, defaultValues);
}

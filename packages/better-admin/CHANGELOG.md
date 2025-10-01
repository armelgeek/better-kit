# Better Admin Changelog

## [Unreleased]

### Added
- **Auto-generation of form fields from admin configuration**: Forms now automatically generate fields from the `fieldMetadata` and `create`/`edit` configuration, eliminating the need to manually define field arrays in forms.
- New `generateFormFields()` utility function to convert admin resource configuration to form field definitions
- New `getResourceFormFields()` helper function for client-side form field generation
- `getSerializableConfig()` method on the betterAdmin instance to export configuration for client-side use

### Changed
- Admin resource configuration is now exportable as a serializable object for client-side access
- Example pages in next-admin demo now use auto-generated fields instead of manual definitions

### Example Usage

**Before (Manual Field Definition):**
```tsx
<AdminForm
  fields={[
    {
      name: "name",
      label: "Product Name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
    },
    // ... more manual field definitions
  ]}
  onSubmit={handleSubmit}
/>
```

**After (Auto-Generated Fields):**
```tsx
import { adminConfig } from "@/lib/admin";
import { generateFormFields } from "better-admin";

const productResource = adminConfig.resources.get("product");
const fields = generateFormFields(productResource, "create");

<AdminForm
  fields={fields}
  onSubmit={handleSubmit}
/>
```

This change significantly reduces boilerplate code and ensures forms stay in sync with the admin configuration.

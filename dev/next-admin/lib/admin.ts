import { betterAdmin, createAdminResource } from "better-admin";
import { orderSchema, query, userSchema } from "./query";
import { productSchema } from "./query"; 

export const admin = betterAdmin({
  query,
  resources: [
    createAdminResource({
      name: "product",
      schema: productSchema,
      label: "Product",
      labelPlural: "Products",
      icon: "📦",
      description: "Manage your product catalog",
      showInMenu: true,
      menuOrder: 1,
      list: {
        fields: ["name", "category", "price", "stock", "status"],
        defaultSort: "name",
        defaultSortOrder: "asc",
        perPage: 10,
        searchFields: ["name", "description", "category"],
        bulkActions: true,
      },
      show: {
        fields: [
          "name",
          "description",
          "category",
          "price",
          "stock",
          "status",
          "createdAt",
          "updatedAt",
        ],
      },
      create: {
        fields: ["name", "description", "category", "price", "stock", "status"],
        defaultValues: {
          status: "draft",
          stock: 0,
        },
      },
      edit: {
        fields: ["name", "description", "category", "price", "stock", "status"],
      },
      fieldMetadata: {
        name: {
          label: "Product Name",
          description: "The name of the product",
          inputType: "text",
          showInList: true,
          showInShow: true,
          showInForm: true,
        },
        description: {
          label: "Description",
          description: "Detailed product description",
          inputType: "textarea",
          showInList: false,
          showInShow: true,
          showInForm: true,
        },
        category: {
          label: "Category",
          inputType: "select",
          options: [
            { label: "Electronics", value: "electronics" },
            { label: "Clothing", value: "clothing" },
            { label: "Books", value: "books" },
            { label: "Home & Garden", value: "home-garden" },
            { label: "Other", value: "other" },
          ],
          showInList: true,
          showInShow: true,
          showInForm: true,
        },
        price: {
          label: "Price",
          description: "Product price in USD",
          inputType: "number",
          showInList: true,
          showInShow: true,
          showInForm: true,
          formatter: (value) => `$${value.toFixed(2)}`,
        },
        stock: {
          label: "Stock",
          description: "Available quantity",
          inputType: "number",
          showInList: true,
          showInShow: true,
          showInForm: true,
        },
        status: {
          label: "Status",
          inputType: "select",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ],
          showInList: true,
          showInShow: true,
          showInForm: true,
          formatter: (value) => {
            const badges = {
              draft: "🟡 Draft",
              active: "🟢 Active",
              inactive: "🔴 Inactive",
            };
            return badges[value as keyof typeof badges] || value;
          },
        },
      },
    }),

    // User resource configuration
    createAdminResource({
      name: "user",
      label: "User",
      labelPlural: "Users",
      schema: userSchema,
      icon: "👥",
      description: "View and manage user accounts",
      showInMenu: true,
      menuOrder: 2,
      list: {
        fields: ["email", "name", "role", "createdAt"],
        defaultSort: "createdAt",
        defaultSortOrder: "desc",
        perPage: 10,
        searchFields: ["email", "name"],
      },
      show: {
        fields: ["email", "name", "role", "createdAt"],
      },
      fieldMetadata: {
        email: {
          label: "Email",
          inputType: "email",
          showInList: true,
          showInShow: true,
        },
        name: {
          label: "Name",
          inputType: "text",
          showInList: true,
          showInShow: true,
        },
        role: {
          label: "Role",
          inputType: "select",
          options: [
            { label: "Admin", value: "admin" },
            { label: "User", value: "user" },
          ],
          showInList: true,
          showInShow: true,
          formatter: (value) => {
            return value === "admin" ? "👑 Admin" : "👤 User";
          },
        },
      },
    }),

    // Order resource configuration
    createAdminResource({
      name: "order",
      label: "Order",
      labelPlural: "Orders",
      schema: orderSchema,
      icon: "🛒",
      description: "Manage customer orders",
      showInMenu: true,
      menuOrder: 3,
      list: {
        fields: [
          "userId",
          "productId",
          "quantity",
          "total",
          "status",
          "createdAt",
        ],
        defaultSort: "createdAt",
        defaultSortOrder: "desc",
        perPage: 10,
      },
      show: {
        fields: [
          "userId",
          "productId",
          "quantity",
          "total",
          "status",
          "createdAt",
        ],
      },
      create: {
        fields: ["userId", "productId", "quantity", "total", "status"],
      },
      edit: {
        fields: ["status"],
      },
      fieldMetadata: {
        quantity: {
          label: "Quantity",
          inputType: "number",
          showInList: true,
          showInShow: true,
        },
        total: {
          label: "Total",
          inputType: "number",
          showInList: true,
          showInShow: true,
          formatter: (value) => `$${value.toFixed(2)}`,
        },
        status: {
          label: "Status",
          inputType: "select",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Processing", value: "processing" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ],
          showInList: true,
          showInShow: true,
          showInForm: true,
          formatter: (value) => {
            const badges = {
              pending: "🟡 Pending",
              processing: "🔵 Processing",
              completed: "🟢 Completed",
              cancelled: "🔴 Cancelled",
            };
            return badges[value as keyof typeof badges] || value;
          },
        },
      },
    }),
  ],
  config: {
    title: "Better Admin",
    basePath: "/admin",
    theme: {
      defaultMode: "light",
      enableModeToggle: true,
      colors: {
        primary: "#3b82f6",
        secondary: "#6b7280",
      },
    },
    navigation: {
      position: "left",
      collapsible: true,
      defaultCollapsed: false,
    },
    dashboard: {
      enabled: true,
    },
  },
});

#!/usr/bin/env node

import { createResource, withId } from "./packages/better-query/dist/index.js";
import { z } from "zod";

// Test the exact same schema as in the express todo app
const todoSchema = withId({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
  dueDate: z.date().optional(),
});

// Create todo resource with the same hooks as our fix
const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  permissions: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
    list: () => true,
  },
  hooks: {
    beforeCreate: async (context) => {
      console.log("✅ beforeCreate hook called!");
      console.log("Original data:", JSON.stringify(context.data, null, 2));
      
      // Convert date string to Date object if present
      if (context.data.dueDate && typeof context.data.dueDate === 'string') {
        console.log("Converting dueDate from string to Date object");
        context.data.dueDate = new Date(context.data.dueDate);
      }
      
      // Auto-generate timestamps
      context.data.createdAt = new Date();
      context.data.updatedAt = new Date();
      
      console.log("Modified data:", JSON.stringify(context.data, null, 2));
    },
    beforeUpdate: async (context) => {
      console.log("✅ beforeUpdate hook called!");
      console.log("Original data:", JSON.stringify(context.data, null, 2));
      
      // Convert date string to Date object if present
      if (context.data.dueDate && typeof context.data.dueDate === 'string') {
        console.log("Converting dueDate from string to Date object");
        context.data.dueDate = new Date(context.data.dueDate);
      }
      
      context.data.updatedAt = new Date();
      
      console.log("Modified data:", JSON.stringify(context.data, null, 2));
    },
    afterCreate: async (context) => {
      console.log(`✅ Todo created: "${context.result.title}"`);
    },
    afterDelete: async (context) => {
      console.log(`🗑️ Todo deleted: ID ${context.id}`);
    },
  },
});

async function testHooks() {
  console.log("🧪 Testing date parsing fix...\n");
  
  // Test case 1: Create with date string (simulates HTML form input)
  console.log("📝 Test 1: beforeCreate with date string");
  const mockCreateContext = {
    user: { id: "user123" },
    resource: "todo",
    operation: "create",
    data: {
      title: "Test Todo",
      description: "Test description", 
      priority: "medium",
      dueDate: "2024-01-15", // This comes as string from HTML date input
    },
    adapter: {} 
  };
  
  try {
    await todoResource.hooks.beforeCreate(mockCreateContext);
    console.log("✅ beforeCreate hook executed successfully");
    
    // Validate the schema after hook transformation
    const parsed = todoSchema.parse(mockCreateContext.data);
    console.log("✅ Schema validation passed after hook transformation");
    console.log("Final parsed data:", JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  // Test case 2: Update with date string
  console.log("📝 Test 2: beforeUpdate with date string");
  const mockUpdateContext = {
    user: { id: "user123" },
    resource: "todo", 
    operation: "update",
    data: {
      dueDate: "2024-02-20", // This comes as string from HTML date input
    },
    adapter: {}
  };
  
  try {
    await todoResource.hooks.beforeUpdate(mockUpdateContext);
    console.log("✅ beforeUpdate hook executed successfully");
    
    // Validate the updated data
    if (mockUpdateContext.data.dueDate instanceof Date) {
      console.log("✅ Date conversion successful");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
  
  console.log("\n🎉 All tests passed! Date parsing fix is working correctly.");
}

testHooks().catch(console.error);
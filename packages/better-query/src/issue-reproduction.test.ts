/**
 * Reproduction test for the date parsing issue
 * This simulates the exact error scenario described in the issue
 */

import { z } from "zod";

// Original schema without hooks (causes the validation error)
const originalTodoSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
  dueDate: z.date().optional(),
});

// Mock data that would come from the frontend (HTML date input sends string)
const frontendTodoData = {
  title: "Test Todo",
  description: "Test description",
  priority: "medium",
  category: "work", 
  dueDate: "2024-01-15" // This is a STRING from HTML date input
};

console.log("🧪 Reproducing the original parsing error...");
console.log("Frontend data:", JSON.stringify(frontendTodoData, null, 2));

try {
  const result = originalTodoSchema.parse(frontendTodoData);
  console.log("❌ This should fail but didn't - unexpected success");
} catch (error) {
  console.log("✅ Reproduced the original error!");
  console.log("Error:", error.errors[0]);
  console.log("Expected:", error.errors[0].expected);
  console.log("Received:", error.errors[0].received);
  console.log("Path:", error.errors[0].path);
  console.log("Message:", error.errors[0].message);
}

console.log("\n" + "=".repeat(50));
console.log("🔧 Testing our fix with beforeCreate hook...");

// Simulate our fix: beforeCreate hook transforms the data
function beforeCreateHook(data) {
  console.log("🪝 beforeCreate hook called");
  console.log("Original data:", JSON.stringify(data, null, 2));
  
  // Convert date string to Date object if present (our fix)
  if (data.dueDate && typeof data.dueDate === 'string') {
    console.log("Converting dueDate from string to Date object");
    data.dueDate = new Date(data.dueDate);
  }
  
  // Auto-generate timestamps
  data.createdAt = new Date();
  data.updatedAt = new Date();
  
  console.log("Transformed data:", JSON.stringify(data, null, 2));
  return data;
}

try {
  // Apply our hook transformation
  const transformedData = beforeCreateHook({ ...frontendTodoData });
  
  // Now try schema validation
  const result = originalTodoSchema.parse(transformedData);
  console.log("✅ Schema validation passed after our fix!");
  console.log("Final result:", JSON.stringify(result, null, 2));
  console.log("dueDate type:", typeof result.dueDate);
  console.log("dueDate instance:", result.dueDate instanceof Date ? "Date" : typeof result.dueDate);
  
} catch (error) {
  console.log("❌ Fix failed:", error.errors?.[0] || error.message);
}

console.log("\n🎉 Fix validation complete!");
export {};
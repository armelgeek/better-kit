import { createReactAuthClient } from "better-auth/react";
import { createAuthClientWithCrud } from "better-auth/client";
import { auth } from "./crud-client-with-auth-example";

/**
 * Create React Auth Client with CRUD support
 */
export function createReactAuthClientWithCrud<Auth>(
  authInstance: Auth,
  options?: any
) {
  // Create the base client with CRUD support
  const baseClient = createAuthClientWithCrud(authInstance, options);
  
  // Create the React client with hooks
  const reactClient = createReactAuthClient(options);
  
  // Combine both clients
  return {
    ...baseClient,
    ...reactClient,
  };
}

// Usage example
export const authClient = createReactAuthClientWithCrud(auth, {
  baseURL: "http://localhost:3000/api/auth",
});

// Now you can use both auth hooks and CRUD methods
export function useProductList() {
  const session = authClient.useSession();
  
  // CRUD operations are available alongside React hooks
  const createProduct = async (data: any) => {
    return authClient.product.create(data);
  };
  
  const listProducts = async () => {
    return authClient.product.list();
  };
  
  return {
    session,
    createProduct,
    listProducts,
  };
}
import { createResource } from "better-query";
import type { QueryMiddlewareContext } from "better-query";
import { z } from "zod";

// Exemple de schéma pour les todos
const todoSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  completed: z.boolean().default(false),
  userId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Exemple de ressource Todo avec middleware correctement typé
export const todoResource = createResource({
  name: "todo",
  schema: todoSchema,
  // Notez l'utilisation de "middlewares" (avec un 's')
  middlewares: [
    {
      // Handler correctement typé avec QueryMiddlewareContext
      handler: async (context: QueryMiddlewareContext) => {
        console.log('Todo resource middleware triggered', context);
        
        // Exemple d'authentification avec better-auth
        // const session = await auth.api.getSession({
        //   headers: await headers()
        // });
        // console.log('Middleware session user:', session?.user);
        // context.user = session?.user;
        
        // Exemple de modification du contexte
        if (!context.user) {
          console.log('No authenticated user found');
        }
        
        // Vous pouvez modifier:
        // - context.user (utilisateur)
        // - context.scopes (permissions/rôles)  
        // - context.data (données en cours de traitement)
      }
    },
    // Vous pouvez ajouter plusieurs middlewares
    {
      handler: async (context: QueryMiddlewareContext) => {
        // Middleware pour la validation supplémentaire
        if (context.operation === 'create' && context.data) {
          // Ajouter automatiquement un timestamp
          context.data.createdAt = new Date();
        }
      }
    }
  ],
  permissions: {
    create: async (context) => !!context.user,
    update: async (context) => !!context.user,
    delete: async (context) => !!context.user,
    read: async () => true,
    list: async () => true,
  }
});

export type TodoResource = typeof todoResource;
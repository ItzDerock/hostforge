import { authController } from "./controllers/auth";
import { prepDatabase } from "./database/migrate";
import { setupController } from "./controllers/setup";
import baseApp from "./base";

// add in our routes
export const app = baseApp.use(authController).use(setupController);
export type ElysiaAPI = typeof app;

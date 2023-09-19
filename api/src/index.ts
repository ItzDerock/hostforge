import { authController } from "./controllers/auth";
import { env } from "./env";
import { prepDatabase } from "./database/migrate";
import { setupController } from "./controllers/setup";
import baseApp from "./base";

// start by prepping the database
prepDatabase();

// add in our routes
const withRoutes = baseApp.use(authController).use(setupController);
export type ElysiaWithRoutes = typeof withRoutes;

// if this is the main module, start the server
if (import.meta.main) {
  withRoutes.listen(
    {
      port: env.port,
      hostname: env.host,
    },
    (data) => {
      console.log(`🚀 listening on ${data.hostname}:${data.port}`);
    }
  );
}

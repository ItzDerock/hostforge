import { Elysia } from "elysia";
import { ElysiaLoader } from "./loader";
import { authController } from "./controllers/auth";

// const app = new ElysiaLoader(new Elysia()).load(import("./controllers/auth"));
let app = new Elysia();

app.use(authController);

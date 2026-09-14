import { handleCommand } from "./handle_command.ts";
import { handleSetup } from "./handle_setup.ts";
import { Hono } from "hono";
import type { AppEnv } from "./types.ts";

const app = new Hono<AppEnv>();

app.get("/setup", handleSetup);
app.post("*", handleCommand);
app.all("*", () => new Response(null, { status: 400 }));

export default app;

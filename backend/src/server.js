import app from "./app.js";
import { connectToDatabase } from "./config/database.js";
import env from "./config/env.js";
import { createServer } from "http";
import { attachCollaborationWebSocketServer } from "./services/collaborationSocketService.js";

connectToDatabase()
  .then(() => {
    const server = createServer(app);
    attachCollaborationWebSocketServer(server);
    server.listen(env.port, () => {
      console.log(`API server listening on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start API:", error.message);
    process.exit(1);
  });

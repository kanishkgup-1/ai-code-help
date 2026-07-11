import app from "./app.js";
import { connectToDatabase } from "./config/database.js";
import env from "./config/env.js";

connectToDatabase()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API server listening on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start API:", error.message);
    process.exit(1);
  });

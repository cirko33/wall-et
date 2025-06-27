import express from "express";
import loadConfig from "./config";

async function main() {
  const config = loadConfig(); // Load .env

  const app = express();
  const port = config.port;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start the server:", err);
  process.exit(1);
});

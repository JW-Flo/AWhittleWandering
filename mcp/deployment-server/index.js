/* eslint-disable no-console */
import express from "express";
import { execa } from "execa";

const app = express();
app.use(express.json({ limit: "1mb" }));

// POST /wranglerDeploy  { "env": "staging" }
app.post("/wranglerDeploy", async (req, res) => {
  const env = req.body?.env || "staging";
  try {
    const subprocess = execa("wrangler", ["deploy", "--env", env], {
      stdio: "inherit",
    });
    await subprocess;
    return res.json({ status: "success", env });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// Health
app.get("/health", (_, res) => res.sendStatus(200));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`deployment-server listening on ${PORT}`));

/* eslint-disable no-console */
import express from "express";
import neo4j from "neo4j-driver";

const app = express();
app.use(express.json({ limit: "5mb" }));

// Neo4j connection (optional – if env variables not set we fall back to in-memory stub)
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER;
const NEO4J_PASS = process.env.NEO4J_PASS;

let driver = null;
if (NEO4J_URI && NEO4J_USER && NEO4J_PASS) {
  driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASS));
  console.log("Connected to external Neo4j");
} else {
  console.log(
    "Running in stub mode – queries will return a placeholder response"
  );
}

// POST /query  { "cypher": "MATCH (n) RETURN n LIMIT 10" }
app.post("/query", async (req, res) => {
  const cypher = req.body?.cypher;
  if (!cypher) {
    return res.status(400).json({ error: "cypher query missing" });
  }

  // Real execution if driver present
  if (driver) {
    try {
      const session = driver.session();
      const result = await session.run(cypher);
      await session.close();
      return res.json({
        records: result.records.map((r) => r.toObject()),
        summary: result.summary,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Neo4j query failed" });
    }
  }

  // Stubbed response
  return res.json({
    stub: true,
    cypher,
    data: [],
  });
});

// Health
app.get("/health", (_, res) => res.sendStatus(200));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`knowledge-graph-server listening on ${PORT}`)
);

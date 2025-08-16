require("dotenv").config();
const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { sendTelegramMessage } = require("./telegram");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Employee API keys
const employees = [
  { name: "SIKEL", key: process.env.SIKEL_KEY },
  { name: "SINGHANIA", key: process.env.SINGHANIA_KEY },
  { name: "VAATHI", key: process.env.VAATHI_KEY },
];

let lastNotified = null; // to prevent spam

async function getCooldowns() {
  let results = [];

  for (let emp of employees) {
    try {
      let response = await fetch(
        `https://api.torn.com/user/?selections=cooldowns&key=${emp.key}`
      );
      let data = await response.json();

      if (data.error) {
        results.push({ name: emp.name, error: true });
      } else {
        results.push({
          name: emp.name,
          drug: data.cooldowns?.drug ?? 0,
        });
      }
    } catch (err) {
      results.push({ name: emp.name, error: true });
    }
  }

  return results;
}

// Endpoint for frontend
app.get("/cooldowns", async (req, res) => {
  const results = await getCooldowns();

  // Find max cooldown
  const maxEmp = results.reduce(
    (max, emp) =>
      !emp.error && emp.drug > (max?.drug || 0) ? emp : max,
    null
  );

  // Notify when 10 minutes (600s) left
  if (
    maxEmp &&
    maxEmp.drug > 0 &&
    maxEmp.drug <= 600 &&
    lastNotified !== maxEmp.name
  ) {
    sendTelegramMessage("💊✨ Your drugs gonna be delivered soon!");
    lastNotified = maxEmp.name;
  }

  res.json(results);
});

// Serve React build
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

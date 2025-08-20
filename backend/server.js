require("dotenv").config();
const express = require("express");
const cors = require("cors");   // enable CORS
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { sendTelegramMessage } = require("./telegram");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for all requests
app.use(cors());

// 🔄 Load employees dynamically from .env
// Example: SIKEL_KEY=xxx, VAATHI_KEY=yyy
const employees = Object.entries(process.env)
  .filter(([k]) => k.endsWith("_KEY"))
  .map(([k, v]) => ({
    name: k.replace("_KEY", "").replace(/_/g, " "), // BIGEL_JI_KEY → BIGEL JI
    key: v,
  }));

let lastNotified = null;

// Fetch cooldowns for all employees
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

// API endpoint: get cooldowns
app.get("/cooldowns", async (req, res) => {
  const results = await getCooldowns();

  const maxEmp = results.reduce(
    (max, emp) =>
      !emp.error && emp.drug > (max?.drug || 0) ? emp : max,
    null
  );

  if (
    maxEmp &&
    maxEmp.drug > 0 &&
    maxEmp.drug <= 0 &&
    lastNotified !== maxEmp.name
  ) {
    sendTelegramMessage(`💊✨ ${maxEmp.name}'s drugs will be ready soon!`);
    lastNotified = maxEmp.name;
  }

  res.json(results);
});

app.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);

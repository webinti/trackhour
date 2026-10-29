const fs = require("fs");
const path = require("path");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    const quoted = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);
    env[key] = value;
  }
  return env;
}

// The standalone server never reads .env files from the project root, so pm2 has
// to inject them. After editing .env.local: pm2 startOrReload ecosystem.config.cjs --update-env
module.exports = {
  apps: [
    {
      name: "trackhour",
      script: path.join(__dirname, ".next/standalone/server.js"),
      cwd: path.join(__dirname, ".next/standalone"),
      env: {
        PORT: "3003",
        HOSTNAME: "0.0.0.0",
        ...loadEnvFile(path.join(__dirname, ".env.local")),
      },
    },
  ],
};

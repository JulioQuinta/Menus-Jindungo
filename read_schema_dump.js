import fs from 'fs';
const json = JSON.parse(fs.readFileSync('schema_dump.json', 'utf8'));

if (json.definitions) {
  console.log("system_notifications:", Object.keys(json.definitions.system_notifications.properties));
} else if (json.components && json.components.schemas) {
  console.log("system_notifications:", Object.keys(json.components.schemas.system_notifications?.properties || {}));
} else {
  console.log("Unknown format", Object.keys(json));
}

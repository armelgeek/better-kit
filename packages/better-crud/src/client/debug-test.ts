import { auditClientPlugin } from "./plugins/audit";

console.log("auditClientPlugin:", auditClientPlugin);
console.log("typeof auditClientPlugin:", typeof auditClientPlugin);

const plugin = auditClientPlugin();
console.log("plugin:", plugin);
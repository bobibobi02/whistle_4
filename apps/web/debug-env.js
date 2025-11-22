// debug-env.js
require("dotenv").config();
function mask(s) { return !s ? "(empty)" : `${"*".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`; }
const show = (k) => console.log(`${k} = ${process.env[k] ? "(set)" : "(missing)"}`);
show("EMAIL_HOST"); show("EMAIL_PORT"); show("EMAIL_SECURE"); show("EMAIL_USER"); show("EMAIL_FROM");
console.log("EMAIL_PASS length =", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
if (process.env.EMAIL_PASS && /\s/.test(process.env.EMAIL_PASS)) console.log("РІС™В РїС‘РЏ EMAIL_PASS contains spaces (remove them).");
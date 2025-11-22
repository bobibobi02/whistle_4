import fs from "fs";
import path from "path";
import { execSync } from "child_process";

type ProviderName = "deepseek";
type Role = "coder" | "reviewer" | "fixer";
interface Provider { name: ProviderName; model: string; apiKey: string; call(msgs:{role:"system"|"user"|"assistant";content:string}[]):Promise<string>; }
function envOrThrow(k:string){const v=process.env[k]; if(!v) throw new Error(`Missing env ${k}`); return v;}
function run(cmd:string){ return execSync(cmd,{stdio:"pipe"}).toString(); }
function extractDiff(t:string){ const m=t.match(/```diff([\s\S]*?)```/); return m?m[1].trim():""; }
function applyUnifiedDiff(d:string){ const tmp=path.join(process.cwd(),"ai_patch.diff"); fs.writeFileSync(tmp,d,"utf8"); try{ run(`git apply --whitespace=fix ${tmp}`) } finally { fs.unlinkSync(tmp) } }

class DeepSeekProvider implements Provider {
  name:ProviderName="deepseek"; constructor(public model:string, public apiKey:string){}
  async call(messages:any[]):Promise<string>{
    const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method:"POST",
      headers:{ Authorization:`Bearer ${this.apiKey}`, "Content-Type":"application/json" },
      body:JSON.stringify({ model:this.model, messages, temperature:0.2 })
    });
    if(!r.ok) throw new Error(`DeepSeek error ${r.status} ${await r.text()}`);
    const j=await r.json(); return j.choices?.[0]?.message?.content??"";
  }
}

const SYSTEM_CODER = `You output ONLY a \`\`\`diff unified diff with minimal, production-ready edits. Prefer editing existing files in apps/web.`;
const SYSTEM_REVIEWER = `Return JSON: {"blockingIssues":[...],"nonBlocking":[...],"summary":"..."} focusing on TS/ESLint/runtime/A11y/null-guards.`;
const SYSTEM_FIXER = `Output ONLY a \`\`\`diff unified diff fixing the listed blockingIssues; no unrelated edits.`;

async function callRole(p:Provider, role:Role, content:string){
  const sys = role==="coder"?SYSTEM_CODER:role==="reviewer"?SYSTEM_REVIEWER:SYSTEM_FIXER;
  return p.call([{role:"system",content:sys},{role:"user",content}]);
}
function repoContext(){
  try { return "Repo key files (truncated):\n" + run('git ls-files "apps/web/pages/**/*.tsx" "apps/web/components/**/*.tsx" "apps/web/**/*.ts" "prisma/**/*.prisma" | head -n 200'); }
  catch { return "Repo key files:\n" + run('git ls-files "apps/web/pages/**/*.tsx" "apps/web/components/**/*.tsx" "apps/web/**/*.ts" "prisma/**/*.prisma"'); }
}

async function main(){
  const MAX_ROUNDS = Number(process.env.AI_MAX_ROUNDS ?? 3);
  const task = process.argv.slice(2).join(" ").trim() || "Remove Save on comments; unify post-detail reaction bar with feed; stop image flash after comment edit.";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const key   = envOrThrow("DEEPSEEK_API_KEY");
  const coder:Provider    = new DeepSeekProvider(model, key);
  const reviewer:Provider = new DeepSeekProvider(model, key);

  const status = run("git status --porcelain"); if(status.trim()) throw new Error("Working tree not clean. Commit/stash before running.");

  for(let round=1; round<=MAX_ROUNDS; round++){
    console.log(`\n=== ROUND ${round}/${MAX_ROUNDS} ===`);
    const coderReq = `Task:\n${task}\n\nContext:\n${repoContext()}\n\nReturn a unified diff.`;
    const diff = extractDiff(await callRole(coder,"coder",coderReq));
    if(!diff) throw new Error("Coder didn't return a diff.");
    applyUnifiedDiff(diff);

    let failed=false;
    try{ console.log(run("npm --prefix apps/web run lint")); }catch{ failed=true }
    try{ console.log(run("npm --prefix apps/web run typecheck")); }catch{ failed=true }
    try{ console.log(run("npm --prefix apps/web run test --silent")); }catch{ failed=true }
    if(!failed){ console.log("✅ All checks passed."); process.exit(0); }

    const gitDiff = run("git diff --staged || true; git diff || true");
    let reviewJSON:any;
    try{
      reviewJSON = JSON.parse(await callRole(reviewer,"reviewer",`Task:\n${task}\n\nPatch:\n\`\`\`diff\n${gitDiff}\n\`\`\`\nReturn blockingIssues.`));
    } catch {
      reviewJSON = {blockingIssues:["Parse error in reviewer JSON"], nonBlocking:[], summary:""};
    }
    if(!reviewJSON.blockingIssues?.length){ console.log("⚠️ Reviewer found no blocking issues but checks failed."); process.exit(1); }

    const fixDiff = extractDiff(await callRole(coder,"fixer",`Blocking issues:\n${JSON.stringify(reviewJSON.blockingIssues,null,2)}\nReturn unified diff.`));
    if(!fixDiff) throw new Error("Fixer didn't return a diff.");
    applyUnifiedDiff(fixDiff);

    failed=false;
    try{ console.log(run("npm --prefix apps/web run lint")); }catch{ failed=true }
    try{ console.log(run("npm --prefix apps/web run typecheck")); }catch{ failed=true }
    try{ console.log(run("npm --prefix apps/web run test --silent")); }catch{ failed=true }
    if(!failed){ console.log("✅ All checks passed after fixes."); process.exit(0); }
  }
  console.log("⏱️ Reached max rounds without green checks."); process.exit(2);
}
main().catch(e=>{ console.error(e); process.exit(1); });

const { PrismaClient } = require("@prisma/client");
const crypto = require("node:crypto");
const prisma = new PrismaClient();

const genId = () => crypto.randomBytes(16).toString("hex");
const nowIso = () => new Date().toISOString();

async function cols(table){ try { return await prisma.$queryRawUnsafe(`PRAGMA table_info('${table}')`);} catch{ return []; } }
const has = (cs,n)=> cs.some(c=>String(c.name).toLowerCase()===n.toLowerCase());

async function ensureUser(){
  const u = await prisma.user.upsert({
    where:{ email:"demo@example.com" }, update:{},
    create:{ email:"demo@example.com", name:"Demo User", passwordHash:"dev" }
  });
  return { id: u.id, email: u.email };
}
async function ensureForum(){
  for (const key of ["subforum","forum","community"]){
    if (!prisma[key]) continue;
    try{ await prisma[key].upsert({ where:{ title:"General" }, update:{}, create:{ title:"General", description:"Default forum" } }); return; }catch{}
    try{ await prisma[key].upsert({ where:{ name:"General"  }, update:{}, create:{ name:"General",  description:"Default forum" } }); return; }catch{}
    try{ await prisma[key].create({ data:{ title:"General", description:"Default forum" } }); return; }catch{}
    try{ await prisma[key].create({ data:{ name:"General",  description:"Default forum" } }); return; }catch{}
  }
}
function forumKeysInPost(p){
  if (has(p,"subforumId")||has(p,"subforumid")) return { idCol:"subforumId", nameCol:"subforumName", table:"Subforum" };
  if (has(p,"forumId")||has(p,"forumid"))       return { idCol:"forumId",    nameCol:"forumName",    table:"Forum" };
  if (has(p,"communityId")||has(p,"communityid")) return { idCol:"communityId", nameCol:"communityName", table:"Community" };
  return { idCol:null, nameCol:null, table:null };
}

async function insertPost(user){
  const p = await cols("Post");
  const { idCol, nameCol, table } = forumKeysInPost(p);

  let forumId = null, forumName = "General";
  if (table){
    try{
      const r = await prisma.$queryRawUnsafe(`SELECT id, COALESCE(title,name) as label FROM ${table} WHERE name='General' OR title='General' ORDER BY rowid DESC LIMIT 1`);
      forumId = r?.[0]?.id ?? null;
      forumName = r?.[0]?.label ?? "General";
    }catch{}
  }

  const cl=[], vl=[], params=[];
  if (has(p,"id")){ cl.push("id"); vl.push("?"); params.push(genId()); }
  if (has(p,"title")){ cl.push("title"); vl.push("?"); params.push("Hello from Whistle"); }
  if (has(p,"body")) { cl.push("body");  vl.push("?"); params.push("Seeded from seed"); }
  if (has(p,"userId")||has(p,"userid")){ cl.push(has(p,"userId")?"userId":"userid"); vl.push("?"); params.push(user.id); }
  if (has(p,"userEmail")||has(p,"useremail")){ cl.push(has(p,"userEmail")?"userEmail":"useremail"); vl.push("?"); params.push(user.email); }
  if (idCol && has(p,idCol) && forumId){ cl.push(idCol); vl.push("?"); params.push(forumId); }
  if (nameCol && has(p,nameCol)){ cl.push(nameCol); vl.push("?"); params.push(forumName); }
  if (has(p,"createdAt")||has(p,"createdat")){ cl.push(has(p,"createdAt")?"createdAt":"createdat"); vl.push("?"); params.push(nowIso()); }
  if (has(p,"updatedAt")||has(p,"updatedat")){ cl.push(has(p,"updatedAt")?"updatedAt":"updatedat"); vl.push("?"); params.push(nowIso()); }

  await prisma.$executeRawUnsafe(`INSERT INTO Post (${cl.join(",")}) VALUES (${vl.join(",")})`, ...params);
}

async function main(){
  const user = await ensureUser();
  await ensureForum();

  try{
    await prisma.post.create({
      data:{ title:"Hello from Whistle", body:"Seeded from seed", user:{ connect:{ email:user.email } } }
    });
    console.log("✓ Seeded via Prisma");
    return;
  }catch{}

  await insertPost(user);
  console.log("✓ Seeded via RAW");
}
main().catch(e=>{ console.error("Seed failed:", e); process.exit(1); })
  .finally(async()=> prisma.$disconnect());

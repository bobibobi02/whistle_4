// src/lib/plugins/manager.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export type PluginConfig = Record<string, unknown>;
export type Plugin = { key: string; enabled: boolean; config: PluginConfig | null };

export async function listPlugins(): Promise<Plugin[]> {
  try {
    // @ts-ignore optional model
    if (prisma.plugin?.findMany) {
      // @ts-ignore
      const rows = await prisma.plugin.findMany();
      return rows.map((r: any) => ({
        key: String(r.key),
        enabled: Boolean(r.enabled),
        config: (r.config ?? null) as PluginConfig | null,
      }));
    }
  } catch {}
  return []; // fallback
}

export async function setPluginEnabled(key: string, enabled: boolean): Promise<Plugin | null> {
  try {
    // @ts-ignore
    if (prisma.plugin?.update) {
      // @ts-ignore
      const r = await prisma.plugin.update({ where: { key }, data: { enabled } });
      return { key: String(r.key), enabled: Boolean(r.enabled), config: (r.config ?? null) as any };
    }
  } catch {}
  return null;
}

export async function setPluginConfig(key: string, config: PluginConfig): Promise<Plugin | null> {
  try {
    // @ts-ignore
    if (prisma.plugin?.update) {
      // @ts-ignore
      const r = await prisma.plugin.update({ where: { key }, data: { config } });
      return { key: String(r.key), enabled: Boolean(r.enabled), config: (r.config ?? null) as any };
    }
  } catch {}
  return null;
}

export async function enabledPlugins(): Promise<Plugin[]> {
  try {
    // @ts-ignore
    if (prisma.plugin?.findMany) {
      // @ts-ignore
      const rows = await prisma.plugin.findMany({ where: { enabled: true } });
      return rows.map((r: any) => ({
        key: String(r.key),
        enabled: Boolean(r.enabled),
        config: (r.config ?? null) as PluginConfig | null,
      }));
    }
  } catch {}
  return [];
}

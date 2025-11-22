import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import path from "path";
import os from "os";
import { promises as fs } from "fs";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Ensure final destination exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // Ensure a temp dir exists for formidable to write the upload first
    const tempDir = path.join(os.tmpdir(), "whistle-uploads");
    await fs.mkdir(tempDir, { recursive: true });

    const form = formidable({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
      uploadDir: tempDir, // <-- critical so .filepath is always present
    });

    const { files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });

    // Accept common field names or the first file
    let f: File | File[] | undefined =
      (files as any).file ||
      (files as any).image ||
      (Object.values(files)[0] as any);

    if (!f) {
      return res.status(400).json({ error: "No file received. Expect field 'file' or 'image'." });
    }

    // If formidable returns arrays, take the first item
    const fileObj: File = Array.isArray(f) ? f[0] : f;

    // New formidable uses .filepath, older used .path
    const tempPath: string | undefined = (fileObj as any).filepath || (fileObj as any).path;
    if (!tempPath || typeof tempPath !== "string") {
      // Debug tip: log the object once (comment out in production)
      // console.error("File object missing filepath/path:", fileObj);
      return res.status(400).json({ error: "Upload failed: missing temporary file path." });
    }

    const extFromName = path.extname(fileObj.originalFilename || "");
    const extFromTemp = path.extname(tempPath);
    const ext = (extFromName || extFromTemp || ".bin").toLowerCase();
    const filename = `whistle_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const destPath = path.join(uploadDir, filename);

    // Copy then unlink (cross-device safe)
    await fs.copyFile(tempPath, destPath);
    try { await fs.unlink(tempPath); } catch {}

    const url = `/uploads/${filename}`;
    return res.status(200).json({ url });
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err?.message || "Upload failed." });
  }
}

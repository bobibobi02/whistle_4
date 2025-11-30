// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File, type Files } from "formidable";
import fs from "fs/promises";
import os from "os";

export const config = {
  api: {
    bodyParser: false,
  },
};

type UploadResponse = {
  success?: boolean;
  url?: string;
  error?: string;
};

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

function pickFirstFile(files: Files): File | undefined {
  const pick = (key: string) => {
    const value = (files as any)[key] as File | File[] | undefined;
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  };

  // Try common field names first
  const named =
    pick("file") ||
    pick("image") ||
    pick("media");

  if (named) return named;

  // Fallback – first value in the files object
  const first = Object.values(files)[0] as File | File[] | undefined;
  if (!first) return undefined;

  if (Array.isArray(first)) {
    return first[0];
  }

  return first;
}

async function parseUpload(req: NextApiRequest): Promise<File> {
  const form = formidable({
    multiples: false,
    uploadDir: os.tmpdir(),
    keepExtensions: true,
    maxFileSize: MAX_FILE_SIZE,
  });

  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      const file = pickFirstFile(files);
      if (!file) return reject(new Error("No file uploaded"));
      resolve(file);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const file = await parseUpload(req);

    const filepath = (file as any).filepath || (file as any).path;
    if (!filepath) {
      throw new Error("Uploaded file has no temp filepath");
    }

    const buffer = await fs.readFile(filepath);
    const mime = file.mimetype || "image/png";

    // Store as data URL in the DB - works on Vercel and locally
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    return res.status(200).json({
      success: true,
      url: dataUrl,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Upload failed",
    });
  }
}

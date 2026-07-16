import { Router, Request, Response } from "express"
import { v2 as cloudinary } from "cloudinary"
import multer from "multer"
import { authenticate } from "../config/db.js"

const router = Router()
const storage = multer.memoryStorage()
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Unsupported file type. Allowed: JPEG, PNG, WEBP, PDF."))
      return
    }
    cb(null, true)
  },
})

// POST /api/upload — Upload file to Cloudinary
router.post("/", authenticate, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return }

    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
    const uploadResponse = await cloudinary.uploader.upload(fileStr, { folder: "gym_saas_uploads" })

    res.json({ url: uploadResponse.secure_url, publicId: uploadResponse.public_id })
  } catch (err: any) {
    console.error("Cloudinary upload error:", err)
    res.status(500).json({ error: err.message || "Upload failed" })
  }
})

export default router

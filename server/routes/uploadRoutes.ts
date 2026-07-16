import { Router, Request, Response } from "express"
import { v2 as cloudinary } from "cloudinary"
import multer from "multer"

const router = Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

// POST /api/upload — Upload file to Cloudinary
router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return }

    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
    const uploadResponse = await cloudinary.uploader.upload(fileStr, { folder: "gym_saas_uploads" })

    res.json({ url: uploadResponse.secure_url, publicId: uploadResponse.public_id })
  } catch (err: any) {
    console.error("Cloudinary upload error:", err)
    res.status(500).json({ error: "Upload failed" })
  }
})

export default router

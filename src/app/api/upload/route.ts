import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
        return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 })
    }

    // Upload to Cloudinary
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)
    uploadFormData.append("upload_preset", "gym_saas")
    uploadFormData.append("api_key", apiKey)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: uploadFormData,
    })

    if (!res.ok) {
        const err = await res.json()
        return NextResponse.json({ error: err.error?.message || "Upload failed" }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({
        url: data.secure_url,
        publicId: data.public_id,
    })
}

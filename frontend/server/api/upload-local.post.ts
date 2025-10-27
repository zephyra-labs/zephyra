// server/api/upload-local.post.ts
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { readMultipartFormData } from 'h3'

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)
  const file = files?.[0]
  if (!file) throw new Error('No file uploaded')

  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })

  const originalName = (file as any).filename ?? 'file.bin'
  const ext = originalName.split('.').pop() ?? 'bin'
  const filename = `${uuidv4()}.${ext}`
  const filePath = join(uploadsDir, filename)

  await writeFile(filePath, file.data)

  const host = process.env.HOST_URL || 'http://localhost:3000'
  return {
    success: true,
    url: `${host}/uploads/${filename}`,
  }
})

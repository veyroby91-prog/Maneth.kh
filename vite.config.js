import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

// Vite plugin to handle image uploads to /public/uploads/ without requiring an external database
const imageUploadPlugin = () => {
  const uploadDir = path.resolve(process.cwd(), 'public/uploads')

  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const safeName = `fabric-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`
      cb(null, safeName)
    }
  })

  const fileFilter = (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']

    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('ប្រភេទរូបភាពមិនត្រឹមត្រូវ! គាំទ្រតែទម្រង់ JPG, JPEG, PNG, និង WEBP ប៉ុណ្ណោះ។'))
    }
  }

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  }).single('image')

  return {
    name: 'cheynet-image-upload-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Handle image upload endpoint
        if (req.url === '/api/upload' && req.method === 'POST') {
          upload(req, res, (err) => {
            if (err) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({
                success: false,
                message: err.message || 'ការបញ្ចូលរូបភាពបរាជ័យ (Upload Error)'
              }))
            }

            if (!req.file) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({
                success: false,
                message: 'មិនមានឯកសាររូបភាពត្រូវបានជ្រើសរើសឡើយ'
              }))
            }

            // Return full relative path for frontend display and storage
            const relativePath = `/uploads/${req.file.filename}`

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({
              success: true,
              filePath: relativePath,
              url: relativePath,
              filename: req.file.filename,
              originalName: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype
            }))
          })
        } else {
          next()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    imageUploadPlugin(),
  ],
})

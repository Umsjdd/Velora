import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import auth from '../middleware/auth.js';
import { checkLimit } from '../middleware/planLimits.js';
import { isProviderConfigured } from '../providers/utils.js';
import r2 from '../providers/r2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: path.join(__dirname, '..', '..', 'uploads') });

const router = Router();
router.use(auth);

// GET / - List user's files
router.get('/', async (req, res) => {
  try {
    const files = await req.prisma.storageFile.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch files' });
  }
});

// POST /upload - Upload file
router.post('/upload', checkLimit('storage'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    let r2Key = null;

    if (isProviderConfigured('r2')) {
      // Upload to R2
      const key = r2.generateKey(req.user.id, req.file.originalname);
      const fileBuffer = fs.readFileSync(req.file.path);
      await r2.uploadFile(key, fileBuffer, req.file.mimetype);
      r2Key = key;

      // Clean up temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // ignore cleanup errors
      }
    }

    const file = await req.prisma.storageFile.create({
      data: {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        path: r2Key ? '' : req.file.path,
        userId: req.user.id,
        r2Key,
      },
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'uploaded',
        resource: 'file',
        details: `Uploaded file "${req.file.originalname}" (${formatFileSize(req.file.size)})`,
        userId: req.user.id,
      },
    });

    res.status(201).json({ success: true, data: file });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

// GET /:id/download - Get download URL
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const file = await req.prisma.storageFile.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    if (file.r2Key && isProviderConfigured('r2')) {
      const url = await r2.getDownloadUrl(file.r2Key);
      return res.json({ success: true, data: { url } });
    }

    // Fallback: serve local file
    if (file.path && fs.existsSync(file.path)) {
      return res.download(file.path, file.name);
    }

    res.status(404).json({ success: false, error: 'File not available for download' });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ success: false, error: 'Failed to get download URL' });
  }
});

// DELETE /:id - Delete file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await req.prisma.storageFile.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Delete from R2 if stored there
    if (existing.r2Key && isProviderConfigured('r2')) {
      try {
        await r2.deleteFile(existing.r2Key);
      } catch (r2Err) {
        console.error('Failed to delete file from R2:', r2Err);
      }
    }

    // Remove local file if exists
    if (existing.path) {
      try {
        if (fs.existsSync(existing.path)) {
          fs.unlinkSync(existing.path);
        }
      } catch (fsError) {
        console.error('Failed to delete file from filesystem:', fsError);
      }
    }

    await req.prisma.storageFile.delete({ where: { id } });

    await req.prisma.activityLog.create({
      data: {
        action: 'deleted',
        resource: 'file',
        details: `Deleted file "${existing.name}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: { message: 'File deleted' } });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete file' });
  }
});

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export default router;

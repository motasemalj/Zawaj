import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST single photo (for onboarding)
router.post('/', upload.single('photo'), async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.userId!;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided' });
    
    const ordering = parseInt(req.body.ordering || '0', 10);
    
    // Save photo
    const fileName = `${userId}-${Date.now()}-${ordering}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    const img = sharp(file.buffer).rotate();
    const metadata = await img.metadata();
    const maxDim = 1440;
    
    if ((metadata.width || 0) > maxDim || (metadata.height || 0) > maxDim) {
      await img.resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toFile(filePath);
    } else {
      await img.jpeg({ quality: 90 }).toFile(filePath);
    }
    
    const url = `/uploads/${fileName}`;
    
    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        userId,
        url,
        ordering,
        blurred: false
      }
    });
    
    res.json({ ok: true, photo });
  } catch (e) {
    next(e);
  }
});

router.put('/me/photos', upload.array('photos', 5), async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files' });

    // On-device pre-check and server NSFW omitted; pretend ok for MVP local
    // const nsfw = false; if detected -> reject

    // Append up to 5 photos (do not delete existing)
    const existing = await prisma.photo.findMany({ where: { userId: me.id }, orderBy: { ordering: 'asc' } });
    let nextOrder = existing.length;
    if (nextOrder >= 5) return res.status(400).json({ error: 'Maximum 5 photos allowed' });

    const remaining = 5 - nextOrder;
    const filesToSave = files.slice(0, remaining);

    const saved: { url: string; ordering: number }[] = [];
    for (const f of filesToSave) {
      const fileName = `${me.id}-${Date.now()}-${nextOrder}.jpg`;
      const filePath = path.join(uploadsDir, fileName);
      const img = sharp(f.buffer).rotate();
      const metadata = await img.metadata();
      const maxDim = 1440;
      const w = metadata.width || maxDim;
      const h = metadata.height || maxDim;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      await img
        .resize(Math.round(w * scale), Math.round(h * scale), { fit: 'inside' })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(filePath);
      saved.push({ url: `/uploads/${fileName}`, ordering: nextOrder });
      nextOrder++;
    }

    if (saved.length > 0) {
      await prisma.$transaction(
        saved.map((p) => prisma.photo.create({ data: { userId: me.id, url: p.url, ordering: p.ordering } }))
      );
    }

    const photos = await prisma.photo.findMany({ where: { userId: me.id }, orderBy: { ordering: 'asc' } });
    res.json({ photos });
  } catch (e) {
    next(e);
  }
});

router.put('/me/photos/privacy', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const { blur }: any = req.body ?? {};
    const blurred = !!blur;
    await prisma.photo.updateMany({ where: { userId: me.id }, data: { blurred } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.put('/me/reorder', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const { order }: { order: Array<{ id: string; order: number }> } = req.body;
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Invalid order array' });
    }
    
    // Update ordering for each photo
    await prisma.$transaction(
      order.map(({ id, order: newOrder }) =>
        prisma.photo.updateMany({
          where: { id, userId: me.id },
          data: { ordering: newOrder }
        })
      )
    );
    
    const photos = await prisma.photo.findMany({ 
      where: { userId: me.id }, 
      orderBy: { ordering: 'asc' } 
    });
    
    res.json({ ok: true, photos });
  } catch (e) { 
    next(e); 
  }
});

router.delete('/me/photos/:photoId', async (req: AuthedRequest, res, next) => {
  try {
    const me = req.user!;
    const { photoId } = req.params;
    
    const photo = await prisma.photo.findFirst({ where: { id: photoId, userId: me.id } });
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    
    // Delete file from disk
    const filePath = path.join(process.cwd(), photo.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await prisma.photo.delete({ where: { id: photoId } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;


const ImageRegister = require('../models/imageRegister');
const User = require('../models/user');

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB after decode

// Accepts a data URI like "data:image/png;base64,iVBORw0..." OR a raw base64 string.
// Returns { contentType, buffer } or throws an Error with a user-friendly message.
function decodeBase64Image(input) {
    if (typeof input !== 'string' || !input.length) {
        throw new Error('base64 payload is required');
    }

    let contentType = 'image/png';
    let payload = input.trim();

    const match = payload.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
    if (match) {
        contentType = match[1].toLowerCase();
        payload = match[2];
    }

    if (!ALLOWED_MIME.has(contentType)) {
        throw new Error(`Unsupported image type: ${contentType}`);
    }

    const buffer = Buffer.from(payload, 'base64');
    if (buffer.length === 0) {
        throw new Error('Decoded image is empty — invalid base64 string');
    }
    if (buffer.length > MAX_BYTES) {
        throw new Error(`Image too large (${buffer.length} bytes, max ${MAX_BYTES})`);
    }
    return { contentType, buffer };
}

// POST /api/images/upload
// Body: { base64: "data:image/png;base64,...", filename?, purpose? }
// Decodes the base64 string and stores the resulting binary in the image_registers
// collection. If purpose === 'profile' the user's profilePicture is updated to
// point to this image's URL so the existing UI keeps working.
exports.uploadBase64 = async (req, res) => {
    try {
        const { base64, filename = '', purpose = 'profile' } = req.body || {};
        const { contentType, buffer } = decodeBase64Image(base64);

        const image = await ImageRegister.create({
            user: req.user.id,
            purpose,
            contentType,
            size: buffer.length,
            filename: String(filename || '').slice(0, 200),
            data: buffer
        });

        if (purpose === 'profile') {
            const url = `/api/images/${image._id}`;
            await User.findByIdAndUpdate(req.user.id, { profilePicture: url });
        }

        res.status(201).json({
            success: true,
            image: {
                id: image._id,
                url: `/api/images/${image._id}`,
                contentType,
                size: image.size,
                purpose,
                filename: image.filename,
                createdAt: image.createdAt
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET /api/images/:id  →  raw image binary with the right Content-Type header.
exports.getById = async (req, res) => {
    try {
        const image = await ImageRegister.findById(req.params.id);
        if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

        res.set('Content-Type', image.contentType);
        res.set('Content-Length', String(image.size));
        res.set('Cache-Control', 'private, max-age=300');
        res.send(image.data);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/images/me  →  metadata for the current user's latest profile image.
exports.getMyLatest = async (req, res) => {
    try {
        const image = await ImageRegister.findOne({ user: req.user.id, purpose: 'profile' })
            .sort({ createdAt: -1 })
            .select('-data');
        if (!image) return res.status(404).json({ success: false, message: 'No image found' });
        res.json({
            success: true,
            image: {
                id: image._id,
                url: `/api/images/${image._id}`,
                contentType: image.contentType,
                size: image.size,
                purpose: image.purpose,
                filename: image.filename,
                createdAt: image.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/images  →  list of metadata for the current user's images (no binary).
exports.listMine = async (req, res) => {
    try {
        const images = await ImageRegister.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select('-data');
        res.json({
            success: true,
            images: images.map((i) => ({
                id: i._id,
                url: `/api/images/${i._id}`,
                contentType: i.contentType,
                size: i.size,
                purpose: i.purpose,
                filename: i.filename,
                createdAt: i.createdAt
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/images/:id
exports.deleteById = async (req, res) => {
    try {
        const image = await ImageRegister.findById(req.params.id);
        if (!image) return res.status(404).json({ success: false, message: 'Image not found' });
        if (String(image.user) !== String(req.user.id) && !['admin', 'super-admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        await image.deleteOne();
        res.json({ success: true, message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

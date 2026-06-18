const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const EmployeeInfo = require('../models/employeeInfo');
const ImageRegister = require('../models/imageRegister');

const ALLOWED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
    if (!ALLOWED_IMAGE_MIME.has(contentType)) {
        throw new Error(`Unsupported image type: ${contentType}`);
    }
    const buffer = Buffer.from(payload, 'base64');
    if (buffer.length === 0) throw new Error('Decoded image is empty — invalid base64 string');
    if (buffer.length > MAX_IMAGE_BYTES) throw new Error(`Image too large (${buffer.length} bytes, max ${MAX_IMAGE_BYTES})`);
    return { contentType, buffer };
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REGISTER_TOKEN_EXPIRY = '60m';
const REGISTER_TOKEN_EXPIRY_MINUTES = 60;

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};

exports.createSuperAdmin = async (req, res) => {
    try {
        const existing = await User.findOne({ role: 'super-admin' });
        if (existing) {
            return res.status(400).json({ message: "Super admin already exists" });
        }

        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'super-admin'
        });

        res.status(201).json({
            message: "Super admin created",
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getRegisterToken = async (req, res) => {
    try {
        const crypto = require('crypto');
        const secretKey = crypto.randomBytes(32).toString('hex');

        const registerToken = jwt.sign(
            { purpose: 'registration', secretKey, type: 'register' },
            process.env.JWT_SECRET,
            { expiresIn: REGISTER_TOKEN_EXPIRY }
        );

        const expiresAt = new Date(Date.now() + REGISTER_TOKEN_EXPIRY_MINUTES * 60 * 1000);

        res.json({
            success: true,
            message: `Register token generated. Valid for ${REGISTER_TOKEN_EXPIRY_MINUTES} minutes.`,
            registerToken,
            expiresAt: expiresAt.toISOString()
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

exports.register = async (req, res) => {
    try {
        const registerToken = req.headers['x-register-token'] || req.body.registerToken;

        if (!registerToken) {
            return res.status(401).json({ success: false, message: "Register token required in x-register-token header" });
        }

        let decoded;
        try {
            decoded = jwt.verify(registerToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired register token" });
        }

        if (decoded.type !== 'register') {
            return res.status(400).json({ success: false, message: "Wrong token type" });
        }

        const { name, email, password, empId, department, designation, role, employeeInfo } = req.body;
        // image can sit at the top level OR inside employeeInfo.administration (right after oldEmployeeCode).
        const image = req.body.image
            || (employeeInfo && employeeInfo.administration && employeeInfo.administration.image)
            || null;
        if (employeeInfo && employeeInfo.administration && employeeInfo.administration.image) {
            delete employeeInfo.administration.image;
        }

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "name, email, and password are required" });
        }

        if (!employeeInfo || !employeeInfo.employeeCode) {
            return res.status(400).json({ success: false, message: "employeeInfo.employeeCode is required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const codeExists = await EmployeeInfo.findOne({ employeeCode: employeeInfo.employeeCode });
        if (codeExists) {
            return res.status(400).json({ success: false, message: "Employee Code already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'employee',
            empId,
            department,
            designation
        });

        let info;
        try {
            const infoData = { ...employeeInfo };
            delete infoData.user;
            delete infoData._id;
            info = await EmployeeInfo.create({ ...infoData, user: user._id });
        } catch (err) {
            await User.findByIdAndDelete(user._id);
            return res.status(400).json({ success: false, message: "Failed to create employee info", error: err.message });
        }

        let imageDoc = null;
        if (image) {
            try {
                const base64Input = typeof image === 'string' ? image : image.base64;
                if (base64Input) {
                    const { contentType, buffer } = decodeBase64Image(base64Input);
                    imageDoc = await ImageRegister.create({
                        user: user._id,
                        purpose: 'profile',
                        contentType,
                        size: buffer.length,
                        filename: (image && image.filename) ? String(image.filename).slice(0, 200) : '',
                        data: buffer
                    });
                    user.profilePicture = `/api/images/${imageDoc._id}`;
                    await user.save();
                }
            } catch (err) {
                await EmployeeInfo.findByIdAndDelete(info._id);
                await User.findByIdAndDelete(user._id);
                return res.status(400).json({ success: false, message: `Failed to decode/store image: ${err.message}` });
            }
        }

        res.status(201).json({
            success: true,
            message: "User registered with employee information",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                empId: user.empId,
                department: user.department,
                designation: user.designation,
                profilePicture: user.profilePicture
            },
            employeeInfo: info,
            image: imageDoc ? {
                id: imageDoc._id,
                url: `/api/images/${imageDoc._id}`,
                contentType: imageDoc.contentType,
                size: imageDoc.size,
                filename: imageDoc.filename
            } : null
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "Account is inactive" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                designation: user.designation
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        if (decoded.type !== 'refresh') {
            return res.status(400).json({ message: "Wrong token type" });
        }

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: "Refresh token not recognized" });
        }

        const newAccessToken = generateAccessToken(user);

        res.json({
            message: "Access token refreshed",
            accessToken: newAccessToken
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.verifyToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ valid: false, message: "User not found" });
        }
        res.json({ valid: true, user });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.refreshToken = null;
        await user.save();

        res.json({ message: "Password changed successfully. Please login again." });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -refreshToken')
            .populate('manager', 'name email');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const editableFields = [
            'address', 'contactNumber', 'emergencyContact', 'bankDetails',
            'profilePicture', 'businessEntity', 'employeeType', 'dateOfBirth',
            'dateOfJoining', 'confirmationDate', 'grade', 'service', 'nextShift',
            'reportingManager', 'designation', 'department', 'role'
        ];

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        editableFields.forEach((field) => {
            if (req.body[field] !== undefined) user[field] = req.body[field];
        });

        await user.save();

        const safeUser = user.toObject();
        delete safeUser.password;
        delete safeUser.refreshToken;

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: safeUser
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

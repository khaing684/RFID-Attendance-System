const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists with proper permissions
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
}

// Set storage engine
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        console.log('File upload destination:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        console.log('Original filename:', file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${path.parse(file.originalname).name}-${uniqueSuffix}${path.extname(file.originalname)}`;
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

// Check file type
function checkFileType(file, cb) {
    console.log('Checking file type:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase()
    });
    
    // Check extension
    const extname = path.extname(file.originalname).toLowerCase();
    const isCSV = extname === '.csv';
    
    if (isCSV) {
        return cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed!'));
    }
}

// Create multer instance
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1 // Only allow 1 file
    },
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('file'); // Explicitly set the field name to 'file'

// Wrap multer middleware to handle errors
const uploadMiddleware = (req, res, next) => {
    console.log('Upload middleware started');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            // A Multer error occurred when uploading
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ message: 'Too many files. Only one file is allowed.' });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ message: 'Unexpected file field. Please use the field name "file".' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            console.error('Unknown error:', err);
            // An unknown error occurred
            return res.status(400).json({ message: err.message });
        }

        // Check if file was uploaded
        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded. Please select a CSV file.' });
        }

        console.log('File uploaded successfully:', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Everything went fine
        next();
    });
};

module.exports = uploadMiddleware; 
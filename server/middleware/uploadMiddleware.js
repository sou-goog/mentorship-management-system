// server/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path'); // Built-in Node.js module
const fs = require('fs');     // Built-in Node.js module

// Define the storage location and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/'); // Resolve path relative to current file

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create a unique filename to avoid overwrites: fieldname-timestamp.extension
    // Example: supportingDoc-1609459200000.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only certain file types (optional but recommended)
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  // Check the extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  // Check the mimetype
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: File type not allowed! Only jpeg, jpg, png, pdf, doc, docx are allowed.'), false);
  }
};

// Configure multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB file size limit (adjust as needed)
  },
  fileFilter: fileFilter
});

module.exports = upload;
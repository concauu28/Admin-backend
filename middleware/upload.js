const multer = require('multer');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter: Allow specific file types and fix encoding
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4/; // Extendable list of file types
  const extName = allowedTypes.test(file.originalname.toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'));
  }
};

// Multer middleware with filename encoding fix
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10 MB
  fileFilter: (req, file, cb) => {
    // Re-encode the original name from latin1 to utf8
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, true);
  },
});

module.exports = upload;

const multer = require("multer");
const path = require("path");
const ErrorHandler = require("../errorHandler");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const rootDir = path.dirname(require.main.filename);
        cb(null, path.join(rootDir, "/public/pdfFiles"));
    },

    filename: function (req, file, cb) {
        const extension = "pdf"; // You can modify this if needed
        req.savedPdfFile = "pdf_user_" + req.user.id + "_" + Date.now() + "." + extension;
        cb(null, req.savedPdfFile);
    },
});

const fileFilter = (req, file, cb) => {
    // Define allowed MIME types for PDF files
    const allowedMimeTypes = ["application/pdf"];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new ErrorHandler("Please provide a valid PDF file", 400), false);
    }

    cb(null, true);
};

const pdfUpload = multer({ storage, fileFilter });

module.exports = pdfUpload;
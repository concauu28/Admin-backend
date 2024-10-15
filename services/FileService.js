const { S3Client, PutObjectCommand, GetObjectCommand,DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const pool = require('../db'); 

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadDocService = async (req) => {
  try {
    if (!req.file) {
      return {
        EC: 1,
        message: 'No file uploaded',
      };
    }

    const { buffer, originalname, mimetype } = req.file;
    const { email } = req.body; // Extract email from request body
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
            // Save document info to the database
    const savedDocument = await saveDocumentInfo(email, originalname);

    if (!savedDocument) {
        return {
          EC: 1,
            message: 'Error saving document info',
          };
        }


    // Upload the file to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: originalname,
      Body: buffer,
      ContentType: mimetype,
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    await s3.send(uploadCommand); // Wait for upload to complete
    return {
      EC: 0,
      message: 'Document uploaded successfully',
      data: savedDocument,
    };
  } catch (error) {
    console.error('Error uploading document:', error.message);
    return {
      EC: 2,
      message: 'Error uploading document',
    };
  }
};

// Save document info to the database
const saveDocumentInfo = async (userEmail, documentName) => {
  try {
    const query = `
      INSERT INTO documents (user_email, document_name)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const values = [userEmail, documentName];
    const result = await pool.query(query, values);

    console.log('Đã lưu thông tin tài liệu:', result.rows[0]);
    return result.rows[0]; // Trả về hàng vừa được chèn
  } catch (error) {
    console.error('Lỗi khi lưu thông tin tài liệu:', error.message);
    throw new Error('Lỗi khi lưu thông tin tài liệu vào cơ sở dữ liệu');
  }
};

const getDocumentService = async (email) => {
  try {
    const query = `
      SELECT document_name
      FROM documents
      WHERE user_email = $1;
    `;

    const values = [email];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return {
        EC: 1,
        message: 'Không tìm thấy tài liệu cho người dùng này.',
      };
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    // Generate signed URLs for each document
    const documentsWithSignedUrls = await Promise.all(
      result.rows.map(async (doc) => {
        const getObjectParams = {
          Bucket: bucketName,
          Key: doc.document_name,
        };

        const signedUrl = await getSignedUrl(
          s3, 
          new GetObjectCommand(getObjectParams), 
          { expiresIn: 3600 } // URL expires in 1 hour
        );

        return { document_name: doc.document_name, signedUrl };
      })
    );

    return {
      EC: 0,
      message: 'Lấy tài liệu thành công.',
      documents: documentsWithSignedUrls,
    };
  } catch (error) {
    console.error('Lỗi khi lấy tài liệu:', error.message);
    return {
      EC: 2,
      message: 'Đã xảy ra lỗi khi lấy tài liệu.',
    };
  }
};
const deleteDocumentService = async (documentName) => {
  try {
    // 1. Check if the document exists in the 'documents' table
    const queryCheck = `
      SELECT * FROM documents WHERE document_name = $1;
    `;
    const result = await pool.query(queryCheck, [documentName]);

    if (result.rows.length === 0) {
      return {
        EC: 1,
        message: 'Không tìm thấy tài liệu trong cơ sở dữ liệu.',
      };
    }

    // 2. Delete the document from the 'documents' table
    const queryDelete = `
      DELETE FROM documents WHERE document_name = $1 RETURNING *;
    `;
    const deleteResult = await pool.query(queryDelete, [documentName]);

    if (deleteResult.rows.length === 0) {
      return {
        EC: 1,
        message: 'Không thể xóa tài liệu từ cơ sở dữ liệu.',
      };
    }

    // 3. Delete the document from the S3 bucket
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const deleteParams = {
      Bucket: bucketName,
      Key: documentName,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3.send(deleteCommand);

    return {
      EC: 0,
      message: 'Tài liệu đã được xóa thành công.',
    };

  } catch (error) {
    console.error('Lỗi khi xóa tài liệu:', error.message);
    return {
      EC: 2,
      message: 'Có lỗi xảy ra khi xóa tài liệu.',
    };
  }
};


module.exports = { uploadDocService, getDocumentService, deleteDocumentService };

const {uploadDocService, getDocumentService, deleteDocumentService}=require('../services/FileService');
const uploadDocument = async (req, res) => {
    const result = await uploadDocService(req);
    return res.status(200).json(result);
}
const getDocument = async (req, res) => {
    const id=req.params.user_id;
    const result = await getDocumentService(id);
    return res.status(200).json(result)
}
const deleteDocument = async (req, res) => {
    const doc_name=req.body.doc_name;
    console.log(req.body)
    const result = await deleteDocumentService(doc_name);
    return res.status(200).json(result)
}
module.exports = { uploadDocument, getDocument, deleteDocument }; //export default
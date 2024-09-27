const {reportUserService}=require('../services/ReportService');

const reportUser = async (req, res) => {
    const result = await reportUserService();
    return res.status(200).json(result);
}

module.exports = { reportUser }; //export default
const {sendEmailService} = require('../services/EmailService');
const emailSender = async (req, res) => {
    const result = await sendEmailService(req);
    return res.status(200).json(result);
};

module.exports = { emailSender }; //export default
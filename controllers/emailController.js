const {sendEmailService, scheduleJobService,getScheduleJobService,deleteScheduleJobService,updateScheduleJobService,
    getspecificScheduleJobService
} = require('../services/EmailService');
const emailSender = async (req, res) => {
    const result = await sendEmailService(req);
    return res.status(200).json(result);
};
const scheduleJob = async (req, res) => {
    const result = await scheduleJobService(req);
    return res.status(200).json(result);
};
const getScheduleJob = async (req, res) => {
    const result = await getScheduleJobService(req);
    return res.status(200).json(result);
};
const deleteScheduleJob = async (req, res) => {
    const id = req.params.cron_id;
    console.log(id);
    const result = await deleteScheduleJobService(id);
    return res.status(200).json(result);
};
const updateScheduleJob = async (req, res) => {
    const result = await updateScheduleJobService(req);
    return res.status(200).json(result);
};
const getSpecificScheduleJob = async (req, res) => {
    const user_id = req.params.user_id;
    const result = await getspecificScheduleJobService(user_id);
    return res.status(200).json(result);
}
module.exports = {emailSender,scheduleJob,getScheduleJob,deleteScheduleJob,updateScheduleJob, getSpecificScheduleJob}; //export default
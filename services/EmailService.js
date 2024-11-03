const nodemailer = require('nodemailer');
const cron = require('node-cron');
const moment = require('moment-timezone');const pool = require('../db');
require('dotenv').config();


// In-memory object to store active cron jobs
let cronJobs = {};

// Create a transporter for Outlook
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_ACC, // Your Outlook email
      pass: process.env.BREVO_KEY, // Your Outlook password
    },
  });
const sendEmailService = async (req) => { 
    const { email, subject, text } = req.body;
    // Define the email options
    const mailOptions = {
        from: 'automaticemail.hoangtu@gmail.com',
        to: email,
        subject: subject,
        html: `<h1>Hoang Tu</h1><p>${text}</p>`
    };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return { EC:1,
            message : 'Email not sent: ' + error
          }
      } else {
          return { EC:0,
            message : 'Email sent: ' + info.response
          }
      }
      });
    };
const scheduleJobService = async (req) => {
      try {
        // Lấy các thông tin từ body của request
        const { user_id,cron_name, email, subject, message, cron_time } = req.body;
    
        // Thêm công việc email đã được lên lịch vào cơ sở dữ liệu và lấy dòng được chèn
        const query = 'INSERT INTO scheduledemail (user_id,cron_name, email, subject, message, cron_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const result_query = await pool.query(query, [user_id,cron_name, email, subject, message, cron_time]);
    
        // Lấy ID của công việc đã lên lịch từ dòng vừa chèn
        const id = result_query.rows[0].cron_id;
    
        // Bước 1: Lên lịch cho công việc cron
        const task = cron.schedule(
          cron_time,
          async () => {
            try {
              // Bước 2: Gửi email khi công việc cron chạy
              await sendEmailService({ body: { email, subject, text: message } });
              console.log(`Email đã gửi tới ${email} cho công việc cron ${id}`);
              await deleteScheduleJobService(id);
            } catch (emailError) {
              // Xử lý lỗi xảy ra khi gửi email
              console.error(`Lỗi khi gửi email cho công việc cron ${id}:`, emailError);
            }
          },
          {
            scheduled: true,
            timezone: "Asia/Ho_Chi_Minh",
          }
        );
    
        // Lưu công việc cron vào bộ nhớ
        cronJobs[id] = task;
        // Bước 3: Bắt đầu công việc cron
        task.start();
        // Trả về phản hồi thành công hoặc log thành công
        console.log(`Công việc cron ${id} đã được lên lịch thành công`);
        return { EC:0,
          message : `Công việc cron ${id} đã được lên lịch thành công`
        };
      } catch (error) {
        // Bước 4: Xử lý bất kỳ lỗi nào xảy ra trong quá trình lên lịch hoặc thao tác cơ sở dữ liệu
        console.error('Lỗi khi lên lịch công việc cron:', error);
        return { EC:1,
          message : 'Không thể lên lịch công việc cron'
        };
      }
    };

const getScheduleJobService = async (req) => {
    const query = 'SELECT * FROM scheduledemail';
    const result_query = await pool.query(query);
    return { EC:0,
      data :result_query.rows};
};   
const getspecificScheduleJobService = async (id) => {
  const query = 'SELECT * FROM scheduledemail WHERE user_id = $1';
  const result_query = await pool.query(query, [id]);
  return { EC:0,
    data : result_query.rows};
};   
const deleteScheduleJobService = async (id) => {
  try {
    // Check if the cron job exists in memory
    if (cronJobs[id]) {
      cronJobs[id].stop(); // Stop the cron job
      delete cronJobs[id]; // Remove the job from the cronJobs object
    }

    // Delete the scheduled job from the database
    const query = 'DELETE FROM scheduledemail WHERE cron_id = $1';
    const result_query = await pool.query(query, [id]);

    // Return success or the result of the deletion
    return result_query.rowCount > 0
      ? { EC: 0, message: `Cron job ${id} deleted successfully.` }
      : { EC: 1, message: `Cron job ${id} not found in the database.` };
  } catch (error) {
    return { EC: 1, message: `Không thể xóa công việc cron ${id}` };
  }
};

const updateScheduleJobService = async (req) => {
  const { cron_id, cron_name, email, subject, message, cron_time } = req.body;
  try {
    // Step 1: Stop and destroy the existing job if it exists
    if (cronJobs[cron_id]) {
      cronJobs[cron_id].stop();
    }

    // Step 2: Update the scheduled job details in the database
    const query = 'UPDATE scheduledemail SET cron_name = $1, email = $2, subject = $3, message = $4, cron_time = $5 WHERE cron_id = $6 RETURNING *';
    const result_query = await pool.query(query, [cron_name, email, subject, message, cron_time, cron_id]);
    // Step 3: Schedule the updated cron job
    const task = cron.schedule(
      cron_time,
      async () => {
        try {
          await sendEmailService({ body: { email, subject, text: message } });
          console.log(`Email sent to ${email} for cron job ${cron_id}`);
        } catch (emailError) {
          console.error(`Error sending email for cron job ${cron_id}:`, emailError);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh",
      }
    );
    // Store the updated cron task in memory
    cronJobs[cron_id] = task;

    // Return the updated cron job from the database
    return { EC: 0, data: result_query.rows[0], message: `Cron job ${cron_id} updated successfully.` };

  } catch (error) {
    // Handle any errors during the update process
    return { EC: 1, message: error.message };
  }
};

const initializeCronJobs = async () => {
  try {
    console.log('initial jobs', cronJobs);
    const jobs = await getScheduleJobService();
    if (jobs.length === 0) {
      console.log('Không có công việc cron nào được tìm thấy.');
      return { success: true, message: 'Không có công việc cron nào được tìm thấy.'};
    }
    else{
    jobs.data.forEach(async (job)=>{
      const task = cron.schedule(
        job.cron_time,
        async () => {
          try {
            await sendEmailService({ body: { email: job.email, subject: job.subject, text: job.message } });
            console.log(`Email đã gửi tới ${job.email} cho công việc cron ${job.cron_id}`);
          } catch (emailError) {
            console.error(`Lỗi khi gửi email cho công việc cron ${job.cron_id}:`, emailError);
          }
        },
        {
          scheduled: true,
          timezone: "Asia/Ho_Chi_Minh",
        }
      );
      cronJobs[job.cron_id] = task;
      task.start();
      console.log(`Công việc cron ${job.cron_id} đã được lên lịch thành công`);
    });
    }

  } catch (error) {
    console.error('Lỗi khi khởi tạo công việc cron:', error);
    return { EC: 1, message: 'Không thể khởi tạo công việc cron' };
    
  }
}
module.exports = {sendEmailService, scheduleJobService, getScheduleJobService, deleteScheduleJobService, updateScheduleJobService, 
  initializeCronJobs, getspecificScheduleJobService

}; //export default
const pool = require('../db')
require("dotenv").config
// 
const reportUserService = async () => {
    try {
        const result = await pool.query(`
            SELECT 
                c.customer_id,
                c.name AS customer_name,
                c.nationality,
                c.initials,
                c.registration_date,
                c.status AS customer_status,
                u.email AS customer_email,
                u.phone_number AS customer_phone,
                co.company_id,
                co.company_name,
                co.company_email,
                co.tax_number,
                co.manufacturing_industry,
                co.address AS company_address,
                co.debt
            FROM 
                customers c
            JOIN 
                users u ON c.user_id = u.user_id
            LEFT JOIN 
                companies co ON c.customer_id = co.customer_id;
        `);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "Không tìm thấy khách hàng."
            };
        } else {
            return {
                EC: 0,
                customers: result.rows,
                message: "Đã lấy thông tin khách hàng và công ty thành công."
            };
        }

    } catch (error) {
        console.error('Lỗi khi lấy thông tin khách hàng và công ty:', error.message);
        return {
            EC: 2,
            message: "Đã xảy ra lỗi khi lấy thông tin khách hàng và công ty."
        };
    }
};
module.exports = { reportUserService }; //export default

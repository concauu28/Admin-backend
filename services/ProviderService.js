//postgres
const pool = require('../db')
//hash
const bcrypt = require('bcrypt');
const { parse } = require('dotenv');
const saltRounds = 10;
const jwt = require("jsonwebtoken")

require("dotenv").config

//CREATE
const createProviderService = async (data) => {
    try {
        const {
            username,
            email,
            password,  // Assuming you need to create a user as well
            phone_number,
            role = "Provider", // Default role as Provider
            status = "Active", // Default status
            company_name,
            provider_initials,
            tax_number,
            debt = 0, // Default debt is 0
            isInternal , // Default to external provider
            address
        } = data;

        // Validate required fields for the user and provider
        if (!password || !company_name || !provider_initials) {
            return {
                EC: 1,
                message: "Missing required fields: username, email, password, company_name, provider_initials, tax_number, and address are required."
            };
        }

        // Hash the password (assuming bcrypt is used for password hashing)
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the users table
        const userResult = await pool.query(
            `INSERT INTO users (username, email, password, phone_number, role, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id;`,
            [username, email, hashedPassword, phone_number, role, status]
        );

        const user_id = userResult.rows[0].user_id;

        // Insert the new provider into the providers table
        const providerResult = await pool.query(
            `INSERT INTO providers (user_id, company_name, provider_initials, tax_number, debt, isInternal, address, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING provider_id;`,
            [user_id, company_name, provider_initials, tax_number, debt, isInternal, address, status]
        );

        return {
            EC: 0,
            provider_id: providerResult.rows[0].provider_id,
            message: "Provider successfully added."
        };
    } catch (error) {
        console.error('Error adding provider:', error.message);
        return {
            EC: 2,
            message: "An error occurred while adding the provider."
        };
    }
};
const createProviderServiceService = async (data) => {
    try {
        const {
            provider_id,
            service_id,
            price,
            availability,
            notes
        } = data;

        // Validate required fields
        if (!provider_id || !service_id || price === undefined ) {
            return {
                EC: 1,
                message: "Missing required fields: provider_id, service_id, price, and availability are required."
            };
        }

        // Insert the new provider service into the provider_services table
        const result = await pool.query(
            `INSERT INTO provider_services (provider_id, service_id, price, availability, notes)
             VALUES ($1, $2, $3, $4, $5) RETURNING provider_service_id;`,
            [provider_id, service_id, price, availability, notes || null]
        );

        return {
            EC: 0,
            provider_service_id: result.rows[0].provider_service_id,
            message: "Provider service successfully added."
        };
    } catch (error) {
        console.error('Error adding provider service:', error.message);
        return {
            EC: 2,
            message: "An error occurred while adding the provider service."
        };
    }
};


//GET
const getListProviderService = async () => {
    try {
        const result = await pool.query(
            `SELECT u.username AS provider_name, p.*
            FROM providers p
            JOIN  users u ON p.user_id = u.user_id;`
        );

        return {
            EC: 0,
            list_providers: result.rows
        };
    } catch (error) {
        console.error('Error getting providers:', error.message);
        return {
            EC: 2,
            message: "An error occurred while getting provider services."
        };
    }
}
const getProviderService = async (user_id) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.provider_id,
                p.company_name,
                p.provider_initials,
                p.tax_number,
                p.debt,
                p.isInternal,
                p.address,
                p.status AS provider_status,
                u.user_id,
                u.custom_user_id,
                u.username,
                u.email,
                u.phone_number,
                u.role,
                u.status AS user_status
            FROM 
                providers p
            JOIN 
                users u ON p.user_id = u.user_id
            WHERE 
                p.user_id = $1;
        `, [user_id]);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "Không tìm thấy nhà cung cấp cho ID người dùng đã cho."
            };
        }

        return {
            EC: 0,
            provider: result.rows[0]  // Return both provider and user information
        };
    } catch (error) {
        console.error('Lỗi khi lấy nhà cung cấp:', error.message);
        return {
            EC: 2,
            message: "Đã xảy ra lỗi khi lấy nhà cung cấp."
        };
    }
};

const getProviderServiceService = async (user_id) => {
    try {
        const result = await pool.query(`
            SELECT 
                ps.provider_service_id,
                ps.price AS provider_price,
                ps.availability,
                ps.notes AS provider_notes,
                s.service_id,
                s.service_name,
                s.service_description,
                s.price AS service_price,
                s.type_of_service,
                s.completion_time,
                s.notes AS service_notes
            FROM 
                providers p
            JOIN 
                provider_services ps ON p.provider_id = ps.provider_id
            JOIN 
                services s ON ps.service_id = s.service_id
            WHERE 
                p.user_id = $1;
        `, [user_id]);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "Không tìm thấy dịch vụ nhà cung cấp cho ID người dùng đã cho."
            };
        }

        return {
            EC: 0,
            provider_services: result.rows
        };
    } catch (error) {
        console.error('Lỗi khi lấy dịch vụ nhà cung cấp:', error.message);
        return {
            EC: 2,
            message: "Đã xảy ra lỗi khi lấy dịch vụ nhà cung cấp."
        };
    }
};


//UPDATE
const updateProviderService = async (data) => {
    const { provider_id, user_id, company_name, provider_initials, tax_number, debt, address, status, phone_number, email } = data;
    try {
        // Update the providers table
        const providerResult = await pool.query(
            `UPDATE providers
             SET company_name = $1, provider_initials = $2, tax_number = $3, debt = $4, address = $5, status = $6
             WHERE provider_id = $7
             RETURNING *`,
            [company_name, provider_initials, tax_number, debt, address, status, provider_id]
        );

        // Update the users table for fields like phone_number and email
        const userResult = await pool.query(
            `UPDATE users
             SET phone_number = $1, email = $2
             WHERE user_id = $3
             RETURNING *`,
            [phone_number, email, user_id]
        );

        // Check if both queries were successful
        if (providerResult.rows.length === 0 || userResult.rows.length === 0) {
            return { EC: 1, message: "Không tìm thấy nhà cung cấp hoặc người dùng" };
        } else {
            return {
                EC: 0,
                message: "Thành công",
                updatedProvider: providerResult.rows[0],
                updatedUser: userResult.rows[0]
            };
        }
    } catch (err) {
        console.error('Error updating provider or user:', err);
        return { message: "Có lỗi xảy ra khi cập nhật nhà cung cấp hoặc người dùng" };
    }
};

const updateProviderServiceService = async (data) => {
    const { provider_service_id, provider_price, availability, provider_notes } = data;
    try {
        // Update the provider_services table
        const result = await pool.query(
            `UPDATE provider_services
             SET price = $1, availability = $2, notes = $3
             WHERE provider_service_id = $4
             RETURNING *`,
            [provider_price, availability, provider_notes, provider_service_id]
        );

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "Không tìm thấy dịch vụ nhà cung cấp cho ID dịch vụ đã cho."
            };
        } else {
            return {
                EC: 0,
                message: "Cập nhật dịch vụ thành công.",
                updatedProviderService: result.rows[0]
            };
        }
    } catch (err) {
        console.error('Lỗi khi cập nhật dịch vụ nhà cung cấp:', err.message);
        return {
            EC: 2,
            message: "Đã xảy ra lỗi khi cập nhật dịch vụ nhà cung cấp."
        };
    }
};




module.exports = {
    createProviderService, createProviderServiceService, getListProviderService, getProviderService, 
    getProviderServiceService, updateProviderService, updateProviderServiceService
}
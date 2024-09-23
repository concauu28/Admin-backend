//postgres
const pool = require('../db')
//hash
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require("jsonwebtoken")

require("dotenv").config


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
        if (!username || !email || !password || !company_name || !provider_initials || !tax_number || !address) {
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
        if (!provider_id || !service_id || price === undefined || !availability) {
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


module.exports = {
    createProviderService, createProviderServiceService
}
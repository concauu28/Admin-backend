//postgres
const pool = require('../db')
//hash
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require("jsonwebtoken")

require("dotenv").config

//LOGIN
const loginService = async (email, password) => {
    try {
        // Check if the user exists in the users table
        const userResult = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return {
                EC: 1,
                message: "Đăng nhập không thành công", // "Login unsuccessful"
            };
        }

        const user = userResult.rows[0];

        // Compare the provided password with the stored hashed password
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return {
                EC: 2,
                message: "Đăng nhập không thành công", // "Login unsuccessful"
            };
        } else {
            // Fetch additional user details from the employees table if necessary
            const employeeResult = await pool.query(
                `SELECT * FROM employees WHERE user_id = $1`,
                [user.user_id]
            );

            const employee = employeeResult.rows.length > 0 ? employeeResult.rows[0] : null;

            const payload = {
                email: user.email,
                username: user.username,
                role: user.role,
            };

            const access_token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRE,
                }
            );

            return {
                EC: 0,
                access_token,
                user: {
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    name: employee ? employee.name : null, // Include employee name if available
                },
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        return {
            EC: 3,
            message: "Đã xảy ra lỗi trong quá trình đăng nhập", // "An error occurred during login"
        };
    }
};


//CREATE
const createCustomerService = async (name, username, phone_number, email, nationality, initials, status) => {
    try {
        // Define role as 'Customer'
        const role = 'Customer';
        // Default password for customer
        const defaultPassword = '123456';

        // Hash the default password
        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

        // Insert into the users table
        const newUser = await pool.query(
            `INSERT INTO users (username, email, password, phone_number, role, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, custom_user_id`,
            [username, email, hashedPassword, phone_number, role, status]
        );

        const { user_id, custom_user_id } = newUser.rows[0];

        // Insert into the customers table linked to the new user
        const newCustomer = await pool.query(
            `INSERT INTO customers (user_id, name, nationality, initials, registration_date, status)
             VALUES ($1, $2, $3, $4, DEFAULT, $5) RETURNING *`,
            [user_id, name, nationality, initials, status]
        );

        const result = {
            EC: 0,
            newCustomer: newCustomer.rows[0],
            custom_user_id  // Include the custom user ID in the result
        };

        return result;
    } catch (error) {
        console.log(error);
        const result = { EC: 1 };
        return result;
    }
};
const createCompanyService = async (company_name, customer_id, manufacturing_industry, tax_number, company_email, address, debt) => {
    try {
        const newCompany = await pool.query(
            `INSERT INTO companies (company_name, customer_id, manufacturing_industry, tax_number, company_email, address, debt)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [company_name, customer_id, manufacturing_industry, tax_number, company_email, address, debt]
        );
        const result = {
            EC: 0,
            newCompany: newCompany.rows[0],
        };

        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
};
const createEmployeeService = async (name, username, email, password, phone_number, role, department, status) => {
    try {
        // Check if the user already exists
        const userExistsResult = await pool.query(
            `SELECT EXISTS (
                SELECT 1 
                FROM users 
                WHERE email = $1
            )`,
            [email]
        );

        const userExists = userExistsResult.rows[0].exists;
        if (userExists) {
            return null;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the users table and get the user_id and custom_user_id
        const newUser = await pool.query(
            `INSERT INTO users (username, email, password, phone_number, role, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, custom_user_id`,
            [username, email, hashedPassword, phone_number, role, status]
        );

        const { user_id, custom_user_id } = newUser.rows[0];

        // Insert the new employee into the employees table, linking it to the new user
        const newEmployee = await pool.query(
            `INSERT INTO employees (user_id, name, department, status)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, name, department, status]
        );

        return {
            ...newEmployee.rows[0],
            custom_user_id // Include the custom user ID in the returned result
        };

    } catch (error) {
        console.error(error);
        return null;
    }
 
};

const addCustomerRequestService = async(data) => {
    try {
        const { city, area_type, customer_id, service_id, request_date, deadline, status, notes } = data;

        // Validate required fields
        if (!customer_id || !service_id || !status) {
            return { EC: 1, message: "Required fields missing" };
        }

        // Insert the new customer request
        const result = await pool.query(
            `INSERT INTO customer_requests (city, area_type, customer_id, service_id, request_date, deadline, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING request_id`,
            [city, area_type, customer_id, service_id, request_date || new Date(), deadline, status, notes]
        );

        // Return the new request ID
        const newRequestId = result.rows[0].request_id;
        return { EC: 0, request_id: newRequestId };
    } catch (error) {
        console.error('Error adding customer request:', error.message);
        return { EC: 2, message: "An error occurred while adding the customer request" };
    }
};

const addServiceService = async (data) => {
    try {
        const { service_id, service_name, service_description, price, type_of_service, completion_time, notes } = data;

        // Validate required fields
        if (!service_id || !service_name) {
            return { EC: 1, message: "Service ID and Service Name are required" };
        }

        // Insert the new service into the services table
        const result = await pool.query(
            `INSERT INTO services (service_id, service_name, service_description, price, type_of_service, completion_time, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING service_id;`,
            [service_id, service_name, service_description, price, type_of_service, completion_time, notes]
        );

        return {
            EC: 0,
            service_id: result.rows[0].service_id,
            message: "Service successfully added"
        };
    } catch (error) {
        console.error('Error adding service:', error.message);
        return { EC: 2, message: "An error occurred while adding the service" };
    }
};

const addRecurringService = async (data) => {
    try {
        const { customer_id, service_id, recurrence_interval, end_date } = data;

        // Validate required fields
        if (!customer_id || !service_id) {
            return { EC: 1, message: "Customer ID and Service ID are required" };
        }

        // Insert the new recurring service into the recurring_services table
        const result = await pool.query(
            `INSERT INTO recurring_services (customer_id, service_id, recurrence_interval, end_date) 
             VALUES ($1, $2, $3, $4) RETURNING recurring_service_id;`,
            [customer_id, service_id, recurrence_interval, end_date]
        );

        return {
            EC: 0,
            recurring_service_id: result.rows[0].recurring_service_id,
            message: "Recurring service successfully added"
        };
    } catch (error) {
        console.error('Error adding recurring service:', error.message);
        return { EC: 2, message: "An error occurred while adding the recurring service" };
    }
};

const addTransactionService = async (data) => {
    try {
        const {
            transaction_type, // "Sale" or "Purchase"
            customer_id,      // Used for "Sale" transactions
            provider_id,      // Used for "Purchase" transactions
            service_id,
            purchase_id,      // Used for "Purchase" transactions
            recurring_service_id, // Optional, can be null if not provided
            payment_type,
            amount_paid,
            payment_status = "Pending" // Default payment status is "Pending"
        } = data;

        // Validate required fields
        if (!transaction_type || !service_id || !payment_type || !amount_paid) {
            return {
                EC: 1,
                message: "Missing required fields: transaction_type, service_id, payment_type, and amount_paid are required."
            };
        }

        // Validate transaction type and associated fields
        if (transaction_type === "Sale" && !customer_id) {
            return {
                EC: 1,
                message: "Missing required field: customer_id is required for Sale transactions."
            };
        }

        if (transaction_type === "Purchase" && !provider_id) {
            return {
                EC: 1,
                message: "Missing required field: provider_id is required for Purchase transactions."
            };
        }

        // Insert the new transaction
        const result = await pool.query(
            `INSERT INTO transactions (transaction_type, customer_id, provider_id, service_id, purchase_id, recurring_service_id, payment_type, amount_paid, payment_status, payment_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) RETURNING transaction_id;`,
            [transaction_type, customer_id || null, provider_id || null, service_id, purchase_id || null, recurring_service_id || null, payment_type, amount_paid, payment_status]
        );

        return {
            EC: 0,
            transaction_id: result.rows[0].transaction_id,
            message: "Transaction successfully added."
        };
    } catch (error) {
        console.error('Error adding transaction:', error.message);
        return {
            EC: 2,
            message: "An error occurred while adding the transaction."
        };
    }
};

//GET
const getCompanyService = async (user_id) => {
    try {
        const result = await pool.query(`
            SELECT co.* 
            FROM companies co
            INNER JOIN customers cu ON co.customer_id = cu.customer_id
            INNER JOIN users u ON cu.user_id = u.user_id
            WHERE u.user_id = $1;
        `, [user_id]);
        
        if (result.rows.length === 0) {
            return { EC: 1, message: "Không tìm thấy công ty nào cho người dùng được cung cấp." };
        } else {
            return { EC: 0, company: result.rows[0] };  // Return the company information
        }
    } catch (error) {
        console.error('Lỗi khi tìm công ty:', error.message);
        return { EC: 2, message: "Có lỗi xảy ra khi tìm kiếm công ty." };
    }
};


const getUserService = async () => {
    try {
        const users = await pool.query(`
            SELECT 
                cu.customer_id,
                cu.name,
                cu.nationality,
                cu.initials,
                cu.registration_date,
                cu.status,
                u.user_id,
                u.email,
                u.phone_number,
                u.username
            FROM customers cu
            JOIN users u ON cu.user_id = u.user_id
        `);

        return users.rows;
    } catch (error) {
        console.log('Error fetching users:', error.message);
        return null;
    }
};

const getCustomerService=async ()=>{
    try {
        const listofcustomer = await pool.query(`
           SELECT * from customers
        `);
        return listofcustomer.rows
    } catch (error) {
        console.log(error)
        return null
        
    }

}
const getServiceService = async () => {
    try {
        const result = await pool.query(`SELECT * FROM services`);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "No services found."  // English translation of "Khong co dich vu"
            };
        } else {
            return {
                EC: 0,
                services: result.rows,
                message: "Services fetched successfully."
            };
        }

    } catch (error) {
        console.error('Error fetching services:', error.message);
        return {
            EC: 2,
            message: "An error occurred while fetching the services."
        };
    }
};
const getSpecificCustomerService = async (user_id) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.user_id,
                c.customer_id,
                c.name AS name,
                u.email AS email,
                u.username AS username,
                u.phone_number,
                c.nationality,
                c.status AS status,
                c.registration_date
            FROM 
                customers c
            INNER JOIN 
                users u ON c.user_id = u.user_id
            WHERE 
                u.user_id = $1;
        `, [user_id]);
        

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "Không tìm thấy khách hàng nào với ID người dùng được cung cấp."
            };
        } else {
            return {
                EC: 0,
                customer: result.rows[0]
            };  // Return a single customer object including user and customer details
        }

    } catch (error) {
        console.error('Lỗi khi tìm khách hàng cụ thể:', error.message);
        return {
            EC: 2,
            message: "Có lỗi xảy ra khi tìm kiếm khách hàng."
        };
    }
};



const getCustomerRequestsService = async (user_id) => {
    try {
        const result = await pool.query(`
            SELECT 
                cr.request_id,
                cr.request_date,
                cr.status AS request_status,
                cr.city,
                cr.area_type,
                cr.deadline,
                cr.notes AS request_notes,
                s.service_id,
                s.service_name,
                s.service_description,
                s.price AS service_price,
                s.completion_time,
                s.notes AS service_notes,
                t.payment_status,
                CASE 
                    WHEN t.payment_status = 'Paid' THEN 'Đã thanh toán'
                    ELSE 'Chưa thanh toán'
                END AS is_paid
            FROM 
                customers c
            INNER JOIN 
                customer_requests cr ON c.customer_id = cr.customer_id
            INNER JOIN 
                services s ON cr.service_id = s.service_id
            LEFT JOIN 
                transactions t ON cr.customer_id = t.customer_id AND cr.service_id = t.service_id
            INNER JOIN 
                users u ON c.user_id = u.user_id
            WHERE 
                u.user_id = $1;
        `, [user_id]);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "Không tìm thấy yêu cầu nào cho người dùng được cung cấp."
            };
        } else {
            return {
                EC: 0,
                requests: result.rows
            };
        }

    } catch (error) {
        console.error('Lỗi khi tìm yêu cầu của khách hàng:', error.message);
        return {
            EC: 2,
            message: "Có lỗi xảy ra khi tìm kiếm yêu cầu của khách hàng."
        };
    }
};


const getRequestService = async () => {
    try {
        // Query to get all requests from customers, including their names
        const result = await pool.query(`
            SELECT 
                c.name AS customer_name,
                c.user_id AS user_id,
                cr.request_id,
                cr.request_date,
                cr.status AS request_status,
                cr.city,
                cr.area_type,
                cr.deadline,
                cr.notes AS request_notes,
                s.service_id,
                s.service_name,
                s.service_description,
                s.price AS service_price,
                s.completion_time,
                s.notes AS service_notes,
                t.payment_status,
                CASE 
                    WHEN t.payment_status = 'Paid' THEN 'Da thanh toan'
                    ELSE 'Chua thanh toan'
                END AS is_paid
            FROM 
                customers c
            INNER JOIN 
                customer_requests cr ON c.customer_id = cr.customer_id
            INNER JOIN 
                services s ON cr.service_id = s.service_id
            LEFT JOIN 
                transactions t ON cr.customer_id = t.customer_id AND cr.service_id = t.service_id;
        `);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "No requests found."
            };
        } else {
            return {
                EC: 0,
                requests: result.rows,
                message: "Requests fetched successfully."
            };
        }

    } catch (error) {
        console.error('Error fetching customer requests:', error.message);
        return {
            EC: 2,
            message: "An error occurred while fetching the customer requests."
        };
    }
};


const getCustomerTransactionsService = async (customer_id) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.transaction_id,
                t.service_id,
                s.service_name,
                t.amount_paid,
                t.payment_date,
                t.payment_status,
                t.recurring_service_id,
                rs.recurrence_interval,
                rs.next_due_date
            FROM 
                transactions t
            INNER JOIN 
                customers c ON t.customer_id = c.customer_id
            INNER JOIN 
                services s ON t.service_id = s.service_id
            LEFT JOIN 
                recurring_services rs ON t.recurring_service_id = rs.recurring_service_id
            WHERE 
                c.customer_id = $1
            ORDER BY 
                t.payment_date DESC;
        `, [customer_id]);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "Không tìm thấy giao dịch nào cho khách hàng được cung cấp."
            };
        } else {
            return {
                EC: 0,
                transactions: result.rows
            };
        }

    } catch (error) {
        console.error('Lỗi khi tìm giao dịch của khách hàng:', error.message);
        return {
            EC: 2,
            message: "Có lỗi xảy ra khi tìm kiếm giao dịch của khách hàng."
        };
    }
};


//UPDATE
const updateCustomerService = async (data) => {
    const { customer_id, user_id, username, name, nationality, status, phone_number, email } = data;
    try {
        // Update the customers table
        const customerResult = await pool.query(
            `UPDATE customers
             SET name = $1, nationality = $2, status = $3
             WHERE customer_id = $4
             RETURNING *`,
            [name, nationality, status, customer_id]
        );

        // Update the users table for fields like phone_number and email
        const userResult = await pool.query(
            `UPDATE users
             SET phone_number = $1, email = $2, username=$3
             WHERE user_id = $4
             RETURNING *`,
            [phone_number, email,username, user_id]
        );

        if (customerResult.rows.length === 0 || userResult.rows.length === 0) {
            return { EC:1,message: "Không tìm thấy khách hàng hoặc người dùng" };
        } else {
            return { 
                EC:0,
                message: "Thành công", 
                updatedCustomer: customerResult.rows[0], 
                updatedUser: userResult.rows[0] 
            };
        }
    } catch (err) {
        console.error('Error updating customer or user:', err);
        return { message: "Có lỗi xảy ra khi cập nhật khách hàng hoặc người dùng" };
    }
};


const updateCompanyService = async (data) => {
    const { company_name, company_email, tax_number, manufacturing_industry, address, debt, company_id } = data;
    try {
        const result = await pool.query(
            `UPDATE companies
             SET company_name = $1, company_email = $2, tax_number = $3, manufacturing_industry = $4, address = $5, debt = $6
             WHERE company_id = $7
             RETURNING *`,
            [company_name, company_email, tax_number, manufacturing_industry, address, debt, company_id]
        );

        if (result.rows.length === 0) {
            return { EC:1,message: "Không tìm thấy công ty" };
        } else {
            return { EC:0,message: "Thành công", updatedCompany: result.rows[0] };
        }
    } catch (err) {
        console.error('Error updating company:', err);
        return { message: "Có lỗi xảy ra khi cập nhật công ty" };
    }
};

const updateRequestService = async (data) => {
    const { request_id, city, area_type, deadline, request_status, notes } = data;
    try {
        const result = await pool.query(
            `UPDATE customer_requests
             SET city = $1, area_type = $2, deadline = $3, status = $4, notes = $5
             WHERE request_id = $6
             RETURNING *`,
            [city, area_type, deadline, request_status, notes, request_id]
        );

        if (result.rows.length === 0) {
            return { EC:1,message: "Không cập nhật thành công yêu cầu" };
        } else {
            return { EC:0,message: "Thành công", updatedRequest: result.rows[0] };
        }
    } catch (err) {
        console.error('Error updating request:', err);
        return { message: "Có lỗi xảy ra khi cập nhật yêu cầu" };
    }

};
module.exports={
    createCustomerService, createEmployeeService, loginService, getUserService, getCustomerService, getSpecificCustomerService,
     getCustomerRequestsService, getCustomerTransactionsService, createCompanyService, getServiceService, addCustomerRequestService,
     updateCustomerService, getCompanyService, getRequestService, addServiceService, addRecurringService, addTransactionService, updateCompanyService,
     updateRequestService
}

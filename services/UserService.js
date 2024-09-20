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
        return newCompany.rows[0];
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

const addCustomerRequestService = async(data)=>{
    try {
        const { city, area_type, customer_id, service_id, request_date, deadline, status, notes } = data;
        // Validate required fields
        if (!customer_id || !service_id || !status) {
            return {EC:1};
        }

        // Insert the new customer request
        const result = await pool.query(
            `INSERT INTO customer_requests (city, area_type, customer_id, service_id, request_date, deadline, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING request_id`,
            [city, area_type, customer_id, service_id, request_date || new Date(), deadline, status, notes ]
        );

        // Return the new request ID
        const newRequestId = result.rows[0].request_id;
        return {EC:0,result:result.rows[0]};
    } catch (error) {
        console.error(error.message);
        return null;
    }
}
const addServiceService = async(data)=>{
    try {
        const { service_id, service_name, service_description, price, type_of_service, completion_time, notes } = data;
        // Validate required fields
        if (!service_id || !service_name) {
            return {EC:1};
        }
        // Insert the new customer request
        const result = await pool.query(
            `INSERT INTO services (service_id,service_name,service_description,price,type_of_service,completion_time,notes ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7 );`,
            [service_id, service_name, service_description, price, type_of_service, completion_time, notes]
        );
        return {EC:0};
    } catch (error) {
        console.error(error.message);
        return null;
    }
}
const addRecurringService = async(data)=>{
    try {
        const { customer_id, service_id, recurrence_interval, end_date} = data;
        // Validate required fields
        if (!customer_id || !service_id) {
            return {EC:1};
        }
        const result = await pool.query(
            `INSERT INTO recurring_services (customer_id,service_id,recurrence_interval,end_date) 
            VALUES ($1, $2, $3, $4 );`,
            [customer_id, service_id, recurrence_interval, end_date]
        );
        return {EC:0, result:result};
    } catch (error) {
        console.error(error.message);
        return null;
    }
}

//GET
const getCompanyService = async (email) => {
    const userEmail = email;
    try {
        const result = await pool.query(`
            SELECT co.* 
            FROM companies co
            JOIN customers cu ON co.customer_id = cu.customer_id
            WHERE cu.email = $1;
        `, [userEmail]);
        if (result.rows.length === 0) {
            return null;
        } else {
            return result.rows[0];  // Return a single customer object including company information
        }
    } catch (error) {
        console.error('Error fetching company:', error.message);
        return null;
    }
};
const getUserService = async()=>{
    try {
        const users = await pool.query('SELECT * from customers'
        );
        return users.rows
        
    } catch (error) {
        console.log(error)
        return null
        
    }

}
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
        const result = await pool.query(`
            SELECT * FROM services`);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "Khong co dich vu"
            };
        } else {
            return {
                EC: 0,
                services: result.rows
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
const getSpecificCustomerService = async (email) => {
    const userEmail = email;
    try {
        const result = await pool.query(`
            SELECT 
                c.customer_id,
                c.name AS customer_name,
                c.email AS customer_email,
                c.phone_number,
                c.nationality,
                c.status AS customer_status,
                c.registration_date,
                co.company_id,
                co.company_name,
                co.company_email,
                co.tax_number,
                co.address,
                co.debt
            FROM 
                customers c
            LEFT JOIN 
                companies co ON c.customer_id = co.customer_id
            WHERE 
                c.email = $1;
        `, [userEmail]);

        if (result.rows.length === 0) {
            return null;
        } else {
            return result.rows[0];  // Return a single customer object including company information
        }

    } catch (error) {
        console.error('Error fetching specific customer:', error.message);
        return null;
    }
};
const getCustomerRequestsService = async (email) => {
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
                transactions t ON cr.customer_id = t.customer_id AND cr.service_id = t.service_id
            WHERE 
                c.email = $1;
        `, [email]);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "No requests found for the specified customer."
            };
        } else {
            return {
                EC: 0,
                requests: result.rows
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
const getRequestService = async () => {
    try {
        //query to get all requests from customers including their name

        const result = await pool.query(`
            SELECT 
                c.name AS customer_name,
                c.customer_id,
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
                message: "No requests found for the specified customer."
            };
        } else {
            return {
                EC: 0,
                requests: result.rows
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
const getCustomerTransactionsService = async (email) => {
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
                c.email = $1
            ORDER BY 
                t.payment_date DESC;
        `, [email]);

        if (result.rows.length === 0) {
            return {
                EC: 1,
                message: "No transactions found for the specified customer."
            };
        } else {
            return {
                EC: 0,
                transactions: result.rows
            };
        }

    } catch (error) {
        console.error('Error fetching customer transactions:', error.message);
        return {
            EC: 2,
            message: "An error occurred while fetching the customer transactions."
        };
    }
};

//UPDATE
const updateCustomerService = async (data) => {
    const { name, phone_number, email,nationality, status,id} = data;
    try {
        const result = await pool.query(
            `UPDATE customers
             SET name = $1, phone_number = $2, email = $3, nationality = $4, status = $5
             WHERE customer_id = $6
             RETURNING *`,
            [name, phone_number, email, nationality, status, id]
        );

        if (result.rows.length === 0) {
            return {message:"Khong tim thay khach hang"}
        } else {
            return {message:"Success"}; // Return the updated customer data
        }
    } catch (err) {
        console.error('Error updating customer:', err);
        return {message:"Khong tim thay khach hang"}
    }
};
const updateCompanyService = async (data) => {
    const { name, phone_number, email,nationality, status,id} = data;
    try {
        const result = await pool.query(
            `UPDATE customers
             SET name = $1, phone_number = $2, email = $3, nationality = $4, status = $5
             WHERE customer_id = $6
             RETURNING *`,
            [name, phone_number, email, nationality, status, id]
        );

        if (result.rows.length === 0) {
            return {message:"Khong tim thay khach hang"}
        } else {
            return {message:"Success"}; // Return the updated customer data
        }
    } catch (err) {
        console.error('Error updating customer:', err);
        return {message:"Khong tim thay khach hang"}
    }
};
module.exports={
    createCustomerService, createEmployeeService, loginService, getUserService, getCustomerService, getSpecificCustomerService,
     getCustomerRequestsService, getCustomerTransactionsService, createCompanyService, getServiceService, addCustomerRequestService,
     updateCustomerService, getCompanyService, getRequestService, addServiceService, addRecurringService
}

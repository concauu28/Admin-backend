-- Create DATABASE
CREATE DATABASE trialproduct

CREATE TYPE recurrence_interval_type AS ENUM ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly');

-- Create Customers Table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    -- password VARCHAR(255) NOT NULL,
    nationality VARCHAR(100),
    initials VARCHAR(10) UNIQUE,  -- Added column for customer initials with UNIQUE constraint
    registration_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50)  -- e.g., Active, Inactive
);


-- Create Companies Table
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    company_email VARCHAR(255) UNIQUE NOT NULL,
    tax_number VARCHAR(50),
    manufacturing_industry VARCHAR(255),
    address VARCHAR(255),  -- Stores the company’s address
    debt NUMERIC(38,10),
    UNIQUE (tax_number)  -- Ensures uniqueness for company names and tax numbers
);

-- Create Services Table
CREATE TABLE services (
    service_id VARCHAR(255) PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_description TEXT,  -- Detailed description or relevant information
    price NUMERIC(10, 2),
    type_of_service VARCHAR(255),--services or goods
    completion_time VARCHAR(50),  -- Time required to complete the service
    notes TEXT  -- Any additional notes or remarks
);

-- Create Required Documents or Information Table
CREATE TABLE service_requirements (
    requirement_id SERIAL PRIMARY KEY,
    service_id VARCHAR(255) REFERENCES services(service_id) ON DELETE CASCADE,
    requirement_description TEXT NOT NULL  -- Description of the required document or information
);
CREATE TABLE customer_requests (
    request_id SERIAL PRIMARY KEY,
    city VARCHAR(255),
    area_type VARCHAR(50),  -- Stores the type of area (e.g., Urban, Rural, Industrial)
    customer_id INT REFERENCES customers(customer_id),
    service_id VARCHAR(255) REFERENCES services(service_id),
    request_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMPTZ,
    notes TEXT,
    status VARCHAR(50)  -- e.g., Pending, In Progress, Completed
);

-- Create Employees Table
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
	password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50),  -- e.g., Manager, Staff
    department VARCHAR(255),
    status VARCHAR(50)  -- e.g., Active, Inactive
);

-- Create Third Parties Table
CREATE TABLE third_parties (
    third_party_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    contact_phone VARCHAR(20),
    company_name VARCHAR(255),
    service_offered VARCHAR(255),
    status VARCHAR(50)  -- e.g., Active, Inactive
);
-- Create Recurring_Service Table
CREATE TABLE recurring_services (
    recurring_service_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    service_id VARCHAR(255) REFERENCES services(service_id),
    recurrence_interval recurrence_interval_type,  -- Use ENUM type for recurrence intervals
    next_due_date TIMESTAMPTZ,  -- Date when the next payment is due
    end_date TIMESTAMPTZ,  -- Date when the recurring service will end
    UNIQUE (customer_id, service_id)  -- Ensure each customer has a unique recurring service for a given service
);
--Transaction Table
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    service_id VARCHAR(255) REFERENCES services(service_id),
    recurring_service_id INT REFERENCES recurring_services(recurring_service_id),  -- Nullable, for recurring payments
    payment_type VARCHAR(50),
    amount_paid NUMERIC(10, 2),
    payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(50)  -- e.g., "Paid", "Pending", "Overdue"
);
-- Create Tasks Table
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES customer_requests(request_id),
    assigned_to_employee_id INT REFERENCES employees(employee_id),  -- NULL if assigned to a third party
    assigned_to_third_party_id INT REFERENCES third_parties(third_party_id),  -- NULL if assigned to an employee
    assigned_by_employee_id INT REFERENCES employees(employee_id),
    task_description TEXT,
    start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMPTZ,
    status VARCHAR(50)  -- e.g., Not Started, In Progress, Completed
);


-- Create Task Progress Table
CREATE TABLE task_progress (
    progress_id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(task_id),
    progress_description TEXT,
    update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),  -- e.g., Not Started, In Progress, Completed
    updated_by_employee_id INT REFERENCES employees(employee_id),  -- For internal updates
    updated_by_third_party_id INT REFERENCES third_parties(third_party_id)  -- For updates from third parties
);


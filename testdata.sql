-- Create DATABASE
CREATE DATABASE trial;
CREATE DATABASE trial;
CREATE ROLE my_app_role WITH LOGIN PASSWORD 'some_password';
GRANT ALL PRIVILEGES ON DATABASE "trial" TO my_app_role;
-- Create ENUM type for Recurrence Interval
CREATE TYPE recurrence_interval_type AS ENUM ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly');

-- Create Sequences for Custom User IDs
CREATE SEQUENCE employee_id_seq START 1;
CREATE SEQUENCE customer_id_seq START 1;
CREATE SEQUENCE provider_id_seq START 1;

-- Create Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    custom_user_id VARCHAR(20) UNIQUE NOT NULL,  -- Custom user ID
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50),  -- e.g., "Employee", "Provider", "Customer"
    status VARCHAR(50)  -- e.g., Active, Inactive
);

-- Function to Generate Custom User ID
CREATE OR REPLACE FUNCTION generate_custom_user_id() RETURNS TRIGGER AS $$
DECLARE
    new_id VARCHAR(20);
BEGIN
    IF NEW.role = 'Employee' THEN
        new_id := 'NV-' || nextval('employee_id_seq');
    ELSIF NEW.role = 'Customer' THEN
        new_id := 'KH-' || nextval('customer_id_seq');
    ELSIF NEW.role = 'Provider' THEN
        new_id := 'LC-' || nextval('provider_id_seq');
    ELSE
        RAISE EXCEPTION 'Invalid role: %', NEW.role;
    END IF;

    NEW.custom_user_id := new_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to Automatically Generate Custom User ID
CREATE TRIGGER set_custom_user_id
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_custom_user_id();

-- Modify Employees Table to Link to Users
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,  -- Link to the users table
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    status VARCHAR(50)  -- e.g., Active, Inactive
);
-- Modify Customers Table to Link to Users
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,  -- Link to the users table
    name VARCHAR(255) NOT NULL,
    nationality VARCHAR(100),
    initials VARCHAR(10) UNIQUE,  -- Added column for customer initials with UNIQUE constraint
    registration_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50)  -- e.g., Active, Inactive
);

-- Modify Companies Table
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

-- Modify Providers Table to Link to Users and Add Additional Information
CREATE TABLE providers (
    provider_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,  -- Link to the users table
    company_name VARCHAR(255),
    provider_initials VARCHAR(10) UNIQUE,  -- Added column for provider initials with UNIQUE constraint
    tax_number VARCHAR(50) UNIQUE,  -- Added column for tax number with UNIQUE constraint
    debt NUMERIC(38,10) DEFAULT 0,  -- Added column for tracking provider's debt
    isInternal BOOLEAN DEFAULT FALSE,  -- Added column to indicate if the provider is an internal resource
    address VARCHAR(255),
    status VARCHAR(50)  -- e.g., Active, Inactive
);

-- Create Services Table
CREATE TABLE services (
    service_id VARCHAR(255) PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_description TEXT,  -- Detailed description or relevant information
    price NUMERIC(10, 2),
    type_of_service VARCHAR(255),  -- services or goods
    completion_time VARCHAR(50),  -- Time required to complete the service
    notes TEXT  -- Any additional notes or remarks
);

-- Modify Provider Services Table
CREATE TABLE provider_services (
    provider_service_id SERIAL PRIMARY KEY,
    provider_id INT REFERENCES providers(provider_id) ON DELETE CASCADE,
    service_id VARCHAR(255) REFERENCES services(service_id) ON DELETE CASCADE,
    price NUMERIC(10, 2),  -- Price that the provider charges for this service
    availability VARCHAR(255),  -- Information about when the service is available
    notes TEXT  -- Any additional information or remarks about the service provided
);

-- Modify Purchases Table
CREATE TABLE purchases (
    purchase_id SERIAL PRIMARY KEY,
    provider_service_id INT REFERENCES provider_services(provider_service_id) ON DELETE CASCADE,
    purchase_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    quantity INT NOT NULL,
    unit_price NUMERIC(10, 2),  -- Price per unit at the time of purchase
    total_cost NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,  -- Automatically calculated
    purchase_notes TEXT  -- Any additional notes about the purchase
);

-- Modify Service Requirements Table
CREATE TABLE service_requirements (
    requirement_id SERIAL PRIMARY KEY,
    service_id VARCHAR(255) REFERENCES services(service_id) ON DELETE CASCADE,
    requirement_description TEXT NOT NULL  -- Description of the required document or information
);

-- Modify Customer Requests Table
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

-- Modify Recurring Services Table
CREATE TABLE recurring_services (
    recurring_service_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    service_id VARCHAR(255) REFERENCES services(service_id),
    recurrence_interval recurrence_interval_type,  -- Use ENUM type for recurrence intervals
    next_due_date TIMESTAMPTZ,  -- Date when the next payment is due
    end_date TIMESTAMPTZ,  -- Date when the recurring service will end
    UNIQUE (customer_id, service_id)  -- Ensure each customer has a unique recurring service for a given service
);

-- Modify Transactions Table (Handles Both Sales and Purchases)
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,  -- e.g., "Sale", "Purchase"
    customer_id INT REFERENCES customers(customer_id),  -- Nullable, used only for sales
    provider_id INT REFERENCES providers(provider_id),  -- Nullable, used only for purchases
    service_id VARCHAR(255) REFERENCES services(service_id),  -- Nullable, depending on transaction type
    purchase_id INT REFERENCES purchases(purchase_id),  -- Nullable, link to purchase details if needed
    recurring_service_id INT REFERENCES recurring_services(recurring_service_id),  -- Nullable, for recurring payments
    payment_type VARCHAR(50),  -- e.g., "Credit Card", "Bank Transfer"
    amount_paid NUMERIC(10, 2),
    payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(50)  -- e.g., "Paid", "Pending", "Overdue"
);

-- Modify Tasks Table
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES customer_requests(request_id),
    assigned_to_employee_id INT REFERENCES employees(employee_id),  -- NULL if assigned to a third party
    assigned_to_provider_service_id INT REFERENCES provider_services(provider_service_id),  -- NULL if assigned to an employee
    assigned_by_employee_id INT REFERENCES employees(employee_id),
    task_description TEXT,
    start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMPTZ,
    status VARCHAR(50)  -- e.g., Not Started, In Progress, Completed
);

-- Modify Task Progress Table
CREATE TABLE task_progress (
    progress_id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(task_id),
    progress_description TEXT,
    update_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),  -- e.g., Not Started, In Progress, Completed
    updated_by_employee_id INT REFERENCES employees(employee_id),  -- For internal updates
    updated_by_provider_service_id INT REFERENCES provider_services(provider_service_id)  -- For updates from providers
);
CREATE TABLE documents (
    document_id SERIAL PRIMARY KEY,  -- Auto-incrementing ID for each document
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,  -- Store the user_id as a foreign key from the users table
    document_name VARCHAR(255) NOT NULL UNIQUE,  -- Store the name of the document
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP  -- Timestamp of the upload
);


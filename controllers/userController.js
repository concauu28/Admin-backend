const {createCustomerService, loginService,getUserService, getCustomerService, getSpecificCustomerService,
      getCustomerRequestsService, getCustomerTransactionsService, createCompanyService, getServiceService,
      addCustomerRequestService, getRequestService, createEmployeeService, getCompanyService, addServiceService,
      addRecurringService, updateCustomerService}= require("../services/UserService")
//LOGIN
const handleLogin = async(req,res) =>{
    const {email,password}=req.body
    const data =await loginService(email, password)
    console.log(data)
    return res.status(200).json(data)
}
//CREATE
const createCustomer = async(req,res) =>{
    console.log(req.body)
    const {name, username, phone_number, email, nationality, initials, status}=req.body
    const data = await createCustomerService(name, username, phone_number, email, nationality, initials, status)
    return res.status(200).json( data)
}
const createEmployee = async(req,res) =>{
    console.log(req.body)
    const {name, username, email, password, phone_number, role, department, status}=req.body
    const data = await createEmployeeService(name, username, email, password, phone_number, role, department, status)
    return res.status(200).json(data)
    
}
const createCompany = async(req,res) =>{
    const {company_name, customer_id, manufacturing_industry, tax_number, company_email, address, debt}=req.body
    const data = await createCompanyService(company_name, customer_id, manufacturing_industry, tax_number, company_email, address, debt)
    return res.status(200).json( data)
}
const addCustomerRequest = async(req,res) =>{
    const request = await addCustomerRequestService(req.body)
    return res.status(200).json(request)   
}
const addService = async(req,res)=>{
    const result = await addServiceService(req.body)
    return res.status(200).json(result)
}
const addRecurringRequest = async (req,res) => {
    const result = await addRecurringService(req.body)
    return res.status(200).json(result)
}
//GET
const getUser = async(req,res) =>{
    const listofuser= await getUserService()
    return res.status(200).json(listofuser)
}
const getAccount= async(req,res)=>{
    return res.status(200).json(req.user)
}
const getCustomer= async(req, res)=>{
    const listofcustomer = await getCustomerService()
    return res.status(200).json(listofcustomer)

}
const getCompany = async(req,res)=>{
    const company = await getCompanyService(req.params.userEmail)
    return res.status(200).json(company)
}
const getRequests = async(req,res)=>{
    const result = await getRequestService()
    return res.status(200).json(result)
}
const getSpecificCustomer = async(req,res)=>{
    const customer = await getSpecificCustomerService(req.params.userEmail)
    return res.status(200).json(customer)
}
const getSpecificCustomerRequests = async(req,res)=>{
    const customer = await getCustomerRequestsService(req.params.userEmail)
    return res.status(200).json(customer)
}
const getCustomerTransactions = async(req,res)=>{
    const transactions = await getCustomerTransactionsService(req.params.userEmail)
    return res.status(200).json(transactions)
}
const getService = async(req,res)=>{
    const services = await getServiceService()
    return res.status(200).json(services)
}

//UPDATE
const updateCustomer = async(req,res)=>{
    const result = await updateCustomerService(req.body)
    return res.status(200).json(result)
}




module.exports={
    createCustomer, createCompany, createEmployee, handleLogin, getUser, getAccount, 
    getCustomer, getSpecificCustomer, getRequests, getSpecificCustomerRequests, getCustomerTransactions, getService, addCustomerRequest,
    updateCustomer, getCompany, addService, addRecurringRequest
}

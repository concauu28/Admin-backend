const express = require('express');
const {createCustomer,createEmployee,handleLogin, getUser, getAccount, getCustomer, getSpecificCustomer, 
    getSpecificCustomerRequests, getCustomerTransactions, createCompany, getService, addCustomerRequest,updateCustomer,
     getCompany, getRequests,addService, addRecurringRequest} = require('../controllers/userController')
const { auth } = require('../middleware/auth');

const routerAPI = express.Router();

routerAPI.all('*', auth)

routerAPI.get("/",(req, res)=>{
    return res.status(200).json("HelloWorld")
})
//Login
routerAPI.post("/login", handleLogin)

//CREATE
//create user
routerAPI.post("/registercustomer", createCustomer)
routerAPI.post("/registerinternal", createEmployee)
//createCustomer
routerAPI.post("/createcustomer",createCustomer)
//create company
routerAPI.post("/registercompany", createCompany)
//add Customer Request
routerAPI.post("/postrequest", addCustomerRequest)
//add Recurring Request
routerAPI.post("/recurringrequest", addRecurringRequest)
//add new Service
routerAPI.post("/addservice",addService)

//GET
//GetUser
routerAPI.get("/user", getUser)
//GetAccount
routerAPI.get("/getaccount",getAccount)
//getCustomer
routerAPI.get("/getcustomer", getCustomer)
//getCompany
routerAPI.get("/getcompany/:userEmail", getCompany)
//getspecificCustomer
routerAPI.get("/getcustomer/:userEmail",getSpecificCustomer)
//getcustomerrequest
routerAPI.get("/getcustomerreq/:userEmail", getSpecificCustomerRequests)
//getcustomertransactions
routerAPI.get("/getcustomertrans/:userEmail", getCustomerTransactions)
//get services
routerAPI.get("/getservices", getService)
//get all requests
routerAPI.get("/getrequests", getRequests)


//UPDATE
//UpdateCustomer
routerAPI.post("/updatecustomer/",updateCustomer)
module.exports = routerAPI; //export default
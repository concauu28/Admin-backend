const express = require('express');
const {createCustomer,createEmployee,handleLogin, getUser, getAccount, getCustomer, getSpecificCustomer, 
    getSpecificCustomerRequests, getCustomerTransactions, createCompany, getService, addCustomerRequest,updateCustomer,
     getCompany, getRequests,addService, addRecurringRequest, addTransaction, updateCompany} = require('../controllers/userController')
const {createProvider, addProviderService, getListProvider, getProvider,getPService, updateProvider,updatePService} = require('../controllers/providerController')
const {reportUser} = require('../controllers/reportController')
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
//add new Transaction
routerAPI.post("/addtransaction",addTransaction)
//add new Provider
routerAPI.post("/registerprovider", createProvider)
//add new Provider Service
routerAPI.post("/addproviderservice", addProviderService)
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


//GetProvider
routerAPI.get("/getlistprovider", getListProvider)
//getProvider by id
routerAPI.get("/getprovider/:userid", getProvider)

//getProviderService
routerAPI.get("/getproviderservice/:user_id", getPService)

//UPDATE
//UpdateCustomer
routerAPI.put("/updatecustomer",updateCustomer)
//UpdateCompany
routerAPI.put("/updatecompany",updateCompany)

//updateProvider
routerAPI.put("/updateprovider",updateProvider)

//updateProviderService
routerAPI.put("/updateproviderservice",updatePService)

//REPORT
routerAPI.get("/reportuser", reportUser)

module.exports = routerAPI; //export default
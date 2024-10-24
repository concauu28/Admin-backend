const express = require('express');
const {createCustomer,createEmployee,handleLogin, getUser, getAccount, getCustomer, getSpecificCustomer, 
    getSpecificCustomerRequests, getCustomerTransactions, createCompany, getService, addCustomerRequest,updateCustomer,
     getCompany, getRequests,addService, addRecurringRequest, addTransaction, updateCompany,updateRequest} = require('../controllers/userController')
const {createProvider, addProviderService, getListProvider, getProvider,getPService, updateProvider,updatePService} = require('../controllers/providerController')
const {reportUser} = require('../controllers/reportController')
const {uploadDocument, getDocument,deleteDocument} = require('../controllers/fileController')
const {emailSender} = require('../controllers/emailController')
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

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
routerAPI.get("/getcompany/:user_id", getCompany)
//getspecificCustomer
routerAPI.get("/getcustomer/:user_id",getSpecificCustomer)
//getcustomerrequest
routerAPI.get("/getcustomerreq/:user_id", getSpecificCustomerRequests)
//getcustomertransactions
routerAPI.get("/getcustomertrans/:user_id", getCustomerTransactions)
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
//REPORT
routerAPI.get("/reportuser", reportUser)
//getUserFiles
routerAPI.get("/getdocuments/:user_id", getDocument)

//UPDATE
//UpdateCustomer
routerAPI.put("/updatecustomer",updateCustomer)
//UpdateCompany
routerAPI.put("/updatecompany",updateCompany)
//updateRequest
routerAPI.put("/updaterequest",updateRequest)
//updateProvider
routerAPI.put("/updateprovider",updateProvider)

//updateProviderService
routerAPI.put("/updateproviderservice",updatePService)



//POST
routerAPI.post("/uploaddoc",upload.single('file'), uploadDocument)
routerAPI.delete("/deletedoc",deleteDocument)


//Email
routerAPI.post("/sendemail", emailSender)
module.exports = routerAPI; //export default
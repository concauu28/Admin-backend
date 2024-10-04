const {createProviderService, createProviderServiceService, getListProviderService, getProviderService, 
    getProviderServiceService, updateProviderService, updateProviderServiceService}= require("../services/ProviderService")
const createProvider = async(req,res) =>{
    const data=req.body
    const result = await createProviderService(data);
    return res.status(200).json(result)
}
const addProviderService = async(req,res) =>{
    const data=req.body
    const result = await createProviderServiceService(data);
    return res.status(200).json(result)
}
const getListProvider = async(req,res) =>{
    const result = await getListProviderService();
    return res.status(200).json(result)
}
const getProvider = async(req,res) =>{
    const id=req.params.userid
    const result = await getProviderService(id);
    return res.status(200).json(result)
}
const getPService = async(req,res) =>{
    const id=req.params.user_id
    const result = await getProviderServiceService(id);
    return res.status(200).json(result)
}
const updateProvider = async(req,res)=>{
    const result = await updateProviderService(req.body)
    return res.status(200).json(result)
}
const updatePService = async(req,res)=>{
    const result = await updateProviderServiceService(req.body)
    return res.status(200).json(result)
}
module.exports = {createProvider,addProviderService, getListProvider, getProvider, getPService, updateProvider, updatePService} //export default
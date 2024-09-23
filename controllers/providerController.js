const {createProviderService, createProviderServiceService}= require("../services/ProviderService")
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
module.exports = {createProvider,addProviderService} //export default
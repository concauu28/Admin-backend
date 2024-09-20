const jwt = require("jsonwebtoken");
require("dotenv").config
const auth=(req,res,next)=>{
    const white_list=["/", "/login", "/registerinternal"];
    if(white_list.some(item => req.originalUrl === '/api' + item)){
        next()
    }
    else{
        if(req?.headers?.authorization?.split(' ')?.[1]){
            const token = req.headers.authorization.split(' ')[1];

            //verify
            try {
                const decoded = jwt.verify(token,process.env.JWT_SECRET)
                req.user={
                    email: decoded.email,
                    name: decoded.name,
                    createdBy: "Viet Tien Dang"
                }
                next()
            } catch (error) {
                return res.status(401).json({
                    message:"Token bi het han//hoac khong hop le"
                })
            }

        }
        else{
            return res.status(401).json({
                message:"Ban chua truyen access token o header/ token bi het han"
            })
        }
    }

}
module.exports={auth}
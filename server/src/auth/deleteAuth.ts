
export const deleteAuth = (req:any,res:any)=>{
    try {        
                req.logout(function(err:any) {
                    if (err) {  throw Error }
                    res.redirect('/');
                  });
            } catch (error) {
                console.log(error);
                
                res.send({permission:false})
                
            }
}

const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

// checking if password is valid
const isValidPassword = async (savedPassword, inputPassword) => 
{
    //console.log(`savedPassword : ${savedPassword}`);
    //console.log(`inputPassword : ${inputPassword}`);
    
    let match =  await bcrypt.compare(inputPassword, savedPassword);
    //console.log(`Password Match : ${match}`);

    return match;
    
};


// function for authenticating user from HTTP Header
const authorizedUser = async (token) =>
{
    //console.log(`token : ${token}`);
    token = token.replace('Bearer', '');
    token = token.trim();
    let { email } = jwt.verify(token, process.env.APP_SECRET);
    
    //console.log(`email : ${email}`);
    
    return email;

}




module.exports = {
    isValidPassword,
    authorizedUser
}
const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
var AWS = require("aws-sdk");
var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');

exports.confirm_email = (req, res) => {
    var confirmCode = req.body.confirm_code;
    var username = req.body.username;

    var poolData = {
        UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
        ClientId: process.env.CLIENT_ID, // Your client id here
    };
    
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool,
    };
    
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(confirmCode, true, function(err, result) {
        if (err) {
            //console.log(err.message || JSON.stringify(err));
            res.status(400).send("Can't not cofirm user")
            return;
        }
        console.log('call result: ' + result);
        res.send("Confirm successfully")
    });
}

exports.register = (req, res) => {
    var email = req.body.email;
    var phone_number = req.body.phone_number;
    var birthdate = req.body.birthdate;
    var gender = req.body.gender;
    var username = req.body.username;
    var password = req.body.password;

    var poolData = {
        UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
        ClientId: process.env.CLIENT_ID, // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    var attributeList = [];
    
    var dataEmail = {
        Name: 'email',
        Value: email,
    };
    
    var dataPhoneNumber = {
        Name: 'phone_number',
        Value: phone_number,
    };
    var dataBirth = {
        Name: 'birthdate',
        Value: birthdate,
    }
    var dataGender = {
        Name: 'gender',
        Value: gender,
    }
    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    var attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(
        dataPhoneNumber
    );
    var attributeBirth = new AmazonCognitoIdentity.CognitoUserAttribute(dataBirth);
    var attributeGender = new AmazonCognitoIdentity.CognitoUserAttribute(dataGender);
    
    attributeList.push(attributeEmail);
    attributeList.push(attributePhoneNumber);
    attributeList.push(attributeBirth);
    attributeList.push(attributeGender);

    userPool.signUp(username, password, attributeList, null, function(err,result){
        if (err) {
            res.status(400).send(err.message || JSON.stringify(err))
            return
        }
        var cognitoUser = result.user;
        res.send("Register successfully username: "+cognitoUser.getUsername());
    });
}

exports.login = (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    var authenticationData = {
        Username: username,
        Password: password,
    };
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
        authenticationData
    );
    var poolData = {
        UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
        ClientId: process.env.CLIENT_ID, // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool,
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            var accessToken = result.getAccessToken().getJwtToken();
            var refreshToken = result.getRefreshToken();
            var idToken = result.getIdToken().getJwtToken();
            
            AWS.config.region = 'ap-southeast-1';
    
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: process.env.IDENTITY_POOL_ID, // your identity pool id here
                Logins: {
                    'cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_PFUux5qaA': result
                        .getIdToken()
                        .getJwtToken(),
                },
            });
    
            //refreshes credentials using AWS.CognitoIdentity.getCredentialsForIdentity()
            AWS.config.credentials.refresh(error => {
                if (error) {
                    console.error(error);
                } else {
                    var respond = {
                        accessToken: accessToken,
                        idToken: idToken,
                        refreshToken: refreshToken
                    }
                    res.send(respond)
                }
            });
        },
    
        onFailure: function(err) {
            res.status(400).send(err.message || JSON.stringify(err));
            return;
        },
    });
}

exports.signout = (req, res) => {
    var accessToken = req.body.accessToken;

    var poolData = {
        UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
        ClientId: process.env.CLIENT_ID, // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    var accessToken = req.body.accessToken;
    var jwk = {"keys":[{"alg":"RS256","e":"AQAB","kid":"CpYfQP1KwhKcibRZ4kRXQHag8zM/Tk5O1aKogCLpjmY=","kty":"RSA","n":"wY_HvAZADavIL5JygtKNdP19Zza8BErCcHMupduKjPjZDnHLTnATuGpcMk5Xf2CBq8LprxLaB9ZmtI7WvJVQG0pkJ6IvQPeS-g4bZOz9giHmhGmzg7M9ZFIhSGS-NbFQx0-Sbo5AssL_I6OkMWHOotLuSe4gNTeUvYgxC2OhLFznGPLvar_giGRxPU2JDf5wZozTFyxcST5BP6OmfQKdIeljRItD4Ph0-5xNe8kkkLHYNmGPKtSv4-_VeKz-AY6oOwtZEYkVdz4UZRreExL2ZE5AUZVhwmYM1Cv_bXJQgHdUO-LZF0p3J4TScoaIwFuYQbAM2i0WuvTJ3jqgr7l2fw","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"VBbR/gPvOEm5gMWpmDN1/qGvLE6C6qCFUTxGaBgf/Cc=","kty":"RSA","n":"te4PHvB44aaOLnnw2ATsu1SAPlZ_R0tyrgAmLipA4Nc2ROIJPbNMrAOCsho1YP5uBifKRIX3NGiNABUaH_ESXoBupK3ki9cwivrrM8r6Bxi2pakm3Iyz4rFgtJr2M3WOAtDlJ0GuWNR-yGt_cqyKLu9Ye-6IzI9Z5Z6WjPzwCGRCAQF1pTP6iO5Rfp-J_uh0dFBLT_mrAvUq2_IVdneOt7y1_lj9QXDoMrLm5oZKpcNb3KqqOEdJrbyKfKl8L6W0I24ij2qTbj7kiEtjweMlydJSzJS20RuhGk8BYOPqVt5xeaZpGXPkWocOF2ptbrEh9-w16R8uNTGpRKnLSrQ2OQ","use":"sig"}]};
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send(err);
            return
        }

        var userData = {
            Username: decoded.username,
            Pool: userPool,
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.getSession((err, result) =>{
            if(result){
                cognitoUser.globalSignOut({
                    onSuccess: function(result){
                        res.send(result)
                    },
                    onFailure: function(err){
                        res.status(400).send(err)
                        return
                    },
                });
            }else{
                res.status(400).send("Already signed out");
                return
            }
        })
    })
}


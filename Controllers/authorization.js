const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
var AWS = require("aws-sdk");
var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');

exports.refresh_token = (req, res) => {
    var refresh_Token = req.body.refreshToken;
    var params = {
        AuthFlow: "REFRESH_TOKEN_AUTH", /* required */
        ClientId: process.env.CLIENT_ID, /* required */
        AuthParameters: {
          'REFRESH_TOKEN': refresh_Token,
        }
      };
      var cognito = new AWS.CognitoIdentityServiceProvider();
      cognito.initiateAuth(params, function(err, data) {
        if (err){
            res.status(400).send(err)
            return
        }
        else {
            res.send(data);
        }
    });
}

exports.get_presigned_url = (req, res) => {

    var accessToken = req.query.accessToken;
    var fileName = req.query.filename;
    var jwk = {"keys":[{"alg":"RS256","e":"AQAB","kid":"CpYfQP1KwhKcibRZ4kRXQHag8zM/Tk5O1aKogCLpjmY=","kty":"RSA","n":"wY_HvAZADavIL5JygtKNdP19Zza8BErCcHMupduKjPjZDnHLTnATuGpcMk5Xf2CBq8LprxLaB9ZmtI7WvJVQG0pkJ6IvQPeS-g4bZOz9giHmhGmzg7M9ZFIhSGS-NbFQx0-Sbo5AssL_I6OkMWHOotLuSe4gNTeUvYgxC2OhLFznGPLvar_giGRxPU2JDf5wZozTFyxcST5BP6OmfQKdIeljRItD4Ph0-5xNe8kkkLHYNmGPKtSv4-_VeKz-AY6oOwtZEYkVdz4UZRreExL2ZE5AUZVhwmYM1Cv_bXJQgHdUO-LZF0p3J4TScoaIwFuYQbAM2i0WuvTJ3jqgr7l2fw","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"VBbR/gPvOEm5gMWpmDN1/qGvLE6C6qCFUTxGaBgf/Cc=","kty":"RSA","n":"te4PHvB44aaOLnnw2ATsu1SAPlZ_R0tyrgAmLipA4Nc2ROIJPbNMrAOCsho1YP5uBifKRIX3NGiNABUaH_ESXoBupK3ki9cwivrrM8r6Bxi2pakm3Iyz4rFgtJr2M3WOAtDlJ0GuWNR-yGt_cqyKLu9Ye-6IzI9Z5Z6WjPzwCGRCAQF1pTP6iO5Rfp-J_uh0dFBLT_mrAvUq2_IVdneOt7y1_lj9QXDoMrLm5oZKpcNb3KqqOEdJrbyKfKl8L6W0I24ij2qTbj7kiEtjweMlydJSzJS20RuhGk8BYOPqVt5xeaZpGXPkWocOF2ptbrEh9-w16R8uNTGpRKnLSrQ2OQ","use":"sig"}]};
    var pem = jwkToPem(jwk.keys[1]);
    jwt.verify(accessToken, pem,{algorithms: ["RS256"]} , function(err, decoded) {
        if(err){
            res.status(400).send("Invalid Token")
            return
        }
        var poolData = {
            UserPoolId: process.env.USER_POOL_ID, // Your user pool id here
            ClientId: process.env.CLIENT_ID, // Your client id here
        };
        var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        
        var userData = {
            Username: decoded.username,
            Pool: userPool,
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.getSession((err, result) =>{
            if(result){
                AWS.config.region = 'ap-southeast-1';

                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: process.env.IDENTITY_POOL_ID, // your identity pool id here
                    Logins: {
                        // Change the key below according to the specific region your user pool is in.
                        'cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_PFUux5qaA': result
                            .getIdToken()
                            .getJwtToken(),
                    },
                });
 
                AWS.config.credentials.refresh(error => {
                    if (error) {
                        console.error(error);
                    } else {
                        var s3 = new AWS.S3();
                        var params = {Bucket:'mybucketapp', Key: fileName, Expires: 300};
                        s3.getSignedUrl('getObject', params, function (err, url) {
                            if(err){
                                res.status(404).send("No File Found")
                                return;
                            }else{
                                res.send({key:url })
                            }
                        });
                    }
                });
            }else{
                res.status(400).send("User signed out")
                return
            }
        })
    })
}

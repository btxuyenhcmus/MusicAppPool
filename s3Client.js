const {S3Client} = require("@aws-sdk/client-s3");
const {fromIni} = require("@aws-sdk/credential-providers");
const REGION = "ap-southeast-3";

const s3Client = new S3Client({
    credentials: fromIni({profile: 'work-account'}),
    region: REGION
})
exports.s3Client = s3Client;
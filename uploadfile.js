const { PutObjectCommand } = require("@aws-sdk/client-s3")
const { s3Client } = require("./s3Client.js");

var fs = require('fs');

function uploadFile(file, img, fileName, imgName){
    const fileStream = fs.createReadStream(file.path)
    const imageStream = fs.createReadStream(img.path)
    const bucketParams = {
        Bucket: "musicstorage",
        Key: "music/"+ fileName,
        Body: fileStream
    }
    const bucketParams2 = {
        Bucket: "musicstorage",
        Key: "coverImg/" + imgName,
        Body: imageStream
    }

    const run = async () => {
        try{
            const data  = await s3Client.send(new PutObjectCommand(bucketParams));
            await s3Client.send(new PutObjectCommand(bucketParams2));

            //return data;
            console.log("seem ok")
        }catch (err){
            console.log("Error, err");
        }
    };
    run();
}
exports.uploadFile = uploadFile;
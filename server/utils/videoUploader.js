const cloudinary = require('cloudinary').v2;

exports.uploadVideoToCloudinary = async(file, folder) => {
    const options = {
        folder, 
        resource_type: "video" 
    };

    return await cloudinary.uploader.upload(file.tempFilePath, options);
}

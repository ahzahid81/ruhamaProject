const multer =
  require("multer");

const {
  CloudinaryStorage,
} =
  require("multer-storage-cloudinary");


const cloudinary =
  require("../config/cloudinary");



const storage =
  new CloudinaryStorage({

    cloudinary,

    params: {

      folder:
        "ruhama/students",

      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "webp",
      ],

      transformation: [

        {
          width: 500,

          height: 500,

          crop: "limit",

        }

      ]

    }

  });



const uploadImage =
  multer({

    storage,

    limits: {

      fileSize:
        5 * 1024 * 1024,

    },

  });



module.exports =
  uploadImage;
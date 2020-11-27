const mongoose = require('mongoose')

const Schema = mongoose.Schema
const productSchema = new Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true
        },
        name: [{
            type: String,
            required: true,
            unique: true
        }],
        description:[{
            type: String,
            required: true,
        }],
        price: [{
            type: String
        }],   
        imageSrc: {
            type: String,
            default: ""
        }
    }
)
module.exports = mongoose.model('productLang', productSchema)
const mongoose = require('mongoose')

const Schema = mongoose.Schema
const serSchema = new Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true
        },
        name: [{
            type: String,
            required: true,
        }],
        description: [{
            type: String,
            default: ""
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
module.exports = mongoose.model('serviceLang', serSchema)
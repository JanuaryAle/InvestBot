const mongoose = require('mongoose')

const Schema = mongoose.Schema
const serSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        description:{
            type: String,
            required: true,
        },
        price: {
            type: String
        },   
        imageSrc: {
            type: String,
            default: ""
        }
    }
)
module.exports = mongoose.model('service', serSchema)
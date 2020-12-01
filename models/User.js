const mongoose = require('mongoose')

const Schema = mongoose.Schema
const userSchema = new Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true
        },
        step: {
            type: Number,
            required: true,
        },
        lang: {
            type: String,
            required: true,
        },
        adm: {
            type: Boolean,
            required: true,
            default: false
        }
    }
)
module.exports = mongoose.model('user', userSchema)
const mongoose = require('mongoose')

const Schema = mongoose.Schema
const docsScema = new Schema(
    {
        file_id: {
            type: String,
            required: true,
        },
        file_name: {
            type: String,
            required: true,
        }
    }
)
module.exports = mongoose.model('docs', docsScema)
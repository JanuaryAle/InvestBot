const mongoose = require('mongoose')

const Schema = mongoose.Schema
const answerScema = new Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true
        },
        answer: [{
            type: String,
            required: true,
        }],
        question: [{
            type: String,
            required: true,
        }]
    }
)
module.exports = mongoose.model('answers', answerScema)
const User = require('../models/User')
const file = require('../data/info.json')
const fs = require('fs')

const dict = {
    "ru" : 0,
    "en" : 1
}

module.exports.findOne = async function(element){
    try{
        const item = await User.findOne(element)
        return item
    }catch(e){
        console.log(e)
    }
}

module.exports.create = async function(ctx){

        const item = new User({
            id: ctx.chat.id,
            lang: "ru",
            step: 1
        })

        try{
            await item.save()
            return item        
        }catch(e){
            console.log(e)
        }
    }

module.exports.update = async function(element){
    try{
        const item = await User.findOneAndUpdate(
            {id: element.id},
            {$set: element},
            {new: true}
        )
        return item
    }catch(e){
        console.log(e)
    }
}

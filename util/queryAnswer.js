const Answer = require('../models/Answer')
const file = require('../data/info.json')
const fs = require('fs')

const dict = {
    "ru" : 0,
    "en" : 1
}

module.exports.getAll = async function(ctx) {
    try{
        const items = await Answer.find()
        const newItems = []
        items.forEach(element => {
            let newElement = {}
            newElement.answer = element.answer[dict[ctx.i18n.locale()]]
            newElement.question = element.description[dict[ctx.i18n.locale()]]
            newItems.push(newElement)
        });
        return newItems
    }catch(e){
        console.log(e)
    }
}

module.exports.getAllRed = async function() {
    try{
        const items = await Answer.find()
        return items
    }catch(e){
        console.log(e)
    }
}

module.exports.remove = async function(element){
    try{
        const item = await Answer.remove({id : element.id})      
        return item
    }catch(e){
        console.log(e)
    }
}

module.exports.create = async function(element){
        const item = new Answer(element)
        
        try{
            await item.save()

            return item        
        }catch(e){
            console.log(e)
        }
    }


const Product = require('../models/ServiceLang')
const file = require('../data/info.json')
const fs = require('fs')

const dict = {
    "ru" : 0,
    "en" : 1
}

module.exports.getAll = async function(ctx) {
    try{
        const items = await Product.find()
        const newItems = []
        items.forEach(element => {
            let newElement = {}
            newElement.name = element.name[dict[ctx.i18n.locale()]]
            newElement.description = element.description[dict[ctx.i18n.locale()]]
            newElement.price = element.price[dict[ctx.i18n.locale()]]
            newElement.imageSrc = element.imageSrc
            newItems.push(newElement)
        });
        return newItems
    }catch(e){
        console.log(e)
    }
}

module.exports.getAllRed = async function() {
    try{
        const items = await Product.find()
        return items
    }catch(e){
        console.log(e)
    }
}

module.exports.remove = async function(element){
    try{
        const item = await Product.remove({ id : element.id})      
        return item
    }catch(e){
        console.log(e)
    }
}

module.exports.create = async function(element){

    const item = new Product(element)

    try{
        await item.save()

        return item        
    }catch(e){
        console.log(e)
    }
}

module.exports.update = async function(element){
    try{
        const item = await Product.findOneAndUpdate(
            {id: element.id},
            {$set: element},
            {new: true}
        )
        return item
    }catch(e){
        console.log(e)
    }
}

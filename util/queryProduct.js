const Product = require('../models/Product')

module.exports.getAll = async function() {
    try{
        const items = await Product.find()
        return items
    }catch(e){
    }
}

module.exports.remove = async function(element){
    try{
        const item = await Product.remove({ name : element.name})
      
        return item
    }catch(e){
    }
}

module.exports.create = async function(element){
        const item = new Product(element)
        try{
            await item.save()
            
            return item
        }catch(e){
        }
    }

module.exports.update = async function(element, name){
    try{
        const item = await Product.findOneAndUpdate(
            {name: name},
            {$set: element},
            {new: true}
        )
        return item
    }catch(e){
    }
}

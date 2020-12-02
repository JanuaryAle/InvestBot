const Document = require('../models/Document')

module.exports.getAll = async function() {
    try{
        const items = await Document.find()
        return items
    }catch(e){
        console.log(e)
    }
}

module.exports.getAllRed = async function() {
    try{
        const items = await Document.find()
        return items
    }catch(e){
        console.log(e)
    }
}

module.exports.remove = async function(element){
    try{
        const item = await Document.remove({file_id : element.file_id})      
        return item
    }catch(e){
        console.log(e)
    }
}

module.exports.create = async function(element){
    const item = new Document(element)       
    try{
        await item.save()
        return item        
    }catch(e){
        console.log(e)
    }
}


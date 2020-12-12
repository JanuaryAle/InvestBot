const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const Scene = require('telegraf/scenes/base')

const queryProduct = require('../util/queryProductLang');
const queryService = require('../util/queryServiceLang');
const queryAnswer = require('../util/queryAnswer')
const queryDocs = require('../util/queryDocs');
const { command } = require('telegraf/scenes/base');

let message
let stack = []
let listP
let listS
let answers
let docs

const keyboard = 
    [
        [Markup.callbackButton('❔ FAQ', '❔ FAQ'), Markup.callbackButton('📢 Отчеты', '📢 Отчеты')],
        [Markup.callbackButton('🔵 Услуги', '🔵 Услуги'), Markup.callbackButton('🟢 Товары', '🟢 Товары')]
    ]


const keyboard1 = 
    [
        [Markup.callbackButton('➕Добавить вопрос', 'add'), Markup.callbackButton('✖️Удалить вопрос', 'del')]
        ,[Markup.callbackButton('Посмотреть', 'show'), Markup.callbackButton('Шаг назад', 'back')]
    ]


const keyboard2 = 
    [
        [Markup.callbackButton('➕Добавить отчет', 'add'),Markup.callbackButton('✖️Удалить отчет', 'del')]
        ,[Markup.callbackButton('Посмотреть', 'show'), Markup.callbackButton('Шаг назад', 'back')]
    ]


const keyboard3 = 
    [
        [Markup.callbackButton('🛠Редактировать', 'red'), Markup.callbackButton('✖️Удалить услугу', 'del')],
        [Markup.callbackButton('➕Добавить услугу', 'add')],
        [Markup.callbackButton('Посмотреть', 'show'), Markup.callbackButton('Шаг назад', 'back')]
    ]


const keyboard4 = 
    [
        [Markup.callbackButton('🛠Редактировать', 'red'), Markup.callbackButton('✖️Удалить продукт', 'del')],
        [Markup.callbackButton('➕Добавить продукт', 'add')],
        [Markup.callbackButton('Посмотреть', 'show'), Markup.callbackButton('Шаг назад', 'back')]
    ]


dict = {
    "❔ FAQ": keyboard1,
    "📢 Отчеты": keyboard2,
    "🔵 Услуги": keyboard3,
    "🟢 Товары": keyboard4
}

dictList = {
    "❔ FAQ": listFAQ,
    "📢 Отчеты": listReports,
    "🔵 Услуги": listSer,
    "🟢 Товары": listProd
}

dictAdd = {
    "❔ FAQ": addFAQ,
    "📢 Отчеты": addReport
}

let timeout
class SceneGenerator{

    admin() {
        const item = new Scene('admin')

        item.enter(async ctx => {
            try{
                loadServices(ctx)
                loadProducts(ctx)
                loadAnswers(ctx)
                loadDocs(ctx)
                ctx.webhookReply = false
                await ctx.replyWithHTML(`<b>Добро пожаловать в режим администратора!</b> Чтобы вернуться в меню, воспользуйтесь клавиатурой...`, 
                Extra.HTML({parse_mode: 'HTML'})
                .markup(Markup.keyboard(
                    [[`📚 Вернуться в меню`]]).resize()))
                const scem = {text: `Что вы хотели бы отредактировать?`, keyboard: keyboard}
                message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
                //ctx.webhookReply = true
                stack.push(scem)
                updateTimeout(ctx)
                }catch(e){}
        })

        item.action(/🟢|🔵|📢|❔/, async ctx => {  // буквы - нет
            try{
                if (ctx.update.callback_query.message.message_id === message.message_id){
                const text = ctx.callbackQuery.data
                await ctx.telegram.deleteMessage(message.chat.id, message.message_id) // в функц
                const scem = { text: text, keyboard: dict[text]}
                ctx.webhookReply = false
                message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
                //ctx.webhookReply = true
                stack.push(scem)
                updateTimeout(ctx)
            }}catch(e){console.log(e)}
        })

        item.action('back', async ctx => {
            try{
                if (ctx.update.callback_query.message.message_id === message.message_id){
                    try{
                        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
                        stack.pop()
                        const scem = stack[stack.length - 1]
                        ctx.webhookReply = false
                        message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
                        //ctx.webhookReply = true
                        updateTimeout(ctx)
                    }catch(e){console.log(e)}
                }
            }catch(e){console.log(e)}
        })

        item.action('show', async ctx => {
            try{    
                list(ctx, "Показать")
            }catch(e){console.log(e)}
        })

        item.action('del', async ctx => {
            try{
                list(ctx, "Удалить")
            }catch(e){console.log(e)}
        })

        item.action('red', async ctx => {
            try{
                try{    
                    list(ctx, "Редактировать")
                }catch(e){console.log(e)}
            }catch(e){}
        })

        item.hears(/📚/, async ctx => {
            require("./helper").menuMessage(ctx)  
        })

        item.action(/ques#/, async ctx => {
            try{
                if (ctx.update.callback_query.message.message_id === message.message_id){
                    if (ctx.update.callback_query.message.text.startsWith("Показать")){
                        showQuestion(ctx)
                    }if (ctx.update.callback_query.message.text.startsWith("Удалить")){
                        deleteQuestion(ctx)
                    }
                    updateTimeout(ctx)
            }}catch(e){console.log(e)}
        })

        item.action(/prod#|ser#/, async ctx => {
            try{
                if (ctx.update.callback_query.message.message_id === message.message_id){
                    if (ctx.update.callback_query.message.text.startsWith("Показать")){
                        showPS(ctx, ctx.callbackQuery.data.startsWith('p')? listP : listS)
                    }else if (ctx.update.callback_query.message.text.startsWith("Удалить")){
                        deletePS(ctx, ctx.callbackQuery.data.startsWith('p')? listP : listS)
                    }else if (ctx.update.callback_query.message.text.startsWith("Редакт")){
                        if (message.text.indexOf("🔵 Услуги") !== -1 ){
                            redPS(ctx, '🔵 Услуги', listS)
                        }else if (message.text.indexOf('🟢 Товары') !== -1){
                            redPS(ctx, '🟢 Товары', listP)
                        }
                    }
                    updateTimeout(ctx)
            }}catch(e){}
        })

        item.action('add', async ctx => {
            try{
                if (ctx.update.callback_query.message.message_id === message.message_id){
                    if (message.text.startsWith("🔵 Услуги")){
                        addPS(ctx, '🔵 Услуги')
                    }else if (message.text.startsWith('🟢 Товары')){
                        addPS(ctx, '🟢 Товары')
                    }else dictAdd[ctx.update.callback_query.message.text](ctx)
                    updateTimeout(ctx)    
                }
            }catch(e){}
        })

        item.action(/docs#/, async ctx => {
            try{
                if (ctx.update.callback_query.message.text.startsWith("Показать")){
                    const i = +ctx.callbackQuery.data.substr(5)
                    await ctx.telegram.sendDocument(ctx.chat.id, docs[i].file_id)} 
                if (ctx.update.callback_query.message.text.startsWith("Удалить")){
                    deleteReport(ctx)
                } 
                updateTimeout(ctx)               
            }catch(e){}})

        item.on('text', async ctx => {
            try{
                if (message.text.startsWith("❔ FAQ Добавление")){
                    addFaq2(ctx)
                }else if (message.text.startsWith("🔵 Услуги Добавление")){
                    addPS2(ctx, listS)
                }else if (message.text.startsWith('🟢 Товары Добавление')){
                    addPS2(ctx, listP)
                }else if (message.text.startsWith("🔵 Услуги Редак")){
                    redPS1(ctx, listS)
                }else if (message.text.startsWith('🟢 Товары Редак')){
                    redPS1(ctx, listP)
                }
                updateTimeout(ctx)
            }catch(e){}})

        item.on('message', async ctx => {
            try{
                if (ctx.update.message.document){
                if (message.text.startsWith("📢 Отчеты Можете отправлять")){
                    try{
                        const element = {
                            file_name : ctx.update.message.document.file_name,
                            file_id : ctx.update.message.document.file_id
                        }

                        const promise = await queryDocs.create(element)
                        ctx.webhookReply = false
                        if (promise){
                            await ctx.replyWithHTML(`Элемент ${element.file_name} добавлен!`)
                            //ctx.webhookReply = true
                            docs.push(element)
                        }else{
                            await ctx.replyWithHTML(`Элемент ${element.file_name} добавить не удалось...`)
                            //ctx.webhookReply = true
                        }        
                        updateTimeout(ctx)
                    }catch(e){}}
            }}catch(e){}
        })

        item.leave(async ctx => {
            await ctx.replyWithHTML('Выход из режима администратора...')
        })
        return item
    }
}

module.exports = new SceneGenerator().admin()

async function updateTimeout(ctx){
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(async () => {
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        require("./helper").menuMessage(ctx)
    }, 900000)
}

async function list(ctx, spec){
    if (ctx.update.callback_query.message.message_id === message.message_id){
        const text = ctx.update.callback_query.message.text
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        const scem = {text: spec + " "+ text}
        scem.keyboard = dictList[text](ctx)
        ctx.webhookReply = false
        message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
        //ctx.webhookReply = true
        updateTimeout(ctx)
        stack.push(scem)
    }
}

//////////////////////////

function listFAQ()
{
    let keyboard = []
    answers.forEach((item, i) => {
        keyboard.push([Markup.callbackButton(item.question[0], `ques#${item.id}`)])
    })
    keyboard.push([Markup.callbackButton('Шаг назад', 'back')])
    return keyboard
}

async function addFAQ(ctx)
{
    await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
    const scem = {text: "❔ FAQ Добавление элемента, скопируйте шаблон внизу и замените * на соотвствующий текст", keyboard: [Markup.callbackButton('Отменить', 'back')]}
    ctx.webhookReply = false
    message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
    //ctx.webhookReply = true
    stack.push(scem)
    ctx.replyWithHTML(
`🇷🇺 Вопрос:
*
🇷🇺 Ответ:
*
🇺🇸 Question:
*
🇺🇸 Answer:
*`)}

async function showQuestion(ctx){
    var id = +ctx.callbackQuery.data.split("#")[1]
    let element
    answers.forEach(item => {
        if (item.id == id){
            element = item
            return
        }
    })
    if (element){
        await ctx.replyWithHTML(
`🇷🇺 Вопрос:
${element.question[0]}
🇷🇺 Ответ:
${element.answer[0]}
🇺🇸 Question:
${element.question[1]}
🇺🇸 Answer:
${element.answer[1]}`)
    }
}

async function deleteQuestion(ctx){
    try{
        let element
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        const id = +ctx.callbackQuery.data.split("#")[1]

        answers.forEach(item => {
            if (item.id == id){
                element = item
            }
        })

        const promise = await queryAnswer.remove(element)

        const scem = {text: "Элемент удален!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}
        ctx.webhookReply = false
        if (promise){
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            //ctx.webhookReply = true
            answers = answers.filter(item => item !== element)
        }else{
            scem.text = 'Что-то пошло не так'
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            //ctx.webhookReply = true
        }        
        stack.pop()
        stack.push(scem)
    }catch(e){console.log(e)}
}

async function addFaq2(ctx){
    try{
        const element = {}
        element.question = []
        element.answer = []
        element.id = answers.length > 0 ? answers[answers.length - 1].id + 1 : 0
        let text = ctx.message.text.trim()

        let index = text.indexOf("🇷🇺 Вопрос:")
        if (index === -1) throw Error()
        text = text.substr(index + 12)
        index = text.indexOf("🇷🇺 Ответ:")
        if (index === -1) throw Error()
        element.question[0] = text.substr(0, index - 1).trim()

        text = text.substr(index + 11)
        index = text.indexOf("🇺🇸 Question:")
        if (index === -1) throw Error()
        element.answer[0] = text.substr(0, index - 1).trim()

        text = text.substr(index + 14)
        index = text.indexOf("🇺🇸 Answer:")
        if (index === -1) throw Error()
        element.question[1] = text.substr(0, index - 1).trim()

        text = text.substr(index + 12)
        element.answer[1] = text.trim()
        
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        const promise = await queryAnswer.create(element)
        const scem = {text: "Элемент добавлен!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}
        ctx.webhookReply = false
        if (promise){

            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            //ctx.webhookReply = true
            answers.push(element)
        }else{
            scem.text = 'Что-то пошло не так'
            //ctx.webhookReply = false
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            //ctx.webhookReply = true
        }        

        stack.pop()
        stack.push(scem)

    }catch(e){
        ctx.reply("Введенные данные не соответствуют шаблону, пожалуйста, повторите еще раз или отмените действие...")
    }
}

//////////////////////////

async function addReport(ctx)
{
    try{
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        const scem = {text: "📢 Отчеты Можете отправлять документы, убедитесь, что название файлов соответсвует шаблону: [Группа]-DD.MM.YY.[Расширение]\n\nНапример 'IPO-29.08.2020.xlsx'\n\nНазвания групп: Акции, IPO, Советники", keyboard: [Markup.callbackButton('Закончить', 'back')]}
        ctx.webhookReply = false
        message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
        //ctx.webhookReply = true
        stack.push(scem)
    }catch(e){}
}

function listReports()
{
    try{
        docs.sort((a, b) => a.file_name < b.file_name ? 1 : -1)
    
        let keyboard = []

        for (let i = 0; i < docs.length; i+=2){
            let mini = []
            let j = i + 1
            mini.push(Markup.callbackButton(`${docs[i].file_name}`, `docs#${i}`))
            while (j < docs.length && j < i + 2){
                mini.push(Markup.callbackButton(`${docs[j].file_name}`, `docs#${j}`))
                j++
            }
            keyboard[keyboard.length] = mini
        }
        keyboard.push([Markup.callbackButton('Шаг назад', 'back')])
        return keyboard
    }catch(e){}
}

async function deleteReport(ctx){
    try{
        let element
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        const id = +ctx.callbackQuery.data.split("#")[1]

        docs.forEach((item, index) => {
            if (index == id){
                element = item
            }
        })

        const promise = await queryDocs.remove(element)

        const scem = {text: "Элемент удален!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}

        if (promise){
            ctx.webhookReply = false
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            //ctx.webhookReply = true
            docs = docs.filter(item => item !== element)
        }else{
            scem.text = 'Что-то пошло не так'
            ctx.webhookReply = false
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            //ctx.webhookReply = true
        }        
        stack.pop()
        stack.push(scem)
    }catch(e){console.log(e)}
}

// Товары и услуги

async function loadServices(ctx){
    const promise = queryService.getAllRed(ctx)

    promise.then(async (data) =>{
        listS = data                           
    }).catch( err => console.log(err))                             
}

async function loadProducts(ctx){
    const promise = queryProduct.getAllRed(ctx)

    promise.then(async (data) =>{
    listP = data
    }).catch( err => console.log(err))                      
}

async function loadAnswers(ctx){
    const promise = queryAnswer.getAllRed(ctx)

    promise.then(async (data) =>{
        answers = data
    }).catch( err => console.log(err))                      
}

async function loadDocs(){
    const promise = queryDocs.getAll()

    promise.then(async (data) =>{
        docs = data
    }).catch( err => console.log(err))                      
}

function listProd()
{
    try{
        let keyboard = []
        if (listP)
            listP.forEach((item, i) => {
                keyboard.push([Markup.callbackButton(item.name[0], `prod#${item.id}`)])
            })
        keyboard.push([Markup.callbackButton('Шаг назад', 'back')])
        return keyboard
    }catch(e){}
}

function listSer()
{
    try{
        let keyboard = []
        if (listS)
            listS.forEach((item, i) => {
                keyboard.push([Markup.callbackButton(item.name[0], `ser#${item.id}`)])
            })
        keyboard.push([Markup.callbackButton('Шаг назад', 'back')])
        return keyboard
    }catch(e){}
}

async function showPS(ctx, list){
    try{
    var id = ctx.callbackQuery.data.split("#")[1]
    let element
    list.forEach(item => {
        if (item.id == id){
            element = item
            return
        }
    })
    if (element){
        await ctx.replyWithHTML(
`🇷🇺 Название:
${element.name[0]}
🇷🇺 Описание:
${element.description[0]}
🇷🇺 Стоимость:
${element.price[0]}
🇺🇸 Name:
${element.name[1]}
🇺🇸 Description:
${element.description[1]}
🇺🇸 Price:
${element.price[1]}
🇷🇺 Изображение:
${element.imageSrc}`)
    }}catch(e){}
}

async function deletePS(ctx, list){
    try{
        let element
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        const id = +ctx.callbackQuery.data.split("#")[1]

        list.forEach(item => {
            if (item.id == id){
                element = item
                return
            }
        })

        const promise = list === listP ? await queryProduct.remove(element) : await queryService.remove(element)

        const scem = {text: "Элемент удален!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}

        if (promise){
            ctx.webhookReply = false
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            //ctx.webhookReply = true
            if (list === listP){
                listP = listP.filter(item => item !== element)
            }else listS = listS.filter(item => item !== element) 
        }else{
            scem.text = 'Что-то пошло не так'
            ctx.webhookReply = false
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            //ctx.webhookReply = true
        }        
        stack.pop()
        stack.push(scem)
    }catch(e){console.log(e)}
}

async function addPS(ctx, text){
    try{
    await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
    const scem = {text: text + " Добавление элемента, скопируйте шаблон внизу и замените * на соотвствующий текст, максимальный размер названия - 100 символов, описания - 800, стоимости - 100", keyboard: [Markup.callbackButton('Отменить', 'back')]}
    ctx.webhookReply = false
    message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
    //ctx.webhookReply = true
    stack.push(scem)
    ctx.replyWithHTML(
`🇷🇺 Название:
*
🇷🇺 Описание:
*
🇷🇺 Стоимость:
*
🇺🇸 Name:
*
🇺🇸 Description:
*
🇺🇸 Price:
*
🇷🇺 Изображение:
*`)}catch(e){}
}

let elementPS

async function redPS(ctx, text, list){
    try{

        const id = +ctx.callbackQuery.data.split("#")[1]

        list.forEach(item => {
            if (id === item.id) elementPS = item
        })

        if (elementPS) {
            await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
            const scem = {text: text + " Редактирование элемента, скопируйте шаблон внизу и замените то, что нужно, максимальный размер названия - 100 символов, описания - 800, стоимости - 100", keyboard: [Markup.callbackButton('Отменить', 'back')]}
            ctx.webhookReply = false
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            //ctx.webhookReply = true
            stack.push(scem)
            ctx.replyWithHTML(
`🇷🇺 Название:
${elementPS.name[0]}
🇷🇺 Описание:
${elementPS.description[0]}
🇷🇺 Стоимость:
${elementPS.price[0]}
🇺🇸 Name:
${elementPS.name[1]}
🇺🇸 Description:
${elementPS.description[1]}
🇺🇸 Price:
${elementPS.price[1]}
🇷🇺 Изображение:
${elementPS.imageSrc}`)}}catch(e){}
}

async function redPS1(ctx, list) {
    if (elementPS){
        let text = ctx.message.text.trim()
        const element = psParse(text, ctx)
        if (element){
            element.id = elementPS.id
            try{
                console.log(await ctx.replyWithPhoto(element.imageSrc, Extra.load({ parse_mode: "HTML",
                    caption: "Проверка фотографии пройдена"})))
                await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
                const promise = list === listP ? await queryProduct.update(element) : await queryService.update(element)
                const scem = {text: "Элемент обновлен!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}
                ctx.webhookReply = false
                if (promise){   
                    message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
                    //ctx.webhookReply = true
                    list.forEach(item => {
                        if (item.id === element.id){
                            item.name = element.name
                            item.description = element.description
                            item.price = element.price
                            item.imageSrc = element.imageSrc
                        }
                    })
                }else{
                    scem.text = 'Что-то пошло не так'
                    message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
                    //ctx.webhookReply = true
                }   
                stack.pop()     
                stack.pop()
                stack.push(scem)
            }catch(e){
                ctx.reply("☝️Проверка фотографии не пройдена, пожалуйста, проверьте ссылку и отправьте текст по шаблону заново или отмените действие...")
            }
        }
    }
}

async function addPS2(ctx, list) {

    let text = ctx.message.text.trim()
    const element = psParse(text,ctx)
    element.id = list.length > 0 ? list[list.length-1].id + 1 : 0

    if (element) {
        try{
            console.log(await ctx.replyWithPhoto(element.imageSrc, Extra.load({ parse_mode: "HTML",
                caption: "Проверка фотографии пройдена"})))
            await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
            const promise = list === listP ? await queryProduct.create(element) : await queryService.create(element)
            const scem = {text: "Элемент добавлен!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}
            ctx.webhookReply = false
            if (promise){   
                message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
                //ctx.webhookReply = true
                list === listP ? listP.push(element) : listS.push(element)
            }else{
                scem.text = 'Что-то пошло не так'
                message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
                //ctx.webhookReply = true
            }    

            stack.pop()
            stack.push(scem)
        }catch(e){
            console.log(e)
            ctx.reply("☝️Проверка фотографии не пройдена, пожалуйста, проверьте ссылку и отправьте текст по шаблону заново или отмените действие...")
        }
    }

}

function psParse(text, ctx){
    try{
        const element = {}
        element.name = []
        element.description = []
        element.price = []
        
        let index = text.indexOf("🇷🇺 Название:")
        if (index === -1) throw Error()
        text = text.substr(index + 14)
        index = text.indexOf("🇷🇺 Описание:")
        if (index === -1) throw Error()
        element.name[0] = text.substr(0, index - 1).trim().substr(0, 100)

        text = text.substr(index + 14)
        index = text.indexOf("🇷🇺 Стоимость:")
        if (index === -1) throw Error()
        element.description[0] = text.substr(0, index - 1).trim().substr(0, 800)

        text = text.substr(index + 15)
        index = text.indexOf("🇺🇸 Name:")
        if (index === -1) throw Error()
        element.price[0] = text.substr(0, index - 1).trim().substr(0, 100)

        text = text.substr(index + 10)
        index = text.indexOf("🇺🇸 Description:")
        if (index === -1) throw Error()
        element.name[1] = text.substr(0, index - 1).trim().substr(0, 100)

        text = text.substr(index + 17)
        index = text.indexOf("🇺🇸 Price:")
        if (index === -1) throw Error()
        element.description[1] = text.substr(0, index - 1).trim().substr(0, 800)

        text = text.substr(index + 11)
        index = text.indexOf("🇷🇺 Изображение:")
        if (index === -1) throw Error()
        element.price[1] = text.substr(0, index - 1).trim().substr(0, 100)

        text = text.substr(index + 17)
        element.imageSrc = text.trim()
        return element
    }catch(e){
        ctx.reply("☝️Введенные данные не соответствуют шаблону, повторите или отмените действие...")
        return undefined
    }
}
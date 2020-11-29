const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const Scene = require('telegraf/scenes/base')
const { match } = require('telegraf-i18n')
const fileNameAnswers = '../data/answers.json'
const answers =  require(fileNameAnswers)
const fs = require('fs');

const docsFileName = '../data/documents.json'
const queryProduct = require('../util/queryProductLang');
const queryService = require('../util/queryServiceLang');
const { HTML } = require('telegraf/extra')

let docs = require(docsFileName)

let message
let block = false
let stack = []
let listP
let listS

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
        [Markup.callbackButton('➕Добавить услугу', 'add'), Markup.callbackButton('✖️Удалить услугу', 'del')],
        [Markup.callbackButton('Посмотреть', 'show'), Markup.callbackButton('Шаг назад', 'back')]
    ]


const keyboard4 = 
    [
        [Markup.callbackButton('➕Добавить товар', 'add'), Markup.callbackButton('✖️Удалить товар', 'del')],
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

async function emptyList(){
    return []
}

async function empty(){
    return null
}

let step = 0// тут
let timeout
class SceneGenerator{

    admin() {
        const item = new Scene('admin')

        item.enter(async ctx => {
            try{
            loadServices(ctx)
            loadProducts(ctx)
            await ctx.replyWithHTML(`<b>Добро пожаловать в режим администратора!</b> Чтобы вернуться в меню, воспользуйтесь клавиатурой...`, 
            Extra.HTML({parse_mode: 'HTML'})
            .markup(Markup.keyboard(
                [[`📚 Вернуться в меню`]]).resize()))
            block = false
            const scem = {text: `Что вы хотели бы отредактировать?`, keyboard: keyboard}
            ctx.webhookReply = false
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            ctx.webhookReply = true
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
                ctx.webhookReply = true
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
                        ctx.webhookReply = true
                        updateTimeout(ctx)
                    }catch(e){console.log(e)}
                }
            }catch(e){}
        })

        item.action('show', async ctx => {
            try{    
                list(ctx, "Показать")
            }catch(e){console.log(e)}
        })

        item.action('del', async ctx => {
            try{
                list(ctx, "Удалить")
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
                    }if (ctx.update.callback_query.message.text.startsWith("Удалить")){
                        deletePS(ctx, ctx.callbackQuery.data.startsWith('p')? listP : listS)
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
                }
            }catch(e){}
        })

        item.action(/docs:/, async ctx => {
            try{
                if (ctx.update.callback_query.message.text.startsWith("Показать")){
                    const i = +ctx.callbackQuery.data.substr(5)
                    await ctx.telegram.sendDocument(ctx.chat.id, docs[i].file_id)} 
                if (ctx.update.callback_query.message.text.startsWith("Удалить")){
                    deleteReport(ctx)
                }                
            }catch(e){}})

        item.on('text', async ctx => {
            try{
                if (message.text.startsWith("❔ FAQ Добавление")){
                    addFaq2(ctx)
                }else if (message.text.startsWith("🔵 Услуги")){
                    addPS2(ctx, listS)
                }else if (message.text.startsWith('🟢 Товары')){
                    addPS2(ctx, listP)
                }
            }catch(e){}})

        item.on('message', async ctx => {
            console.log('message')
            try{
                if (ctx.update.message.document){console.log('message')
                if (message.text.startsWith("📢 Отчеты Можете отправлять")){
                    try{
                        console.log('message')
                        const tmp = {
                            file_name : ctx.update.message.document.file_name,
                            file_id : ctx.update.message.document.file_id
                        }
                        docs.push(tmp)
                        await fs.writeFileSync("data/documents.json", `${JSON.stringify(docs)}`);
                        await ctx.reply(`Файл ${tmp.file_name} получен`)
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
        await ctx.replyWithHTML('Выход из режима администратора...')
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
        ctx.webhookReply = true
        updateTimeout(ctx)
        stack.push(scem)
    }
}

//////////////////////////

function listFAQ()
{
    let keyboard = []
    answers.values.forEach((item, i) => {
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
    ctx.webhookReply = true
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
    answers.values.forEach(item => {
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
        var id = +ctx.callbackQuery.data.split("#")[1]
        console.log(id)
        answers.values = answers.values.filter(item =>{
            return item.id !== id
        })
        console.log(answers)
        await fs.writeFileSync("data/answers.json", `${JSON.stringify(answers)}`);
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        const scem = {text: "Элемент удален!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}
        ctx.webhookReply = false
        message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
        ctx.webhookReply = true
        stack.pop()
        stack.push(scem)
    }catch(e){}
}

async function addFaq2(ctx){
    try{
        const element = {}
        element.question = []
        element.answer = []
        element.id = answers.values.length > 0 ? answers.values[answers.values.length - 1].id + 1 : 0
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
        answers.values.push(element)
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        await fs.writeFileSync("data/answers.json", `${JSON.stringify(answers)}`);
        const scem = {text: "Элемент добавлен!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}
        ctx.webhookReply = false
        message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
        ctx.webhookReply = true
        stack.pop()
        stack.push(scem)
    }catch(e){ctx.reply("Данные не соотвествуют шаблону, пожалуйста повторите или отмените операцию. Элемент все еще ожидается...")}
}

//////////////////////////

async function addReport(ctx)
{
    try{
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
        const scem = {text: "📢 Отчеты Можете отправлять документы, убедитесь, что название файлов соответсвует шаблону: [Группа]-DD.MM.YY.[Расширение]\nНапример 'IPO-29.08.2020.xlsx'\n Названия групп: Акция, IPO, Советники", keyboard: [Markup.callbackButton('Закончить', 'back')]}
        ctx.webhookReply = false
        message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
        ctx.webhookReply = true
        stack.push(scem)
    }catch(e){}
}

function listReports()
{
    try{
        console.log(docs)
        docs.sort((a, b) => a.file_name < b.file_name ? 1 : -1)
    
        let keyboard = []

        for (let i = 0; i < docs.length; i+=2){
            let mini = []
            let j = i + 1
            mini.push(Markup.callbackButton(`${docs[i].file_name}`, `docs:${i}`))
            while (j < docs.length && j < i + 2){
                mini.push(Markup.callbackButton(`${docs[j].file_name}`, `docs:${j}`))
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
        const i = +ctx.callbackQuery.data.substr(5)
        console.log(i)
        docs = docs.filter((element, index) => index !== i);
        await fs.writeFileSync("data/documents.json", `${JSON.stringify(docs)}`);
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
    }catch(e){}
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

        const promice = list === listP ? queryProduct.remove(element) : queryService.remove(element)

        const scem = {text: "Элемент удален!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}

        promice.then(async () => {
            ctx.webhookReply = false
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            ctx.webhookReply = true
            if (list === listP)
            {
                listP = listP.filter(item => item !== element)
            }else listS = listS.filter(item => item !== element) 
        })
        
        stack.pop()
        stack.push(scem)
    }catch(e){}
}

async function addPS(ctx, text){
    try{
    await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
    const scem = {text: text + " Добавление элемента, скопируйте шаблон внизу и замените * на соотвствующий текст, максимальный размер названия - 100 символов, описания - 800, стоимости - 100", keyboard: [Markup.callbackButton('Отменить', 'back')]}
    ctx.webhookReply = false
    message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
    ctx.webhookReply = true
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
*`)
    }catch(e){}
}

async function addPS2(ctx, list){
try{
    const element = {}
    element.name = []
    element.description = []
    element.price = []

    let text = ctx.message.text.trim()

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

    try{
        console.log(await ctx.replyWithPhoto(element.imageSrc, Extra.load({ parse_mode: "HTML",
            caption: "Проверка фотографии пройдена"})))

        const promice = list === listP ? queryProduct.create(element) : queryService.create(element)
        const scem = {text: "Элемент добавлен!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}

        promice.then(async () => {
            ctx.webhookReply = false
            message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
            ctx.webhookReply = true
            list === listP ? listP.push(element) : listS.push(element)
        })
        stack.pop()
        stack.push(scem)
}catch(e){ctx.reply("Пожалуйста, проверьте ссылку и попробуйте еще раз, все еще принимаю элемент на добавление")}
}catch(e){}
}
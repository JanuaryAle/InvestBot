const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const Scene = require('telegraf/scenes/base')
const { match } = require('telegraf-i18n')
const fileNameAnswers = '../data/answers.json'
const answers =  require(fileNameAnswers)
const fs = require('fs');

const docsFileName = '../data/documents.json'
let docs = require(docsFileName)

let message
let block = false
let stack = []

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
        [Markup.callbackButton('Посмотреть', 'show')],[Markup.callbackButton('🛠 Редактировать', 'red'), Markup.callbackButton('Шаг назад', 'back')]
    ]


const keyboard4 = 
    [
        [Markup.callbackButton('➕Добавить товар', 'add'), Markup.callbackButton('✖️Удалить товар', 'del')],
        [Markup.callbackButton('Посмотреть', 'show')], [Markup.callbackButton('🛠 Редактировать', 'red'), Markup.callbackButton('Шаг назад', 'back')]
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
    "🔵 Услуги": emptyList,
    "🟢 Товары": emptyList
}

dictAdd = {
    "❔ FAQ": addFAQ,
    "📢 Отчеты": addReport,
    "🔵 Услуги": empty,
    "🟢 Товары": empty
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

        item.action('add', async ctx => {
            try{
                if (ctx.update.callback_query.message.message_id === message.message_id){
                    dictAdd[ctx.update.callback_query.message.text](ctx)       
                }
            }catch(e){console.log(e)}
        })

        item.action(/docs:/, async ctx => {
            try{
                if (ctx.update.callback_query.message.text.startsWith("Показать")){
                    const i = +ctx.callbackQuery.data.substr(5)
                    await ctx.telegram.sendDocument(ctx.chat.id, docs[i].file_id)} 
                if (ctx.update.callback_query.message.text.startsWith("Удалить")){
                    deleteReport(ctx)
                }                
            }catch(e){console.log(e)}      
         })

        item.on('text', async ctx => {
            try{
                if (message.text.startsWith("❔ FAQ Добавление")){
                    addFaq2(ctx)
                }
            }catch(e){
                ctx.reply('Шаблон заполнен неверно')}
        })

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
                    }catch(e){console.log(e)}}
            }}catch(e){console.log(e)}
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
        await ctx.replyWithHTML(`<b>🇷🇺 Вопрос:</b> \n${element.question[0]}\n<b>🇷🇺 Ответ:</b> \n${element.answer[0]}\n\n<b>🇺🇸 Question:</b> \n${element.question[1]}\n<b>🇺🇸 Answer:</b> \n${element.answer[1]}\n`)
    }
}

async function deleteQuestion(ctx){
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
}

async function addFaq2(ctx){
    const element = {}
    element.question = []
    element.answer = []
    element.id = answers.values.length > 0 ? answers.values[answers.values.length - 1].id + 1 : 0
    let text = ctx.message.text.trim()

    let index = text.indexOf("🇷🇺 Вопрос:")
    if (index === -1) throw Error()
    text = text.substr(index + 9)
    index = text.indexOf("🇷🇺 Ответ:")
    if (index === -1) throw Error()
    element.question[0] = text.substr(0, index - 1).trim()

    text = text.substr(index + 8)
    index = text.indexOf("🇺🇸 Question:")
    if (index === -1) throw Error()
    element.answer[0] = text.substr(0, index - 1).trim()

    text = text.substr(index + 11)
    index = text.indexOf("🇺🇸 Answer:")
    if (index === -1) throw Error()
    element.question[1] = text.substr(0, index - 1).trim()

    text = text.substr(index + 9)
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
}

//////////////////////////

async function addReport(ctx)
{
    await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
    const scem = {text: "📢 Отчеты Можете отправлять документы, убедитесь, что название файлов соответсвует шаблону: [Группа]-DD.MM.YY.[Расширение]\nНапример 'IPO-29.08.2020.xlsx'\n Названия групп: Акция, IPO, Советники", keyboard: [Markup.callbackButton('Закончить', 'back')]}
    ctx.webhookReply = false
    message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
    ctx.webhookReply = true
    stack.push(scem)
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
    return keyboard}catch(e){console.log(e)}
}

async function deleteReport(ctx){
    const i = +ctx.callbackQuery.data.substr(5)
    console.log(i)
    docs = docs.filter((element, index) => index !== i);
    await fs.writeFileSync("data/documents.json", `${JSON.stringify(docs)}`);
    await ctx.telegram.deleteMessage(message.chat.id, message.message_id)
    const scem = {text: "Элемент удален!", keyboard: [Markup.callbackButton('Продолжить', 'back')]}
    ctx.webhookReply = false
    message = await ctx.replyWithHTML(scem.text, Extra.HTML().markup(Markup.inlineKeyboard(scem.keyboard)))
    ctx.webhookReply = true
    stack.pop()
    stack.push(scem)
}

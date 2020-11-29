const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const bcrypt = require('bcryptjs')
const { match } = require('telegraf-i18n')
const queryProduct = require('../util/queryProductLang');
const queryService = require('../util/queryServiceLang');
const docsFileName = '../data/documents.json'
const docs = require(docsFileName)

const fs = require('fs');

const usersFileName = '../data/userlist.json'
const users = require(usersFileName)
const fileNameAnswers = '../data/answers.json'
const answers =  require(fileNameAnswers)

let messageP
let listP
let indexP

let send

let messageS
let listS
let indexS

module.exports.setCommands = (bot) => {

    bot.start( async ctx => {
        //if (!agreed(ctx)){
            await ctx.scene.enter('start')
        // }else {
        //     await ctx.scene.enter('menu')
        // }
    })

    bot.hears(/🌎|🎩/, async ctx =>       //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        {
            try{
            if (agreed(ctx)>=3){
                const text = ctx.message.text
                const scene = text.charAt(0)+text.charAt(1)
                await ctx.scene.enter(scene)
            }}catch(e){}
        }  
    );

    bot.hears(/🇺🇸|🇷🇺/, async ctx => {
        if (agreed(ctx)>=3){
            langChange(ctx)
        }
    })

    // Отчеты

    bot.action(/Акции|IPO|Советники/, async ctx => {
        try{
            availibleDates(ctx)
        }catch(e){console.log(e)}
    })

     bot.action(/data:/, async ctx => {
        try{
            let flag = false
            docs.forEach(async item => {   
                if( item.file_name.startsWith(ctx.update.callback_query.message.text) && item.file_name.split('-')[1].substr(3,7) === ctx.callbackQuery.data.substr(5)){
                    flag = true
                    
                    await ctx.telegram.sendDocument(ctx.chat.id, item.file_id)                   
                }
            })
            if (!flag) await ctx.reply("Записей не найдено") 
        }catch(e){console.log(e)}      
     })

    bot.hears(/📈/, async ctx => {
        if (agreed(ctx)>=3)
        await ctx.replyWithHTML(`${ctx.i18n.t('scenes.reports.text')}`, Extra.HTML().markup(Markup.inlineKeyboard([
            [Markup.callbackButton(`${ctx.i18n.t('scenes.reports.buttons.shares')}`, 'Акции')],
            [Markup.callbackButton(`IPO`, 'IPO')],
            [Markup.callbackButton(`${ctx.i18n.t('scenes.reports.buttons.adv')}`, "Советники")],
        ]))) 
    })

    // Товары
    
    bot.hears(/👨🏻‍💻/, async ctx =>  {     //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        if (agreed(ctx)>=3){
            try{
                if (messageP){
                    ctx.telegram.deleteMessage(messageP.chat.id, messageP.message_id)
                }

                const promise = queryProduct.getAll(ctx)

                promise.then(async (data) =>{
                    listP = data
                    if (listP.length !== 0){
                        indexP = parseInt((listP.length / 2), 10)
                        prodMessage(ctx)
                    }else {
                        ctx.reply("Извините, пока нет ни одного товара")
                    }                            
                }).catch( err => console.log(err))               
            }catch(e){}
        }}
    );

    bot.action('leftP', async ctx => {
        try{
            if (!listP){
                const promise = queryProduct.getAll(ctx)

                promise.then(async (data) =>{
                    listP = data
                    if (listP.length !== 0){
                        indexP = parseInt((listP.length / 2), 10)
                        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                        while (!prodMessage(ctx) && indexP - 1 >= 0){
                            indexP -= 1
                        }
                    }})
            }else if (indexP > 0 && listP.length !== 0){
                indexP -= 1
                ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                while (!prodMessage(ctx) && indexP - 1 >= 0){
                    indexP -= 1
                }
            }
        }catch(e){}
    })

    bot.action('rightP', async ctx => {
        try{
            if (!listP){
                const promise = queryProduct.getAll(ctx)

                promise.then(async (data) =>{
                    listP = data
                    if (listP.length !== 0){
                        indexP = parseInt((listP.length / 2), 10)
                        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                        while (!prodMessage(ctx) && indexP + 1 < listP.length){
                            indexP += 1
                        }
                    }})
            }else if (indexP < listP.length - 1 && listP.length !== 0){
                indexP += 1
                ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                while (!prodMessage(ctx) && indexP + 1 < listP.length){
                    indexP += 1
                }
            }        
    }catch(e){console.log(e)}})

    // Услуги

    bot.hears(/👩🏻‍🔧/, async ctx =>  {     //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        if (agreed(ctx)>=3){
           loadSer(ctx)
        }}
    );

    bot.action('leftS', async ctx => {
        try{
            if (!listS){
                const promise = queryService.getAll(ctx)

                promise.then(async (data) =>{
                    listS = data
                    if (listS.length !== 0){
                        indexS = parseInt((listS.length / 2), 10)
                        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                        while (!serMessage(ctx) && indexS - 1 >= 0){
                            indexS -= 1
                        }
                    }})
            }else if (indexS > 0 && listS.length !== 0){
                indexS -= 1
                ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                while (!serMessage(ctx) && indexS - 1 >= 0){
                    indexS -= 1
                }
            }
        }catch(e){}
    })

    bot.action('rightS', async ctx => {
        try{
            if (!listS){
                const promise = queryService.getAll(ctx)

                promise.then(async (data) =>{
                    listS = data
                    if (listS.length !== 0){
                        indexS = parseInt((listS.length / 2), 10)
                        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                        while (!serMessage(ctx) && indexS + 1 < listS.length){
                            indexS += 1
                        }
                    }})
            }else if (indexS < listS.length - 1 && listS.length !== 0){
                indexS += 1
                ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                while (!serMessage(ctx) && indexS + 1 < listS.length){
                    indexS += 1
                }
            }
        }catch(e){}})

    // Вопросы
    
    bot.hears(/❓/, async ctx =>       //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        {
            if (agreed(ctx)>=3){
                await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.list')}`, Extra.HTML().markup(Markup.inlineKeyboard(convertKeyboard(answers.values, ctx)))) 
            }
        }  
    );

    bot.action(/ques#/, async ctx => {

        try{
            var id = ctx.callbackQuery.data.split("#")[1]
            let element
            answers.values.forEach(item => {
                if (item.id == id){
                    element = item
                    return
                }
            })
            if (element){
                ctx.webhookReply = false
                await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.ques', {
                    question: element.question[dict[ctx.i18n.locale()]],
                    answer: element.answer[dict[ctx.i18n.locale()]]
                })}`)
                ctx.webhookReply = true
            }
        }catch(e){}
    })

    ///////////////////////////////////////////////////////////////

    bot.help( async ctx => {
        if (agreed(ctx)>=3)
            await ctx.replyWithHTML(`${ctx.i18n.t('help')}`)
    })

    bot.action(/ru|en/, async ctx => {
        try{
            if (agreed(ctx) === 1) {
                await ctx.scene.enter('start')
            }
            if (agreed(ctx)>=3){
                const callbackQuery = ctx.callbackQuery.data
                if (ctx.i18n.locale() !== callbackQuery){
                    ctx.i18n.locale(callbackQuery)
                    users.forEach(user => {
                        if ( ctx.chat.id === user.id){
                            user.lang = callbackQuery
                            return
                        }
                    });
                    await fs.writeFileSync("data/userlist.json", `${JSON.stringify(users)}`);
                    const message = ctx.i18n.t('change')
                    await ctx.replyWithHTML(message)
                    this.menuMessage(ctx)              
            }}
    }catch(e){console.log(e)}
    })

    bot.command('admin', async ctx => {
        try{
            const user = users.filter(user => user.id === ctx.chat.id)[0]
            if (user.adm) ctx.scene.enter('admin')
            else{
                let m = ctx.message.text.split(" ")
                m = m.filter(item => item != "")
                const password = m[1]

                if (bcrypt.compareSync(password, process.env.ADMIN_PASSWORD)){
                    user.adm = true
                    await fs.writeFileSync("data/userlist.json", `${JSON.stringify(users)}`);
                    ctx.scene.enter('admin')
                }else
                    await ctx.reply(`${ctx.i18n.t('admin')}`)
        }
        }catch(e){}
      })

    // bot.action('заказатьP', async ctx => {           
    //     try{
    //         const question = {
    //             type: 
    //             message: ctx.update.message.text,
    //             userId: ctx.update.message.from.id,
    //             userFirstName: ctx.update.message.from.first_name
    //         }
    //         await ctx.telegram.sendMessage(CHAT_ID,
    //             `<b>Вам только что поступил вопрос от пользователя</b>\n<a href="tg://user?id=${question.userId}">${question.userFirstName}</a>: \n${ctx.update.message.text}`,
    //             Extra.HTML())
    //         await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.ask.order')}`, 
    //             Extra.HTML().markup(Markup.keyboard(
    //                 [[`${ctx.i18n.t('scenes.fond.buttons.ask')}`], 
    //                 [`${ctx.i18n.t('scenes.menu.buttons.ser')}`], 
    //                 [`${ctx.i18n.t('retry')}`]]).resize()))
    //         asking = false
    //         clearTimeout(timeout)
    //     }catch(e){}
    // }) 
    // bot.action('заказатьS', async ctx => {           

    // }) 

    bot.hears(/🙋/, async ctx =>{
        if (agreed(ctx)>=3){                
            require('./Fond').askFunction(ctx)
            await ctx.scene.enter('🎩')
        }
    })

    bot.hears(/🔎/, async ctx => {           
        if (agreed(ctx)>=3){
            await ctx.scene.enter('🌎')
        }
    }) 

    bot.hears(/🔙/, async ctx => {  
        if (agreed(ctx)>=3) require("./helper").menuMessage(ctx)   
    }) 

    bot.hears(/📝/, async ctx => {
        if (agreed(ctx)>=3) require('../bot').test(ctx)
    })

    bot.hears(/📚/, async ctx => {
        if (agreed(ctx) >=3) require("./helper").menuMessage(ctx)  
    })

    bot.hears(/✅$/, async ctx => {
        if (agreed(ctx)===2) {
            await ctx.scene.enter('start') 
        }
    })
    bot.hears(/👨‍💼/, async ctx => {
        if (agreed(ctx) >= 3){
            loadSer(ctx)
            menuMessage(ctx)
        }
    })
}

async function langChange(ctx){
    await ctx.reply(`${ctx.i18n.t('selectLang')}`,
        Extra.HTML().markup(Markup.inlineKeyboard(
            [
                Markup.callbackButton('🇺🇸 English', 'en'),
                Markup.callbackButton('🇷🇺 Русский', 'ru')
            ]
        ))
    )
}

const menuMessage = async (ctx) =>
{
    try{
        await ctx.scene.leave()
        await ctx.replyWithHTML(`${ctx.i18n.t('scenes.menu.text')}`, Extra.HTML()
        .markup(Markup.keyboard(
            [
                [`${ctx.i18n.t('scenes.menu.buttons.ser')}`,
                `${ctx.i18n.t('scenes.menu.buttons.prod')}`],
                [`${ctx.i18n.t('scenes.menu.buttons.res')}`,
                `${ctx.i18n.t('scenes.menu.buttons.news')}`],
                [`${ctx.i18n.t('scenes.menu.buttons.qust')}`,
                `${ctx.i18n.t('scenes.menu.buttons.about_us')}`],
                [`${ctx.i18n.t('lang')}`]
            ]).resize()))
        }catch(e){}
}

function agreed(ctx){
    let step = 0
    users.forEach(user => {
        if (ctx.chat.id === user.id){
            try{
            if (ctx.i18n.locale()!==user.lang)
                ctx.i18n.locale(user.lang)
            step = user.step   
            console.log(step)
            }catch(e){}    
        }
    });
    return step
}
module.exports.menuMessage = menuMessage

async function prodMessage(ctx){
    try{
        ctx.webhookReply = false
        const mes = await ctx.replyWithPhoto(listP[indexP].imageSrc,
            Extra.load({
                caption: `${ctx.i18n.t('scenes.ser.caption', {name: listP[indexP].name, price: listP[indexP].price, description: listP[indexP].description})}\n(${indexP + 1}\\${listP.length})` ,
                parse_mode: 'HTML'
            }).markup(Markup.inlineKeyboard([
                [Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.prod.left')}`, 'leftP'), Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.prod.right')}`, 'rightP')],
                [Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.order')}`, 'заказатьP')]
            ])))
        messageP = mes
        ctx.webhookReply = true
            return true
    }catch(e){
        console.log(e)
        ctx.webhookReply = true
        return false       
    }
}

async function serMessage(ctx){
    try{
        ctx.webhookReply = false
        const mes = await ctx.replyWithPhoto(listS[indexS].imageSrc,
            Extra.load({
                caption: `${ctx.i18n.t('scenes.ser.caption', {name: listS[indexS].name, price: listS[indexS].price, description: listS[indexS].description})}\n(${indexS + 1}\\${listS.length})` ,
                parse_mode: 'HTML'
            }).markup(Markup.inlineKeyboard([
                [Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.ser.right')}`, 'leftS'), Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.ser.right')}`, 'rightS')],
                [Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.order')}`, 'заказатьS')]
            ])))
        messageS = mes
        ctx.webhookReply = true
            return true
    }catch(e){
        console.log(e)
        ctx.webhookReply = true
        return false       
    }
}
const dict = {
    "ru" : 0,
    "en" : 1
}

function convertKeyboard(element, ctx){
    var keyboard = []
    element.forEach((item, i) => {
        keyboard.push([Markup.callbackButton(item.question[dict[ctx.i18n.locale()]], `ques#${item.id}`)])
    })
    return keyboard
}

async function loadSer(ctx){
    try{
        if (messageS){
            ctx.telegram.deleteMessage(messageS.chat.id, messageS.message_id)
        }
        
        const promise = queryService.getAll(ctx)

        promise.then(async (data) =>{
            listS = data
            if (listS.length !== 0){
                indexS = parseInt((listS.length / 2), 10)
                serMessage(ctx)
            }else {
                ctx.reply("Извините, пока нет ни одной услуги")
            }                           
        }).catch( err => console.log(err))               
    }catch(e){console.log(e)}
}
async function availibleDates(ctx){

    let set = new Set()
    docs.forEach(async item => {
        if( item.file_name.startsWith(ctx.callbackQuery.data)){
            set.add(item.file_name.split('-')[1].substr(3,7))
        }
    })

    let array = []
    set.forEach(item=> {
        array.push(item)
    })

    let keyboard = []

    for (let i = 0; i < array.length; i+=3){
        let mini = []
        let j = i + 1
        mini.push(Markup.callbackButton(`${array[i]}`, `data:${array[i]}`))
        while (j < array.length && j < i + 3){
            mini.push(Markup.callbackButton(`${array[j]}`, `data:${array[j]}`))
            j++
        } 
        keyboard[keyboard.length] = mini
    }

    if (set.size === 0)
    {
        await ctx.replyWithHTML('Пока записей нет')
    }else{
        await ctx.reply(`${ctx.callbackQuery.data}`, Extra.HTML().markup(Markup.inlineKeyboard(keyboard)))
    }
}

module.exports.loadSer = loadSer
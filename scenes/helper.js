const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const bcrypt = require('bcryptjs')
const queryProduct = require('../util/queryProductLang');
const queryService = require('../util/queryServiceLang');
const queryAnswer = require('../util/queryAnswer');
const queryUser = require('../util/queryUser');
const queryDocs = require('../util/queryDocs');

let docs
let user

let messageP
let listP
let indexP
let answers
let send

let messageS
let listS
let indexS

module.exports.setCommands = (bot) => {

    bot.start( async ctx => {
        ctx.scene.enter('start')
    })

    bot.hears(/🌎|🎩/, async ctx =>       //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        {
            try{
                if (await agreed(ctx)>=3){
                    const text = ctx.message.text
                    const scene = text.charAt(0)+text.charAt(1)
                    ctx.scene.enter(scene)
                }}catch(e){}
        }  
    );

    bot.hears(/🇺🇸|🇷🇺/, async ctx => {
        if (await agreed(ctx)>=3){
            await langChange(ctx)
        }
    })

    // Отчеты

    bot.action(/Акции|IPO|Советники/, async ctx => {
        try{
            if (await agreed(ctx)>=3)
            await availibleDates(ctx)
        }catch(e){console.log(e)}
    })

     bot.action(/data:/, async ctx => {
        try{
            if (await agreed(ctx)>=3){
                let flag = false
                if (!docs) docs = await queryDocs.getAll()

                docs.forEach(async item => {   
                    if( item.file_name.startsWith(ctx.update.callback_query.message.text) && item.file_name.split('-')[1].substr(3,7) === ctx.callbackQuery.data.substr(5)){
                        flag = true                    
                        await ctx.telegram.sendDocument(ctx.chat.id, item.file_id)                   
                    }
                })
                if (!flag) await ctx.reply("Записей не найдено") 
        }}catch(e){console.log(e)}      
     })

    bot.hears(/📈/, async ctx => {
        if (await agreed(ctx)>=3)
        await ctx.replyWithHTML(`👇${ctx.i18n.t('scenes.reports.text')}`, Extra.HTML().markup(Markup.inlineKeyboard([
            [Markup.callbackButton(`${ctx.i18n.t('scenes.reports.buttons.shares')}`, 'Акции')],
            [Markup.callbackButton(`IPO`, 'IPO')],
            [Markup.callbackButton(`${ctx.i18n.t('scenes.reports.buttons.adv')}`, "Советники")],
        ]))) 
    })

    // Товары
    
    bot.hears(/👨🏻‍💻/, async ctx =>  {     //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        if (await agreed(ctx)>=3){
            try{
                if (messageP){
                    ctx.telegram.deleteMessage(messageP.chat.id, messageP.message_id)
                }

                const promise = queryProduct.getAll(ctx)

                promise.then(async (data) =>{
                    listP = data
                    if (listP.length !== 0){
                        indexP = parseInt((listP.length / 2), 10)
                        await prodMessage(ctx)
                    }else {
                        await ctx.reply("Извините, пока нет ни одного товара")
                    }                            
                }).catch( err => console.log(err))               
            }catch(e){console.log(e)}
        }}
    );

    bot.action('leftP', async ctx => {
        try{
            if (await agreed(ctx)>=3)
            if (!listP){
                const promise = queryProduct.getAll(ctx)

                promise.then(async (data) =>{
                    listP = data
                    if (listP.length !== 0){
                        indexP = parseInt((listP.length / 2), 10)
                        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                        while (!await prodMessage(ctx) && indexP - 1 >= 0){
                            indexP -= 1
                        }
                    }})
            }else if (indexP > 0 && listP.length !== 0){
                indexP -= 1
                ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                while (!await prodMessage(ctx) && indexP - 1 >= 0){
                    indexP -= 1
                }
            }
        }catch(e){console.log(e)}
    })

    bot.action('rightP', async ctx => {
        try{
            if (await agreed(ctx)>=3)
            if (!listP){
                const promise = queryProduct.getAll(ctx)

                promise.then(async (data) =>{
                    listP = data
                    if (listP.length !== 0){
                        indexP = parseInt((listP.length / 2), 10)
                        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                        while (!await prodMessage(ctx) && indexP + 1 < listP.length){
                            indexP += 1
                        }
                    }})
            }else if (indexP < listP.length - 1 && listP.length !== 0){
                indexP += 1
                ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                while (!await prodMessage(ctx) && indexP + 1 < listP.length){
                    indexP += 1
                }
            }        
    }catch(e){console.log(e)}})

    // Услуги

    bot.hears(/👩🏻‍🔧/, async ctx =>  {     //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        if (await agreed(ctx)>=3){
            loadSer(ctx)
        }}
    );

    bot.action('leftS', async ctx => {
        try{
            if (await agreed(ctx)>=3)
            if (!listS){
                const promise = queryService.getAll(ctx)

                promise.then(async (data) =>{
                    listS = data
                    if (listS.length !== 0){
                        indexS = parseInt((listS.length / 2), 10)
                        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                        while (! await serMessage(ctx) && indexS - 1 >= 0){
                            indexS -= 1
                        }
                    }})
            }else if (indexS > 0 && listS.length !== 0){
                indexS -= 1
                ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                while (! await serMessage(ctx) && indexS - 1 >= 0){
                    indexS -= 1
                }
            }
        }catch(e){console.log(e)}
    })

    bot.action('rightS', async ctx => {
        try{
            if (await agreed(ctx)>=3)
            if (!listS){
                const promise = queryService.getAll(ctx)

                promise.then(async (data) =>{
                    listS = data
                    if (listS.length !== 0){
                        indexS = parseInt((listS.length / 2), 10)
                        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                        while (!await serMessage(ctx) && indexS + 1 < listS.length){
                            indexS += 1
                        }
                    }})
            }else if (indexS < listS.length - 1 && listS.length !== 0){
                indexS += 1
                ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                while (! await serMessage(ctx) && indexS + 1 < listS.length){
                    indexS += 1
                }
            }
        }catch(e){console.log(e)}})

    // Вопросы
    
    bot.hears(/❓/, async ctx =>       //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        {
            if (await agreed(ctx)>=3){
                answers = await queryAnswer.getAll(ctx)
                await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.list')}`, Extra.HTML().markup(Markup.inlineKeyboard(convertKeyboard(answers, ctx))))
            }
        }  
    );

    bot.action(/ques#/, async ctx => {
        try{
            if (await agreed(ctx)>=3)
                if (!answers) answers = await queryAnswer.getAll(ctx)
                var id = +ctx.callbackQuery.data.split("#")[1]
    
                let element = answers[id]

                if (element) {
                    //ctx.webhookReply = false
                    await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.ques', {
                        question: element.question,
                        answer: element.answer
                    })}`)
                    //ctx.webhookReply = true
                }
        }catch(e){console.log(e)}
    })

    ///////////////////////////////////////////////////////////////

    bot.help( async ctx => {
        if (await agreed(ctx)>=3)
            await ctx.replyWithHTML(`${ctx.i18n.t('help')}`)
    })

    bot.action(/ru|en/, async ctx => {
        try{
            if (await agreed(ctx) <= 1) {
                ctx.scene.enter('start')
            }
            if (await agreed(ctx)>=3){
                const callbackQuery = ctx.callbackQuery.data
                if (ctx.i18n.locale() !== callbackQuery){
                    await queryUser.update(user)
                    ctx.i18n.locale(callbackQuery)
                    const message = ctx.i18n.t('change')
                    ctx.webhookReply = false
                    await ctx.replyWithHTML(message)
                    this.menuMessage(ctx)              
            }}
    }catch(e){console.log(e)}
    })

    bot.action('cont', async ctx => {
        if (await agreed(ctx)>=3)
            loadSer(ctx)
    })

    bot.command('admin', async ctx => {
        
        try{
            user = await queryUser.findOne({id: ctx.chat.id})
            if (await agreed(ctx)>=3){

                if (user.adm) ctx.scene.enter('admin')
                else{
                    let m = ctx.message.text.split(" ")
                    m = m.filter(item => item != "")
                    const password = m[1]

                    if (bcrypt.compareSync(password, process.env.ADMIN_PASSWORD)){
                        user.adm = true
                        await queryUser.update(user)
                        ctx.scene.enter('admin')
                    }else
                        await ctx.reply(`${ctx.i18n.t('admin')}`)
                }
            }}catch(e){console.log(e)}
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
        if (await agreed(ctx)>=3){                
            await require('./Fond').askFunction(ctx)
            await ctx.scene.enter('🎩')
        }
    })

    bot.hears(/🔎/, async ctx => {           
        if (await agreed(ctx)>=3){
            await ctx.scene.enter('🌎')
        }
    }) 

    bot.hears(/🔙/, async ctx => {  
        if (await agreed(ctx)>=3) await menuMessage(ctx)   
    }) 

    bot.hears(/📝/, async ctx => {
        if (await agreed(ctx)>=3) {
            await ctx.scene.leave()
            require('../bot').test(ctx)
        }
    })

    bot.hears(/📚/, async ctx => {
        if (await agreed(ctx) >=3) await menuMessage(ctx)  
    })

    bot.hears(/✅$/, async ctx => {
        if (await agreed(ctx)===2) {
            await ctx.scene.enter('start') 
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
        await ctx.replyWithHTML(`👇${ctx.i18n.t('scenes.menu.text')}`, Extra.HTML()
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
        }catch(e){console.log(e)}
}

async function agreed(ctx){  
    try{
        if (user && user.step >= 3) return 4
        user = await queryUser.findOne({id: ctx.chat.id})

        if (user){
            ctx.i18n.locale(user.lang)
            return user.step
        }else return 0
    }catch(e){}
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
        //ctx.webhookReply = true
            return true
    }catch(e){
        console.log(e)
        //ctx.webhookReply = true
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
        //ctx.webhookReply = true
            return true
    }catch(e){
        console.log(e)
        //ctx.webhookReply = true
        return false       
    }
}
const dict = {
    "ru" : 0,
    "en" : 1
}

function convertKeyboard(element){
    var keyboard = []
    element.forEach((item, i) => {
        keyboard.push([Markup.callbackButton(item.question, `ques#${i}`)])
    })
    return keyboard
}

function loadSer(ctx){
    try{
        if (messageS){
            ctx.telegram.deleteMessage(messageS.chat.id, messageS.message_id)
        }
        
        const promise = queryService.getAll(ctx)

        promise.then(async (data) =>{
            listS = data
            if (listS.length !== 0){
                indexS = parseInt((listS.length / 2), 10)
                await serMessage(ctx)
            }else {
                ctx.reply("Извините, пока нет ни одной услуги")
            }                           
        }).catch( err => console.log(err))               
    }catch(e){console.log(e)}
}
async function availibleDates(ctx){
    try{
        let set = new Set()

        docs = await queryDocs.getAll()

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
    }catch(e){console.log(e)}
}

module.exports.loadSer = loadSer

let timeout_answ

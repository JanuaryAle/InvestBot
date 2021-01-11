const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const bcrypt = require('bcryptjs')
const queryProduct = require('../util/queryProductLang');
const queryService = require('../util/queryServiceLang');
const queryAnswer = require('../util/queryAnswer');
const queryUser = require('../util/queryUser');
const queryDocs = require('../util/queryDocs');

const CHAT_ID = process.env.CALLBACK_CHAT

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

    bot.hears(/🌎/, async ctx =>       //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
    {
        try{
            if (await agreed(ctx)>=3){
                ctx.scene.enter('🌎')
        }}catch(e){}
    })

    bot.hears(/🎩/, async ctx =>       //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
    {
        try{
            if (await agreed(ctx)>=3){
                ctx.scene.enter("🎩")
        }}catch(e){}
    })

    bot.hears(/🇺🇸|🇷🇺/, async ctx => {
        if (await agreed(ctx) >= 3){
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
    
    bot.hears(/👨🏻‍💻/, async ctx => {     //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        if (await agreed(ctx)>=3) {
            await loadProd(ctx)
            if (listP.length !== 0) {
                await prodMessage(ctx, 0)
            }else {
                ctx.reply("Извините, пока нет ни одной услуги")
            }
        }}
    );

    bot.action('leftP', async ctx => {
        try{
            ctx.webhookReply = false
            if (!listP) await loadProd(ctx)
            let text = ctx.update.callback_query.message.caption.split('\n\n')
            let num = +text[text.length - 1].trim().substr(1, text.length - 2).split('\\')[0] - 1
            num--
            if (num < listP.length){
                if (num >= 0) {
                    await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                    await prodMessage(ctx, num)
                }
            }else{
                await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                await prodMessage(ctx, 0)
        }}catch(e){console.log(e)}
    })

    bot.action('rightP', async ctx => {
        try{
            ctx.webhookReply = false
            if (!listP) await loadProd(ctx)
            let text = ctx.update.callback_query.message.caption.split('\n\n')
            let num = +text[text.length - 1].trim().substr(1, text.length - 2).split('\\')[0] - 1
            num++
            if (num < listP.length) {
                await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                await prodMessage(ctx, num)
            }
        }catch(e){console.log(e)}}
    )

    bot.action('заказатьP', async ctx => {           
        try{
            ctx.webhookReply = false
            await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
            if (!listP) {
                await ctx.reply('Пожалуйста, выберете продукт снова')
                await loadProd(ctx)
                await prodMessage(ctx, 0)
            }else {
                let text = ctx.update.callback_query.message.caption.split('\n\n')
                let num = +text[text.length - 1].trim().substr(1, text.length - 2).split('\\')[0] - 1
                await ctx.replyWithHTML(`${ctx.i18n.t('scenes.ser.order.text', {name: listP[num].name})}` ,
                    Extra.HTML({                
                    }).markup(Markup.inlineKeyboard([
                        Markup.callbackButton(`${ctx.i18n.t('scenes.ser.order.buttons.back')}`, 'backP'),
                        Markup.callbackButton(`${ctx.i18n.t('scenes.ser.order.buttons.ok')}`, 'okP')
                    ])))
            }
        }catch(e){}
    })

    bot.action('backP', async ctx => { 
        try {
            ctx.webhookReply = false 
            await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)        
            if (!listP) await loadProd(ctx)
            await prodMessage(ctx, 0)
        }catch(e){console.log(e)}
    }) 

    bot.action('okP', async ctx => {
        try{
            ctx.webhookReply = false
            await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
            const i = ctx.update.callback_query.message.text.indexOf('\n')
            await ctx.telegram.sendMessage(CHAT_ID,
                `<b>Заказ от пользователя </b><a href="tg://user?id=${ctx.update.callback_query.message.chat.id}">${ctx.update.callback_query.message.chat.first_name}</a>:${ctx.update.callback_query.message.text.substr(i)}`,
                Extra.HTML())
            await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.ask.alright')}` ,
            Extra.HTML({                
            }).markup(Markup.inlineKeyboard([
                Markup.callbackButton(`${ctx.i18n.t('scenes.ser.order.buttons.back')}`, 'backP'),
            ])))
        }catch(e){console.log(e)}
    })

    // Услуги

    bot.hears(/👩🏻‍🔧/, async ctx =>  {     //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        if (await agreed(ctx)>=3){
            ctx.webhookReply = false
            await loadSer(ctx)
            if (listS.length !== 0){
                await serMessage(ctx, 0)
            }else {
                ctx.reply("Извините, пока нет ни одной услуги")
            } 
        }}
    );

    bot.action('leftS', async ctx => {
        try{
            ctx.webhookReply = false
            if (!listS) await loadSer(ctx)
            let text = ctx.update.callback_query.message.caption.split('\n\n')
            let num = +text[text.length - 1].trim().substr(1, text.length - 2).split('\\')[0] - 1
            num--
            if (num < listS.length){
                if (num >= 0) {
                    await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                    await serMessage(ctx, num)
                }
            }else{
                await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                await serMessage(ctx, 0)
            }
        }catch(e){console.log(e)}
    })

    bot.action('rightS', async ctx => {
        try{
            ctx.webhookReply = false
            if (!listS) await loadSer(ctx)     
            let text = ctx.update.callback_query.message.caption.split('\n\n')
            let num = +text[text.length - 1].trim().substr(1, text.length - 2).split('\\')[0] - 1
            num++
            if (num < listS.length) {
                await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
                await serMessage(ctx, num)
            }
        }catch(e){console.log(e)}
    })

    bot.action('заказатьS', async ctx => {           
        try{
            ctx.webhookReply = false
            await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
            if (!listS) {
                await ctx.reply('Пожалуйста, выберете услугу снова')
                await loadSer(ctx)
                await serMessage(ctx, 0)
            }else {
                let text = ctx.update.callback_query.message.caption.split('\n\n')
                let num = +text[text.length - 1].trim().substr(1, text.length - 2).split('\\')[0] - 1
                await ctx.replyWithHTML(`${ctx.i18n.t('scenes.ser.order.text', {name: listS[num].name})}` ,
                    Extra.HTML({                
                    }).markup(Markup.inlineKeyboard([
                        Markup.callbackButton(`${ctx.i18n.t('scenes.ser.order.buttons.back')}`, 'backS'),
                        Markup.callbackButton(`${ctx.i18n.t('scenes.ser.order.buttons.ok')}`, 'okS')
                    ])))
            }
        }catch(e){}
    })

    bot.action('backS', async ctx => {  
        try{ 
            ctx.webhookReply = false
            await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)        
            if (!listS) await loadSer(ctx)
            await serMessage(ctx, 0)
        }catch(e){console.log(e)}
    }) 

    bot.action('okS', async ctx => {
        try{
            ctx.webhookReply = false
            await ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
            const i = ctx.update.callback_query.message.text.indexOf('\n')
            await ctx.telegram.sendMessage(CHAT_ID,
                `<b>Заказ от пользователя </b><a href="tg://user?id=${ctx.update.callback_query.message.chat.id}">${ctx.update.callback_query.message.chat.first_name}</a>:${ctx.update.callback_query.message.text.substr(i)}`,
                Extra.HTML())
            await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.ask.alright')}` ,
            Extra.HTML({                
            }).markup(Markup.inlineKeyboard([
                Markup.callbackButton(`${ctx.i18n.t('scenes.ser.order.buttons.back')}`, 'backS'),
            ])))
        }catch(e){console.log(e)}
    })

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

    bot.action('test', async ctx => {
        if (await agreed(ctx)>=3) {
            await ctx.scene.leave()
            require('../bot').test(ctx)
        }
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

async function prodMessage(ctx, i){
    try{
        i
        ctx.webhookReply = false
        await ctx.replyWithPhoto(listP[i].imageSrc,
            Extra.load({
                caption: `${listP[i].name} ${listP[i].description == "" ? "\n" + listP[i].description : ""}\n(${i + 1}\\${listP.length})` ,
                parse_mode: 'HTML'
            }).markup(Markup.inlineKeyboard([
                [Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.prod.left')}`, 'leftP'), Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.prod.right')}`, 'rightP')],
                [Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.order')}`, 'заказатьP')]
            ])))
        return true
    }catch(e){
        return false       
    }
}

async function serMessage(ctx, i){
    try{
        ctx.webhookReply = false
        await ctx.replyWithPhoto(listS[i].imageSrc,
            Extra.load({
                caption: `${ctx.i18n.t('scenes.ser.caption', {name: listS[i].name, description: listS[i].description})}\n(${i + 1}\\${listS.length})` ,
                parse_mode: 'HTML'
            }).markup(Markup.inlineKeyboard([
                [Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.ser.right')}`, 'leftS'), Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.ser.right')}`, 'rightS')],
                [Markup.callbackButton(`${ctx.i18n.t('scenes.ser.buttons.order')}`, 'заказатьS')]
            ])))    
        return true
    }catch(e){
        console.log(e)
        return false       
    }
}

const dict = {
    "ru" : 0,
    "en" : 1
}

function convertKeyboard(element) {
    var keyboard = []
    element.forEach((item, i) => {
        keyboard.push([Markup.callbackButton(item.question, `ques#${i}`)])
    })
    return keyboard
}

async function loadSer(ctx, i) {
    try{
        listS = await queryService.getAll(ctx)                                      
    }catch(e){console.log(e)}
}

async function loadProd(ctx, i){
    try{
        listP = await queryProduct.getAll(ctx)                               
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

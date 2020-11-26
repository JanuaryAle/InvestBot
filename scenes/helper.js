const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const bcrypt = require('bcryptjs')
const { match } = require('telegraf-i18n')
const queryProduct = require('../util/queryProduct');
const queryService = require('../util/queryService');

const fs = require('fs')
const usersFileName = '../data/userlist.json'
const users = require(usersFileName)

let messageP
let listP
let indexP

let messageS
let listS
let indexS

let flag

module.exports.setCommands = (bot) => {

    bot.hears(/🌎|🎩/, async ctx =>       //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        {
            if (isUserInBd(ctx)){
                const text = ctx.message.text
                const scene = text.charAt(0)+text.charAt(1)
                await ctx.scene.enter(scene)
            }
        }  
    );

    // Товары
    
    bot.hears(/🛍/, async ctx =>  {     //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        if (isUserInBd(ctx)){
            try{
                if (messageP){
                    ctx.telegram.deleteMessage(messageP.chat.id, messageP.message_id)
                }

                const promise = queryProduct.getAll()

                promise.then(async (data) =>{
                    listP = data
                    if (listP.length !== 0){
                        indexP = parseInt((listP.length / 2), 10)
                        prodMessage(ctx)
                    }else {
                        ctx.reply("Извините, пока нет ни одного товара")
                    }                            
                }).catch( err => console.log(err))               
            }catch(e){console.log(e)}
        }}
    );

    bot.action('leftP', async ctx => {
        try{
            if (!listP){
                const promise = queryProduct.getAll()

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
                const promise = queryProduct.getAll()

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
        if (isUserInBd(ctx)){
            try{
                if (messageS){
                    ctx.telegram.deleteMessage(messageS.chat.id, messageS.message_id)
                }
                
                const promise = queryService.getAll()

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
        }}
    );

    bot.action('leftS', async ctx => {
        try{
            if (!listS){
                const promise = queryService.getAll()

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
                const promise = queryService.getAll()

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

    bot.help( async ctx => {
        if (isUserInBd(ctx))
            await ctx.replyWithHTML(`${ctx.i18n.t('help')}`)
    })

    bot.action(/^(?:(ru|en))$/, async ctx => {
        try{
            if (isUserInBd(ctx)){
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
    }catch(e){}
    })

    bot.command('admin', async ctx => {
        try{
            let m = ctx.message.text.split(" ")
            m = m.filter(item => item != "")
            const password = m[1]

            // if (bcrypt.compareSync(password, process.env.ADMIN_PASSWORD))
            //   //   ctx.scene.enter('admin')
            // else
            await ctx.reply(`${ctx.i18n.t('admin')}`)
        }catch(e){}
      })
    
    bot.hears(match('lang'), async ctx => {
        if (isUserInBd(ctx))
            langChange(ctx)
    })

    bot.hears(/🙋/, async ctx =>{
        if (isUserInBd(ctx)){                
            require('./Fond').askFunction(ctx)
            await ctx.scene.enter('🎩')
        }
    })

    bot.hears(/🔎/, async ctx => {           
        if (isUserInBd(ctx)){
            await ctx.scene.enter('🌎')
        }
    }) 

    bot.hears(/🔙/, async ctx => {  
        if (isUserInBd(ctx)) require("./helper").menuMessage(ctx)   
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

module.exports.menuMessage = async (ctx) =>
{
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
}

function isUserInBd(ctx){
    if (flag) return flag

    users.forEach(user => {
        if ( ctx.chat.id === user.id){
            flag = true
            try{
                ctx.i18n.locale(user.lang)
            }catch(e){}
            return
        }
    });

    return flag
}

async function prodMessage(ctx){
    try{
        ctx.webhookReply = false
        const mes = await ctx.replyWithPhoto(listP[indexP].imageSrc,
            Extra.load({
                caption: `${ctx.i18n.t('scenes.ser.caption', {name: listP[indexP].name, price: listP[indexP].price, description: listP[indexP].description})}\n(${indexP + 1}\\${listP.length})` ,
                parse_mode: 'HTML'
            }).markup(Markup.inlineKeyboard([
                [Markup.callbackButton('Предыдущий товар', 'leftP'), Markup.callbackButton('Следующий товар', 'rightP')],
                [Markup.callbackButton('Заказать', 'заказатьP')]
            ])))
        messageP = mes
        ctx.webhookReply = true
            return true
    }catch(e){
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
                [Markup.callbackButton('Предыдущая услуга', 'leftS'), Markup.callbackButton('Следующая услуга', 'rightS')],
                [Markup.callbackButton('Заказать', 'заказатьS')]
            ])))
        messageS = mes
        ctx.webhookReply = true
            return true
    }catch(e){
        ctx.webhookReply = true
        return false       
    }
}

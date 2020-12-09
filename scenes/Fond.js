const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const Scene = require('telegraf/scenes/base')
const { match } = require('telegraf-i18n')
require('dotenv').config()


let asking = false
let askMessage
let timeout
let startMessage
let restart = false

const CHAT_ID = process.env.CALLBACK_CHAT

class FondSceneGenerator{

    GetFondStage() {
        const item = new Scene('🎩')

        item.enter(async ctx => {
            if (!restart)
                startPoint(ctx)
        })
       
        item.hears(match('scenes.fond.buttons.ask'), async ctx =>{
            askFunction(ctx)
        })

        item.hears(match('retry'), async ctx => {
            require('./helper').menuMessage(ctx)
        })

        item.hears(match('abort.button'), async ctx => {
            try{
                await ctx.telegram.deleteMessage(askMessage.chat.id, askMessage.message_id)
                await ctx.replyWithHTML(`👇${ctx.i18n.t('abort.text')}`,
                     Extra.HTML().markup(Markup.keyboard(
                        [[`${ctx.i18n.t('scenes.fond.buttons.ask')}`],
                        [`${ctx.i18n.t('scenes.menu.buttons.ser')}`], 
                        [`${ctx.i18n.t('retry')}`]]).resize()))
            }catch(e){console.log(e)}
            clearTimeout(timeout)
            asking = false
        })

        require('./helper').setCommands(item)

        item.on('text', async ctx => {
            if (asking){
                try{
                    const question = {
                        chat_id: ctx.update.message.chat.id,
                        message_id: ctx.update.message.message_id,
                        username: ctx.update.message.chat.username,
                        message: ctx.update.message.text,
                        userId: ctx.update.message.from.id,
                        userFirstName: ctx.update.message.from.first_name
                    }
                    await ctx.telegram.sendMessage(CHAT_ID,
                        `<b>Вам только что поступил вопрос от пользователя</b>\n<a href="tg://user?id=${question.userId}">${question.userFirstName}</a>: \n${ctx.update.message.text}`,
                        Extra.HTML())
                    await ctx.replyWithHTML(`👇${ctx.i18n.t('scenes.fond.ask.ok')}`, 
                        Extra.HTML().markup(Markup.keyboard(
                            [[`${ctx.i18n.t('scenes.fond.buttons.ask')}`], 
                            [`${ctx.i18n.t('scenes.menu.buttons.ser')}`], 
                            [`${ctx.i18n.t('retry')}`]]).resize()))
                    asking = false
                    clearTimeout(timeout)
                }catch(e){}
            }
        })
        
        item.leave(async ctx => {
            if (askMessage){
            try{
                ctx.telegram.deleteMessage(askMessage.chat.id, askMessage.message_id)
            }catch(e){console.log(e)}
            clearTimeout(timeout)
            asking = false
            restart = false
        }})

        return item
    }
}

module.exports = new FondSceneGenerator().GetFondStage()

async function startPoint(ctx){
    try{
    ctx.webhookReply = false
        startMessage = await ctx.replyWithHTML(`👇${ctx.i18n.t('scenes.fond.about_us')}`,
        Extra.HTML({parse_mode: 'HTML'})
            .markup(Markup.keyboard(
                [[`${ctx.i18n.t('scenes.fond.buttons.ask')}`], 
                [`${ctx.i18n.t('scenes.menu.buttons.ser')}`], 
                [`${ctx.i18n.t('retry')}`]]).resize()))  
    //ctx.webhookReply = true    
    }catch(e){}}

async function askFunction(ctx){
    try{
        if (!startMessage) restart = true
        asking = true
        ctx.webhookReply = false
        askMessage = await ctx.reply(`👇${ctx.i18n.t('scenes.fond.ask.text')}`,  Extra.HTML({parse_mode: 'HTML'}).markup(Markup.keyboard(
            [[`${ctx.i18n.t('abort.button')}`], 
            [`${ctx.i18n.t('retry')}`]]).resize()))
        //ctx.webhookReply = true
    
        timeout = setTimeout(async () => {      
            console.log(ctx.telegram.deleteMessage(askMessage.chat.id, askMessage.message_id))             
            await ctx.replyWithHTML(`👇${ctx.i18n.t('scenes.fond.ask.end')}`, 
            Extra.HTML({parse_mode: 'HTML'})
            .markup(Markup.keyboard(
                [[`${ctx.i18n.t('scenes.fond.buttons.ask')}`], 
                [`${ctx.i18n.t('retry')}`]]).resize())) 
            asking = false
        }, 120000)
    }catch(e){console.log(e)}
}

module.exports.askFunction = askFunction
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const WizardScene = require('telegraf/scenes/wizard')
const bot = require('../bot')
require('dotenv').config()

const fileNameAnswers = '../data/answers.json'
const answers =  require(fileNameAnswers)
const fileName = '../data/info.json'
const file = require(fileName)

let flag = false
let callbackQuery
let stack = []
let timeout

const CHAT_ID = process.env.CALLBACK_CHAT

class FondSceneGenerator{

    GetFondStage() {
        const item = new WizardScene('🏢', 
        async (ctx) => {
            flag = false
            startPoint(ctx)
        }, async ctx => {
            try{
                if (typeof ctx.update.message !== "undefined" && callbackQuery === "ask"){
                    try{
                        const question = {
                            chat_id: ctx.update.message.chat.id,
                            message_id: ctx.update.message.message_id,
                            username: ctx.update.message.chat.username,
                            message: ctx.update.message.text,
                            userId: ctx.update.message.from.id,
                            userFirstName: ctx.update.message.from.first_name
                        }
                        if (ctx.update.message.text){
                            await ctx.telegram.sendMessage(CHAT_ID,
                                `<b>Вам только что поступил вопрос от пользователя</b>\n<a href="tg://user?id=${question.userId}">${question.userFirstName}</a>: \n${ctx.update.message.text}`,
                                Extra.HTML())
                            clearStack(ctx)
                            await ctx.reply(`${ctx.i18n.t('scenes.fond.ask.ok')}`)
                            callbackQuery = ''
                            clearTimeout(timeout)
                        }else{
                            await ctx.reply(`${ctx.i18n.t('scenes.fond.ask.err')}`)
                        }
        
                    }catch(e){console.log(e)}
                }else if (typeof ctx.callbackQuery !== "undefined"){
                
                    callbackQuery = ctx.callbackQuery.data
                    if (callbackQuery === 'more'){
                        ctx.webhookReply = false
                        clearStack(ctx)
                        flag = false
                        try{             
                            stack.push(await ctx.replyWithPhoto(file.fondInfo.imageSrc, Extra.load({
                                parse_mode: 'HTML',
                                caption: `<b>${file.fondInfo.name}</b>\n\n${file.fondInfo.description}`
                                +`\n\n<b>${file.fondInfo.contact}</b>`
                            }).markup(Markup.inlineKeyboard([Markup.callbackButton(`${ctx.i18n.t('retry')}`, 'отмена')]))))                          
                        }catch(e){
                            stack.push(await ctx.replyWithHTML(`<b>${file.fondInfo.name}</b>\n\n${file.fondInfo.description}`
                            +`\n\n<b>${file.fondInfo.contact}</b>`, Extra.load({
                                parse_mode: 'HTML'
                            }).markup(Markup.inlineKeyboard([Markup.callbackButton(`${ctx.i18n.t('retry')}`, 'отмена')]))))
                        } 
                        ctx.webhookReply = true
                    }else if (callbackQuery === "ask"){
                            ctx.webhookReply = false
                            clearStack(ctx)
                            flag = false
                            let a
                            stack.push(a = await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.ask.text')}`, Extra.HTML().markup(Markup.inlineKeyboard([[Markup.callbackButton(`${ctx.i18n.t('retry')}`, 'отмена')]]))))  
                            ctx.webhookReply = true
                            ctx.webhookReply = false
                            timeout = setTimeout(async () => {

                                if (typeof stack[stack.length - 1] !== "undefined" && stack[stack.length - 1].message_id === a.message_id)
                                   { await ctx.telegram.editMessageText(a.chat.id, a.message_id, undefined, `${ctx.i18n.t('scenes.fond.ask.end')}`)
                                callbackQuery = ''}
                            }, 120000)
                            ctx.webhookReply = true
                    }
                    else if (callbackQuery === "ques"){
                        ctx.webhookReply = false
                        clearStack(ctx)
                        flag = false
                        stack.push(await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.list')}`, Extra.HTML().markup(Markup.inlineKeyboard(convertKeyboard(answers.values, ctx)))))   
                        ctx.webhookReply = true
                    }else{
                        try {
                            var index = parseInt(callbackQuery)
                            if (index != NaN){
                                ctx.webhookReply = false
                                flag = false
                                const element = answers.values[+(ctx.callbackQuery.data)]
                                stack.push(await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.ques', {
                                    question: element.question,
                                    answer: element.answer
                                })}`))
                                ctx.webhookReply = true
                            }
                        }catch(e){} 
                    }
                }}catch(e){console.log(e)}
            })

        require('../util/globalCommands')(item)

        item.action('отмена', ctx => {
            clearStack(ctx)
            callbackQuery =''
        })

        item.hears(/👩🏻‍🎓|📈|🧞/, async ctx =>
            {
                const text = ctx.message.text
                const scene = text.charAt(0)+text.charAt(1)
                await ctx.scene.enter(scene)
            }  
        );

        item.leave(async ctx => {
            clearStack(ctx)
            callbackQuery =''
        })

        return item
    }
}

module.exports = new FondSceneGenerator().GetFondStage()

  function convertKeyboard(element, ctx){
    var keyboard = []
    element.forEach((item, i) => {
        keyboard.push([Markup.callbackButton(item.question, `${i}`)])
    })
    keyboard.push([Markup.callbackButton(`${ctx.i18n.t('retry')}`, 'отмена')])
    return keyboard
}

async function startPoint(ctx){
    flag = true
    callbackQuery = ''
    await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.text', { name: file.fondInfo.name})}`,
    Extra.HTML()
    .markup(Markup.inlineKeyboard([
        [Markup.callbackButton(`${ctx.i18n.t('scenes.fond.buttons.more')}`, `more`)],
        [Markup.callbackButton(`${ctx.i18n.t('scenes.fond.buttons.ques')}`, 'ques')],
        [Markup.callbackButton(`${ctx.i18n.t('scenes.fond.buttons.ask')}`, 'ask')]
        ])))
        return ctx.wizard.selectStep(1)
}

function clearStack(ctx){
    
    stack.forEach((item, i) => {
            if (item.message_id){
                ctx.telegram.deleteMessage(item.chat.id, item.message_id)
            }
    })
    stack = []
}
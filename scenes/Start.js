const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const WizardScene = require('telegraf/scenes/wizard')
const file = require('../data/info.json')
const queryUser = require('../util/queryUser');

let user = {}

class SceneGenerator{

    getStartScene() {
        const item = new WizardScene('start', 
        async (ctx) => {
            try{
                ctx.webhookReply = false
                await selectStep(ctx)
                console.log("selectStepExit: " + user)
                switch(user.step){
                    case 2: {
                        if (typeof ctx.message !== "undefined" && ctx.message.text === "/start") {
                            await step1(ctx)
                            return ctx.wizard.selectStep(2)
                        }else{
                            await step2(ctx)
                            return ctx.wizard.selectStep(3)
                        }
                    }
                    case 3: {
                        if (typeof ctx.message !== "undefined" && ctx.message.text === "/start") await step2(ctx)
                        return ctx.wizard.selectStep(3)
                    }
                    case 4: {
                        if (typeof ctx.message !== "undefined" && ctx.message.text === "/start") await step4(ctx)
                        break
                    }
                    case 1: {
                        if (typeof ctx.message !== "undefined" && ctx.message.text === "/start") {
                            await step0(ctx)
                            return ctx.wizard.next()
                        }else if (ctx.callbackQuery){
                            const callbackQuery = ctx.callbackQuery.data
                            ctx.i18n.locale(callbackQuery);
                            user.lang = callbackQuery
                            await step1(ctx)
                            return ctx.wizard.selectStep(2)
                        }
                    } 
                    default: {
                        await step0(ctx)
                        return ctx.wizard.next()
                    }
            }}catch(e){console.log(e)}
            
        }, async ctx => {
            try{
                if (typeof ctx.message !== "undefined" && typeof ctx.message.text !== "undefined"){
                    if (ctx.message.text === "/start"){
                        ctx.scene.enter('start')
                    }
                }}catch(e){}
            try{
                const callbackQuery = ctx.callbackQuery.data
                ctx.i18n.locale(callbackQuery);
                user.lang = callbackQuery
                await queryUser.update(user)
                await step1(ctx)
                return ctx.wizard.next()
            }catch(e){console.log(e)}
        }, async ctx => {
            try{
                if (typeof ctx.message !== "undefined" && typeof ctx.message.text !== "undefined"){
                    if (ctx.message.text === "/start"){
                        ctx.scene.enter('start')
                    }
                }}catch(e){console.log(e)}
            try{
                if (ctx.message.text == `${ctx.i18n.t('start.acception.button')}`){
                    await step2(ctx)
                    return ctx.wizard.next()
                }
            }catch(e){console.log(e)}
        }, async ctx => {
            try{
                if (typeof ctx.message !== "undefined" && typeof ctx.message.text !== "undefined"){
                    if (ctx.message.text === "/start"){
                        ctx.scene.enter('start')
                    }
                }}catch(e){console.log(e)}
            try{
                if (ctx.message.text == `${ctx.i18n.t('start.great.buttons.ready')}`){ 
                    await step3(ctx)
                }else if (ctx.message.text == `${ctx.i18n.t('start.great.buttons.know')}`){
                    await step4(ctx)   
                }
            }catch(e){console.log(e)}
        })
        return item
    }
}

module.exports = new SceneGenerator().getStartScene()

async function selectStep(ctx){
    try{
        ctx.webhookReply = false
        user = await queryUser.findOne({id: ctx.chat.id})
        console.log("selectStep: " + user)
        if (user){
            ctx.i18n.locale(user.lang)
            return user.step
        }else{
            user = await queryUser.create(ctx)
            return 0
        }
    }catch(e){console.log(e)}
}

async function step0(ctx){
    await ctx.reply(`${ctx.i18n.t('selectLang')}`,
    Extra.HTML().markup(Markup.inlineKeyboard(
        [
            Markup.callbackButton('🇺🇸 English', 'en'),
            Markup.callbackButton('🇷🇺 Русский', 'ru')
        ]
    )))
    user.step = 1
    await queryUser.update(user)
}
async function step1(ctx){
    ctx.webhookReply = false
    await ctx.replyWithHTML(ctx.i18n.t('change'))
    await ctx.replyWithHTML(ctx.i18n.t('start.hello', {
        userId: ctx.from.id,
        userFirstName: ctx.from.first_name,
        name: file.fondInfo.name
    }))
    await ctx.replyWithHTML(`👇${ctx.i18n.t('start.acception.text')}`, Extra.HTML()
        .markup(Markup.keyboard([`${ctx.i18n.t('start.acception.button')}` ]).resize()))
    user.step = 2
    await queryUser.update(user)
}
async function step2(ctx){
    await ctx.replyWithHTML(`👇${ctx.i18n.t('start.great.text')}`,
        Extra.HTML()
        .markup(Markup.keyboard(
        [
            `${ctx.i18n.t('start.great.buttons.ready')}`,
            `${ctx.i18n.t('start.great.buttons.know')}`                  
        ]).resize()))
    user.step = 3
    await queryUser.update(user)
}
async function step3(ctx){
    user.step = 4
    await queryUser.update(user)    
    require("../bot").test(ctx)
    await ctx.scene.leave()
}
async function step4(ctx){
    user.step = 4
    await queryUser.update(user)
    
    await ctx.replyWithHTML(`👇${ctx.i18n.t('scenes.fond.about_us')}`,
        Extra.HTML()
        .markup(Markup.inlineKeyboard(
        [
            Markup.callbackButton(`${ctx.i18n.t('start.great.buttons.continue')}`, 'cont')         
        ])))
    require("./helper").menuMessage(ctx)
}
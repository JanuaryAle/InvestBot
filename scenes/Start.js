const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const WizardScene = require('telegraf/scenes/wizard')
const file = require('../data/info.json')

const fs = require('fs')

const usersFileName = '../data/userlist.json'
const users = require(usersFileName)
let step
let user

class SceneGenerator{

    getStartScene() {
        const item = new WizardScene('start', 
        async (ctx) => {
            try{
            selectStep(ctx)
            console.log(step)
            switch(step){
                case 2: {
                    if (typeof ctx.message !== "undefined" && ctx.message.text === "/start") {
                        step1(ctx)
                        return await ctx.wizard.selectStep(2)
                    }else{
                        step2(ctx)
                        return await ctx.wizard.selectStep(3)
                    }
                }
                case 3: {
                    if (typeof ctx.message !== "undefined" && ctx.message.text === "/start") step2(ctx)
                    return await ctx.wizard.selectStep(3)
                }
                case 4: {
                    if (typeof ctx.message !== "undefined" && ctx.message.text === "/start") step4(ctx)
                    break
                }
                case 1: {
                    if (typeof ctx.message !== "undefined" && ctx.message.text === "/start") {
                        step0(ctx)
                        return await ctx.wizard.next()
                    }else if (ctx.callbackQuery){
                        const callbackQuery = ctx.callbackQuery.data
                        ctx.i18n.locale(callbackQuery);
                        user.lang = callbackQuery
                        step1(ctx)
                        return await ctx.wizard.selectStep(2)
                    }
                } 
                default: {
                    step0(ctx)
                    return await ctx.wizard.next()
                }
            }}catch(e){}
            
        }, async ctx => {
            try{
                if (typeof ctx.message !== "undefined" && typeof ctx.message.text !== "undefined"){
                    if (ctx.message.text === "/start"){
                        await ctx.scene.enter('start')
                    }
                }}catch(e){}
            try{
                const callbackQuery = ctx.callbackQuery.data
                ctx.i18n.locale(callbackQuery);
                user.lang = callbackQuery
                step1(ctx)
                return ctx.wizard.next()
            }catch(e){}
        }, async ctx => {
            try{
                if (typeof ctx.message !== "undefined" && typeof ctx.message.text !== "undefined"){
                    if (ctx.message.text === "/start"){
                        await ctx.scene.enter('start')
                    }
                }}catch(e){}
            try{
                if (ctx.message.text == `${ctx.i18n.t('start.acception.button')}`){
                    step2(ctx)
                    return ctx.wizard.next()
                }
            }catch(e){console.log(e)}
        }, async ctx => {
            try{
                if (typeof ctx.message !== "undefined" && typeof ctx.message.text !== "undefined"){
                    if (ctx.message.text === "/start"){
                        await ctx.scene.enter('start')
                    }
                }}catch(e){}
            try{
                if (ctx.message.text == `${ctx.i18n.t('start.great.buttons.ready')}`){ 
                    step3(ctx)
                }else if (ctx.message.text == `${ctx.i18n.t('start.great.buttons.know')}`){
                    step4(ctx)  
                    return ctx.wizard.next()            
                }
            }catch(e){}
        }, async ctx => {
            if (ctx.update.callback_query.message.text.startsWith("👨‍💼")){
                require("./helper").loadSer(ctx)
                require("./helper").menuMessage(ctx)
            }
        })

        item.hears(/👨‍💼/, async ctx => {
            if (step >= 3){
                require("./helper").loadSer(ctx)
                require("./helper").menuMessage(ctx)
            }
        })
        return item
    }
}

module.exports = new SceneGenerator().getStartScene()

async function selectStep(ctx){
    try{
        users.forEach(item => {
            if (item.id === ctx.chat.id){
                user = item
            }
        })
        if (user){
            step = user.step
        }else{
            step = 0
            user = {
                id: ctx.chat.id,
                step: 0,
                lang: "ru"
            }
            users.push(user)
            await fs.writeFileSync("data/userlist.json", `${JSON.stringify(users)}`);
        }
    }catch(e){}
}

async function step0(ctx){
    ctx.webhookReply = false
    await ctx.reply(`${ctx.i18n.t('selectLang')}`,
    Extra.HTML().markup(Markup.inlineKeyboard(
        [
            Markup.callbackButton('🇺🇸 English', 'en'),
            Markup.callbackButton('🇷🇺 Русский', 'ru')
        ]
    )))
    ctx.webhookReply = true
    user.step = 1
    await fs.writeFileSync("data/userlist.json", `${JSON.stringify(users)}`);
}
async function step1(ctx){

    await ctx.replyWithHTML(ctx.i18n.t('change'))
    await ctx.replyWithHTML(ctx.i18n.t('start.hello', {
        userId: ctx.from.id,
        userFirstName: ctx.from.first_name,
        name: file.fondInfo.name
    }))
    await ctx.replyWithHTML(ctx.i18n.t('start.acception.text'), Extra.HTML()
        .markup(Markup.keyboard([`${ctx.i18n.t('start.acception.button')}` ]).resize()))
    user.step = 2
    await fs.writeFileSync("data/userlist.json", `${JSON.stringify(users)}`);
}
async function step2(ctx){
    await ctx.replyWithHTML(`${ctx.i18n.t('start.great.text')}`,
        Extra.HTML()
        .markup(Markup.keyboard(
        [
            `${ctx.i18n.t('start.great.buttons.ready')}`,
            `${ctx.i18n.t('start.great.buttons.know')}`                  
        ]).resize()))
    user.step = 3
    await fs.writeFileSync("data/userlist.json", `${JSON.stringify(users)}`);   
}
async function step3(ctx){
    user.step = 4
    await fs.writeFileSync("data/userlist.json", `${JSON.stringify(users)}`);       
    require("../bot").test(ctx)
    await ctx.scene.leave()
}
async function step4(ctx){
    user.step = 4
    await fs.writeFileSync("data/userlist.json", `${JSON.stringify(users)}`);
    
    await ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.about_us')}`,
        Extra.HTML()
        .markup(Markup.keyboard(
        [
            `${ctx.i18n.t('start.great.buttons.continue')}`,                 
        ]).resize()))  
}
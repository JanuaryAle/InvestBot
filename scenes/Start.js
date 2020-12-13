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
                await findUser(ctx)
                return await selectStep(ctx)
            }catch(e){console.log(e)}      
        }, async ctx => {
            try{
                if (typeof ctx.message !== "undefined" && typeof ctx.message.text !== "undefined"){
                    if (ctx.message.text === "/start"){
                        return await selectStep(ctx)
                    }
                }else if (typeof ctx.callbackQuery !== "undefined"){
                    const callbackQuery = ctx.callbackQuery.data
                    ctx.i18n.locale(callbackQuery);
                    user.lang = callbackQuery
                    user.step = 2
                    await queryUser.update(user)
                    return await selectStep(ctx)
                }
            }catch(e){console.log(e)}          
        }, async ctx => {
            try{
                if (typeof ctx.message !== "undefined" && typeof ctx.message.text !== "undefined"){
                    if (ctx.message.text === "/start"){
                        return await selectStep(ctx)
                    }else if (typeof ctx.message !== "undefined" && ctx.message.text == `${ctx.i18n.t('start.acception.button')}`){
                        user.step = 3
                        await queryUser.update(user)
                        return await selectStep(ctx)
                    }
                }
            }catch(e){console.log(e)}          
        }, async ctx => {
            try{
                if (typeof ctx.message !== "undefined" && typeof ctx.message.text !== "undefined"){
                    if (ctx.message.text === "/start"){
                        return await selectStep(ctx)
                    }else if (ctx.message.text == `${ctx.i18n.t('start.great.buttons.ready')}`){ 
                        user.step = 4
                        await startTest(ctx)
                    }else if (ctx.message.text == `${ctx.i18n.t('start.great.buttons.know')}`){
                        user.step = 4
                        await aboutUs(ctx)
                    }
                }
            }catch(e){console.log(e)}
        })
        return item
    }
}

module.exports = new SceneGenerator().getStartScene()

async function findUser(ctx){
    try{
        ctx.webhookReply = false
        user = await queryUser.findOne({id: ctx.chat.id})
        console.log("findUser: " + user)
        if (user){
            ctx.i18n.locale(user.lang)
        }else{
            user = await queryUser.create(ctx)
        }
    }catch(e){console.log(e)}
}

async function selectStep(ctx){ 
    ctx.webhookReply = false
    console.log(user)
    switch(user.step){
        case 1: {
            await selectLanguage(ctx)
            return ctx.wizard.selectStep(1)
            }
        case 2: {
            await acceptAgreement(ctx)
            return ctx.wizard.selectStep(2)
        }
        case 3: {
            await readyOrKnow(ctx)
            return ctx.wizard.selectStep(3)
        }
        case 4: {
            await aboutUs(ctx)
        }
    }}

async function selectLanguage(ctx){
    ctx.webhookReply = false
    await ctx.reply(`${ctx.i18n.t('selectLang')}`,
    Extra.HTML().markup(Markup.inlineKeyboard(
        [
            Markup.callbackButton('🇺🇸 English', 'en'),
            Markup.callbackButton('🇷🇺 Русский', 'ru')
        ]
    )))
}

async function acceptAgreement(ctx){
    ctx.webhookReply = false
    await ctx.replyWithHTML(ctx.i18n.t('change'))
    await ctx.replyWithHTML(ctx.i18n.t('start.hello', {
        userId: ctx.from.id,
        userFirstName: ctx.from.first_name,
        name: file.fondInfo.name
    }))
    await ctx.replyWithHTML(`👇${ctx.i18n.t('start.acception.text')}`, Extra.HTML()
        .markup(Markup.keyboard([`${ctx.i18n.t('start.acception.button')}` ]).resize()))
}
async function readyOrKnow(ctx){
    await ctx.replyWithHTML(`👇${ctx.i18n.t('start.great.text')}`,
        Extra.HTML()
        .markup(Markup.keyboard(
        [
            `${ctx.i18n.t('start.great.buttons.ready')}`,
            `${ctx.i18n.t('start.great.buttons.know')}`                  
        ]).resize()))
}
async function startTest(ctx){  
    require("../bot").test(ctx)
    ctx.scene.leave()
}
async function aboutUs(ctx){
    ctx.webhookReply = false
    await ctx.replyWithHTML(`👇${ctx.i18n.t('scenes.fond.about_us')}`,
        Extra.HTML()
        .markup(Markup.inlineKeyboard(
        [
            Markup.callbackButton(`${ctx.i18n.t('start.great.buttons.continue')}`, 'cont'),
            Markup.callbackButton(`${ctx.i18n.t('start.great.buttons.ready')}`, 'test')          
        ])))
    require("./helper").menuMessage(ctx)
}
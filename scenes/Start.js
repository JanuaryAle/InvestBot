const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const WizardScene = require('telegraf/scenes/wizard')
const file = require('../data/info.json')

const fs = require('fs')
const usersFileName = '../data/userlist.json'
const users = require(usersFileName)

class SceneGenerator{

    getStartScene() {
        const item = new WizardScene('start', 
        async (ctx) => {
            await ctx.reply(`${ctx.i18n.t('selectLang')}`,
                Extra.HTML().markup(Markup.inlineKeyboard(
                    [
                        Markup.callbackButton('🇺🇸 English', 'en'),
                        Markup.callbackButton('🇷🇺 Русский', 'ru')
                    ]
                ))
            )
            return ctx.wizard.next()
        }, async ctx => {
            try{
                const callbackQuery = ctx.callbackQuery.data
                ctx.i18n.locale(callbackQuery);
                await ctx.replyWithHTML(ctx.i18n.t('change'))
                await ctx.replyWithHTML(ctx.i18n.t('start.hello', {
                    userId: ctx.from.id,
                    userFirstName: ctx.from.first_name,
                    name: file.fondInfo.name
                }))
                await ctx.replyWithHTML(ctx.i18n.t('start.acception.text'), Extra.HTML()
                    .markup(Markup.keyboard([`${ctx.i18n.t('start.acception.button')}` ]).resize()))
                return ctx.wizard.next()
            }catch(e){}
        }, async ctx => {
            try{
                if (ctx.message.text == `${ctx.i18n.t('start.acception.button')}`){
                    ctx.replyWithHTML(`${ctx.i18n.t('start.great.text')}`,
                        Extra.HTML()
                        .markup(Markup.keyboard(
                        [
                            `${ctx.i18n.t('start.great.buttons.ready')}`,
                            `${ctx.i18n.t('start.great.buttons.know')}`                  
                        ]).resize()))
                    return ctx.wizard.next()
                }
            }catch(e){}
        }, async ctx => {
            try{
                if (ctx.message.text == `${ctx.i18n.t('start.great.buttons.ready')}`){ 
                    ctx.reply('Чуть позже определимся, что делать дальше, пока выходим из всех сцен, можете прогнать старт снова /start')         
                    require("./helper").menuMessage(ctx)
                }else if (ctx.message.text == `${ctx.i18n.t('start.great.buttons.know')}`){
                    ctx.replyWithHTML(`${ctx.i18n.t('scenes.fond.about_us')}`,
                        Extra.HTML()
                        .markup(Markup.keyboard(
                        [
                            `${ctx.i18n.t('start.great.buttons.continue')}`,                 
                        ]).resize()))    
                    return ctx.wizard.next()                 
                }
            }catch(e){console.log(e)}
        }, async ctx => {
            try{ 
                if (ctx.message.text == `${ctx.i18n.t('start.great.buttons.continue')}`){ 
                    ctx.reply('И тут вы переходите в услуги, но раздел пока не реализован, поэтому пока выходим из всех сцен, можете снова прогнать старт /start')  
                    require("./helper").menuMessage(ctx)                
                }
            }catch(e){console.log(e)}
        })
        return item
    }
}

module.exports = new SceneGenerator().getStartScene()
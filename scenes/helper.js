const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const file = require('../data/info.json')
const bcrypt = require('bcryptjs')
const { match } = require('telegraf-i18n')


module.exports.setCommands = (bot, registred) => {

    bot.hears(/🌎/, async ctx =>       //🎩|👩🏻‍🔧|🛍|❓|🌎|📈  
        {
            if (registred(ctx)){
                const text = ctx.message.text
                const scene = text.charAt(0)+text.charAt(1)
                await ctx.scene.enter(scene)
            }
        }  
    );
    
    bot.help( async ctx => {
        await ctx.replyWithHTML(`${ctx.i18n.t('help')}`)
    })

    bot.action(/^(?:(ru|en))$/, async ctx => {
        const callbackQuery = ctx.callbackQuery.data
        if (ctx.i18n.locale() !== callbackQuery){
            ctx.i18n.locale(callbackQuery)
            const message = ctx.i18n.t('change')
            await ctx.replyWithHTML(message)
        }
    })

    bot.command('admin', async ctx => {
        try{
            let m = ctx.message.text.split(" ")
            m = m.filter(item => item != "")
            const password = m[1]

            if (bcrypt.compareSync(password, process.env.ADMIN_PASSWORD))
                 ctx.scene.enter('admin')
            else
            await ctx.reply(`${ctx.i18n.t('admin')}`)
        }catch(e){}
      })
    
    bot.hears(match('lang'), async ctx => langChange(ctx))
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


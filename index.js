const Telegraf = require('telegraf')
require('dotenv').config()


const {
    Markup,
    Extra,
    Stage,
    session
} = Telegraf

const TelegrafI18n = require('telegraf-i18n')
const path = require("path")
const fileName = './data/userlist.json'
const file = require(fileName)

const start = require('./Start')

const TOKEN = process.env.BOT_TOKEN
const URL = process.env.URL

const stage = new Stage();

const bot = new Telegraf(process.env.TOKEN)

const i18n = new TelegrafI18n({
    defaultLanguage: 'en',
    directory: path.resolve(__dirname, 'locales'),
    useSession: true,
    allowMissing: false,
    sessionName: 'session'
});

bot.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const response_time = new Date() - start
    console.log(`(Response Time: ${response_time})`)
  })

bot.use(session())
bot.use(i18n.middleware());
bot.use(stage.middleware())

stage.register(start) 

bot.command('start', async ctx => {
    //if (!isUserInBd(ctx)){
        ctx.scene.enter('start')
    // }else {
    //     ctx.reply('Вы уже приняли соглашение')
    // }
})

bot.hears(/🎩|👩🏻‍🔧|🛍|❓|🌎|📈/, async ctx =>
    {
        if (isUserInBd(ctx)){
            const text = ctx.message.text
            await ctx.replyWithHTML("Этот раздел пока не реализован:) /start")
            //await ctx.scene.enter(scene)
        }
    }  
);

bot.on('message', async ctx => {
    ctx.reply('Пока ничего кроме /start сделать нельзя')
    // if (isUserInBd(ctx)){
    //     //await ctx.scene.enter('menu')
    // }
})

if (process.env.NODE_ENV === "production")
{
    bot.telegram.setWebhook(`${URL}/bot${TOKEN}`)
}else{
    bot.launch(5000)
}

let flag = false

function isUserInBd(ctx){

    if (flag) return flag

    file.forEach(user => {
        if (ctx.update.message.chat.id === user.id){
            flag = true
            return
        }
    });

    return flag
}
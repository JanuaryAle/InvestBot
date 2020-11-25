const Telegraf = require('telegraf')
require('dotenv').config()

const {
    Markup,
    Extra,
    Stage,
    session
} = Telegraf

const TelegrafI18n = require('telegraf-i18n')
const GetNewsList = require('./util/parser')
const { match } = require('telegraf-i18n')
const path = require("path")
const fileName = './data/userlist.json'
const file = require(fileName)

const start = require('./scenes/Start')
const news = require('./scenes/News')

const mongoose = require('mongoose')
const { menuMessage } = require('./scenes/helper')

mongoose.connect(process.env.MONGO_DB_PASS
    ,{
    useNewUrlParser: true,
})
.then(() => console.log('MongoDb connected'))
.catch(error => console.log(error))


const TOKEN = process.env.BOT_TOKEN
const URL = process.env.URL

const bot = new Telegraf(TOKEN)
const stage = new Stage();

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

stage.register(start, news) 

bot.command('start', async ctx => {
    //if (!isUserInBd(ctx)){
        ctx.scene.enter('start')
    // }else {
    //     await ctx.scene.enter('menu')
    // }
})

require('./scenes/helper').setCommands(bot, isUserInBd)

bot.on('message', async ctx =>
{
    if (isUserInBd(ctx))
        menuMessage(ctx)
});

if (process.env.NODE_ENV === "production")
{
    console.log('prod')
    bot.telegram.setWebhook(`${URL}/bot${TOKEN}`)
}else{
    bot.launch(5000)
}

module.exports = bot

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
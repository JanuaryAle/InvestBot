const Telegraf = require('telegraf')
require('dotenv').config()

const fs = require('fs');
let pollMessage
const usersFileName = './data/userlist.json'
const users = require(usersFileName)

const {
    Markup,
    Extra,
    Stage,
    session
} = Telegraf

const TelegrafI18n = require('telegraf-i18n')
const path = require("path")

const start = require('./scenes/Start')
const news = require('./scenes/News')
const fond = require('./scenes/Fond')

const mongoose = require('mongoose')
const bodyParser = require('koa-bodyparser');


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


let isTesting = false

bot.use(async (ctx, next) => {
    const start = new Date()
    try{
        if (isTesting && ctx.update.message && ctx.update.message.text && !ctx.update.message.text.startsWith('📝')) isTesting = false
        if (ctx.update.poll){
            console.log(ctx.update)
            if (isTesting && ctx.update.poll.id === pollMessage.poll.id) acceptAnswer(ctx)
    }}catch(e){}
    await next()
    const response_time = new Date() - start
    console.log(`(Response Time: ${response_time})`)
  })

bot.use(session())
bot.use(i18n.middleware());
bot.use(stage.middleware())

stage.register(start, news, fond) 

require('./scenes/helper').setCommands(bot)

if (process.env.NODE_ENV === "production")
{
    bot.telegram.setWebhook(`${URL}/bot${TOKEN}`)
}else{
    bot.launch(5000)
}

module.exports = bot

let polls
let index
let context
let pollAnswers

module.exports.test = startTest
async function startTest(ctx){
    try{    
        polls = require('./data/polls.json')
        index = 0
        pollAnswers = []
        context = ctx
        await ctx.replyWithHTML(`Количество вопросов: ${polls.length}`,  Extra.HTML().markup(Markup.keyboard(
        [
        [`${ctx.i18n.t('menu')}`], [`${ctx.i18n.t('over')}` ]                 
        ]).resize()))

        printPoll(ctx)
        isTesting = true
    }catch(e){console.log(e)}
}

function acceptAnswer(ctx){
    try{
    ctx.update.poll.options.forEach((element, i) => {
        if (element.voter_count === 1){
            pollAnswers.push(i)
        }
    });
    if (index === polls.length){
        context.reply("Ваш результат: \n" + pollAnswers)   
        isTesting = false    
    }else{
        printPoll(ctx)
    }
}catch(e){}
}

async function printPoll(ctx){
    try{     
        if (pollMessage) {
            context.telegram.deleteMessage(pollMessage.chat.id, pollMessage.message_id)
        }     
        const poll = polls[index]
        context.webhookReply = false
        pollMessage = await context.replyWithPoll(
            poll.question,
            poll.answers
        )
        context.webhookReply = true
        index++
    }catch(e){console.log(e)}
}

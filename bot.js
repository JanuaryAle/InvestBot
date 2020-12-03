const Telegraf = require('telegraf')
require('dotenv').config()

const fs = require('fs');
let pollMessage
let timeout
const queryUser = require('./util/queryUser');

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
const admin = require('./scenes/Admin')

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
    await next()
    const response_time = new Date() - start
    console.log(`(Response Time: ${response_time})`)
  })

bot.use(session())
bot.use(i18n.middleware());
bot.use(stage.middleware())

stage.register(start, news, fond, admin) 

require('./scenes/helper').setCommands(bot)

let polls
let index = 0
let pollAnswers = []

bot.action(/answer:/, async ctx => {
    try{
        if (!pollMessage){
            ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
            startTest(ctx)
        }
        if (pollMessage.message_id === ctx.update.callback_query.message.message_id){
            const result = +ctx.callbackQuery.data.substr(7)
            pollAnswers.push(result)
            if (index === polls.length){
                clearTimeout(timeout)
                ctx.telegram.editMessageText(pollMessage.chat.id, pollMessage.message_id, undefined, "Ваш результат: \n" + pollAnswers)   
                isTesting = false
                pollMessage = false    
            }else{
                printPoll(ctx)
        }}
    }catch(e){}
})

if (process.env.NODE_ENV === "production")
{
    bot.telegram.setWebhook(`${URL}/bot${TOKEN}`)
}else{
    bot.launch(5000)
}

module.exports = bot

module.exports.test = startTest

async function startTest(ctx){
    try{   
        polls = require('./data/polls.json')
        index = 0
        pollAnswers = []

        if (pollMessage) {
            ctx.telegram.deleteMessage(pollMessage.chat.id, pollMessage.message_id)
        }

        pollMessage = false
        await ctx.replyWithHTML(`Количество вопросов: ${polls.length}`,  Extra.HTML().markup(Markup.keyboard(
        [
        [`${ctx.i18n.t('menu')}`], [`${ctx.i18n.t('over')}` ]                 
        ]).resize()))

        printPoll(ctx)
        isTesting = true
    }catch(e){console.log(e)}
}

async function printPoll(ctx){
    try{
        updateTimeout(ctx)
        const poll = polls[index]
        if (pollMessage) {
            ctx.telegram.deleteMessage(pollMessage.chat.id, pollMessage.message_id)
        }

        ctx.webhookReply = false     
        pollMessage = await ctx.replyWithHTML(poll.question, Extra.HTML().markup(Markup.inlineKeyboard(convert(poll.answers)).resize()))
        ctx.webhookReply = true 
        index++
    }catch(e){console.log(e)}
}

function convert(array){
    const keyboard = []
    array.forEach((element, i) => {
        keyboard.push([Markup.callbackButton(element, `answer:${i}`)])
    });
    return keyboard
}
function updateTimeout(ctx){
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout( ()=> {
        if (pollMessage) {
            ctx.telegram.deleteMessage(pollMessage.chat.id, pollMessage.message_id)
            pollMessage = false
        }
        ctx.replyWithHTML("Время ожидания ответов закончено, можете заново заполнить анкету")
    }, 900000)
}
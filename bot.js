const Telegraf = require('telegraf')
require('dotenv').config()

const pollsOriginal = require('./data/polls.json')

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
const { command } = require('telegraf/composer');

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

stage.register(start, news, fond, admin) 

require('./scenes/helper').setCommands(bot)

let setAnswers
let polls
let index
let poll
let pollMessage
let pollAnswers
let progressBar
let timeout

bot.action('done', async ctx => {
    if (setAnswers.size > 0){
        for (let a of setAnswers){
            const asessment = poll.asessment[a]
            pollAnswers.forEach((item, i) => {
                pollAnswers[i] = item + asessment[i]
            })
        }
        console.log(pollAnswers)
        printPoll(ctx)
    }
})

bot.action(/answer:/, async ctx => {
    const answer = +ctx.callbackQuery.data.split(":")[1]
    if (!pollMessage){
        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
        startTest(ctx)
    }
    if (pollMessage.message_id === ctx.update.callback_query.message.message_id){
    ctx.webhookReply = false
    if (poll.multiple_answers){
        if (setAnswers.has(answer)){
            setAnswers.delete(answer)
            poll.answers[answer] = poll.answers[answer].substr(2)
        }else{
            setAnswers.add(answer)
            poll.answers[answer] = "🟢 " + poll.answers[answer]
        }
        await ctx.telegram.editMessageText(pollMessage.chat.id, pollMessage.message_id, undefined, `<b>${poll.question}</b>`, Extra.HTML().markup(Markup.inlineKeyboard(convert())))
    }else {
        let i = -1
        if (setAnswers.size > 0){
            for (let item of setAnswers) i = item
            if (i !== answer){
                setAnswers.delete(i)
                setAnswers.add(answer)
                poll.answers[answer] = "🟢 " + poll.answers[answer]  
                poll.answers[i] = poll.answers[i].substr(2)
                await ctx.telegram.editMessageText(pollMessage.chat.id, pollMessage.message_id, undefined, `<b>${poll.question}</b>`, Extra.HTML().markup(Markup.inlineKeyboard(convert())))   
            }
        }else{
            setAnswers.add(answer)
            poll.answers[answer] = "🟢 " + poll.answers[answer]  
            await ctx.telegram.editMessageText(pollMessage.chat.id, pollMessage.message_id, undefined, `<b>${poll.question}</b>`, Extra.HTML().markup(Markup.inlineKeyboard(convert()))) 
        }
              
    }}
})

bot.on('text', async ctx => {
    printPoll(ctx)
})

if (process.env.NODE_ENV === "production")
{
    bot.telegram.setWebhook(`${URL}/bot${TOKEN}`)
}else{
    bot.launch(5000)
}

module.exports = bot

async function startTest(ctx){

    polls = JSON.parse(JSON.stringify(pollsOriginal))
    index = 0
    pollAnswers = [0, 0, 0, 0]

    if (progressBar){
        await ctx.telegram.deleteMessage(progressBar.chat.id, progressBar.message_id)
    }
    ctx.webhookReply = false
    progressBar = await ctx.replyWithHTML(`Количество вопросов: ${index + 1}/${polls.length}`,  Extra.HTML().markup(Markup.keyboard(
        [
        [`${ctx.i18n.t('menu')}`], [`${ctx.i18n.t('over')}` ]                 
        ]).resize()))
    if (polls.length > 0){
        printPoll(ctx)
    }
}

module.exports.test = startTest

async function printPoll(ctx){
    updateTimeout(ctx)
    poll = polls[index]
    setAnswers = new Set()
 
    index++
    if (index <= polls.length){
        if (progressBar) {
            await ctx.telegram.deleteMessage(progressBar.chat.id, progressBar.message_id)
        }
        ctx.webhookReply = false
        progressBar = await ctx.replyWithHTML(`Количество вопросов: ${index}/${polls.length}`,  Extra.HTML().markup(Markup.keyboard(
            [
            [`${ctx.i18n.t('menu')}`], [`${ctx.i18n.t('over')}` ]                 
            ]).resize()))

        if (pollMessage) {
            ctx.telegram.deleteMessage(pollMessage.chat.id, pollMessage.message_id)
        }

        ctx.webhookReply = false
        pollMessage = await ctx.reply(`${poll.question}`, Extra.HTML({parse_mode: "HTML"}).markup(Markup.inlineKeyboard(convert())))
    }else {
        clearTimeout(timeout)

        if (progressBar) {
            await ctx.telegram.deleteMessage(progressBar.chat.id, progressBar.message_id)
        }
        if (pollMessage) {
            ctx.telegram.deleteMessage(pollMessage.chat.id, pollMessage.message_id)
        }

        pollMessage = false
        progressBar = false
        let recommend = []
        let max = pollAnswers[0]
        recommend.push[0]
        pollAnswers.forEach((item, i) => {
            if (item > max){
                max = item
                recommend = []
                recommend.push(i)
                console.log(i +" "+ max)
            }else if (item === max){
                recommend.push(i)
            }

        })
        const dict = {
            0 : "IPO, пул",
            1 : "IPO, сам",
            2 : "Робот",
            3 : "Канал"
        }

        let str = ''
        console.log(recommend)
        recommend.forEach(item => {
            str = str + "🟣 " + dict[item] + "\n"
        })
        await ctx.reply(`Рекомендуем ознакомится с нашими услугами:\n\n${str}`, Extra.HTML().markup(Markup.keyboard(
            [
            [`${ctx.i18n.t('menu')}`], [`${ctx.i18n.t('over')}` ]                 
            ]).resize()))
    }
}

function convert(){
    const keyboard = []
    
    if (!poll.orientation) {
        poll.answers.forEach((element, i) => {
            keyboard.push([Markup.callbackButton(element, `answer:${i}`)])
        });
    }else {
        mini = []
        poll.answers.forEach((element, i) => {
            mini.push(Markup.callbackButton(element, `answer:${i}`))
        });
        keyboard.push(mini)
    }
    keyboard.push([Markup.callbackButton("🖍 Ответить", `done`)])

    return keyboard
}

function updateTimeout(ctx){
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout( ()=> {
        if (pollMessage) {
            ctx.telegram.deleteMessage(pollMessage.chat.id, pollMessage.message_id)
            pollMessage = false
        }
        ctx.replyWithHTML("Время ожидания ответов закончено, можете заново заполнить анкету",  Extra.HTML().markup(Markup.keyboard(
            [
            [`${ctx.i18n.t('menu')}`], [`${ctx.i18n.t('over')}` ]                 
            ]).resize()))
    }, 900000)
}

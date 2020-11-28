const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const GetNewsList = require('../util/parser')
const { match } = require('telegraf-i18n')

var index
var list
var page = 1
var flag


class SceneGenerator{
    GetNewsScene() {
        const item = new Scene('🌎')

        item.enter(async ctx => {
        index = 0 
        list = []
        flag = true
        printPortion(3, ctx)
        await ctx.reply(`${ctx.i18n.t('scenes.news.text')}`, Extra.HTML({parse_mode: 'HTML'})
        .markup(Markup.keyboard(
            [[`${ctx.i18n.t('scenes.news.buttons.more')}`], [`${ctx.i18n.t('retry')}`]]).resize()))
        }) 
        
        item.hears(match('scenes.news.buttons.more'), async ctx => {           
            show(ctx)
        }) 

        item.hears(match('retry'), async ctx => {  
            require("./helper").menuMessage(ctx)         
        }) 

        item.action('show', async ctx => 
        {
            printPortion(3, ctx)
        })
        
        item.leave(async ctx => {
            flag = false
        })

        require('./helper').setCommands(item)
        return item
    }
}

module.exports = new SceneGenerator().GetNewsScene()

module.exports.show = async function show(ctx){  
    printPortion(2, ctx)  
}

async function printPortion(k, ctx){
    while (k > 0 && index < list.length && flag) 
    {
        const element = list[index]
        const readMore = `${ctx.i18n.t('scenes.news.source', {href: element.href})}`
        await ctx.replyWithHTML(readMore)
        k--
        index += 1
    }
    if (index >= list.length - 2){
        const promise = GetNewsList(page++)
        promise.then((data) => {
            if (flag){
                list = list.concat(data);
                if (k > 0) printPortion(k, ctx)
            }
        })
    }
} 

async function show(ctx){  
    printPortion(2, ctx)  
}
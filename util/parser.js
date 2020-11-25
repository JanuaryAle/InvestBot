var querystring = require('querystring');
const needle = require('needle');
const cherrio = require('cheerio')

var form = {
  username: 'usr',
  password: 'pwd',
  opaque: 'opaque',
  logintype: '1'
};

const url = "https://ru.investing.com"

function GetNewsList(page) {
    var formData = querystring.stringify(form);

    return new Promise(function (resolve, reject) {
      needle.get( encodeURI(url + '/news/stock-market-news'+`/${page > 0 ? page : ''}`),{
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
            'Content-Type' : 'application/x-www-form-urlencoded' 
        },
        body: formData,
        },  function (a,res) {
          var newsArray = []
          var $ = cherrio.load(res.body)

          $('div.largeTitle article.js-article-item div.textDiv a.title').each(function(i, element){
            var title = $(this).text();
            var href = $(element).attr("href");

            if(newsArray[i] == undefined){
                newsArray[i] = {};
              };
              newsArray[i].title = title;
              newsArray[i].href = url + href;
          })
          $('div.largeTitle article.js-article-item div.textDiv p').each(function(i, element){
              var details = $(this).text();

              if(newsArray[i] == undefined){
                newsArray[i] = {};
              };
              newsArray[i].details = details;
            })

            newsArray = newsArray.filter(element => (element.title.toLowerCase().indexOf("акц") > -1) || (element.details.toLowerCase().indexOf("акц") > -1))

            resolve(newsArray)
      }
    )
  });   
}

module.exports = GetNewsList


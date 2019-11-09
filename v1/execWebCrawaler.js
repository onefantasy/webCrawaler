const webCrawaler = require('./webCrawaler')

/**
 * @parasm: {
 *      baseURL ：字符串，基本路径，必须设置
        searchURL : 字符串，搜索路径，可以不设置，将所有的路径写在basrURL
        operation : 函数，用于筛选数据
        fileURL : 字符串, 数据收集结果的存储文件的路径，默认是当前文件夹下的result123456789.txt文件
        saveCallback : 函数，将收集结果写入文件或者是数据库之后的回调函数
        sqlName : 字符串 , 表示要创建的新表的名字，如果，不设置，则表示不需要插入到数据库中，默认将数据收集结果写入文件当中
 * }
 */

const instance = new webCrawaler({
    baseURL: 'https://juejin.im',
    searchURL: '/search?query=node%20%E7%88%AC%E8%99%AB&type=all',
    operation($,result,baseURL){
        $('.main-list>.item').each( (index,item) => {
			const obj = $(item)
			let tag = []
			
			obj.find('.tag a').each((index,item) => {
				tag.push($(item).text())
			})

			const info = {
				title: obj.find('.title > span').text(),	
				// href: path.join(baseURL,item.attr('href'))
				// 注意：爬取掘金网站获取某些网站时，使用上面的方式生成的路径，在路径斜杆处会多出一根斜杆，无法直接访问，可能是后台的处理问题
				href: baseURL + obj.find('.title').attr('href'),	
				tag: tag.join(' '),		
				createDate: obj.find('.username + .item').text()	
			}

			// 数据收集
			if(!!info.title) result.push(info)
		})
    },
    fileURL: './result.txt',
    saveCallback(){
        console.log('已经写入数据库了')
    },
    sqlName: 'result' // 将收集的结果写入数据库的表
})

// 进行数据收集
instance.collectData()
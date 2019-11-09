const https = require('https')
const cheerio = require('cheerio')
const path = require('path')
const fs = require('fs')

const baseURL = 'https://juejin.im'
const searchURL = '/search?query=node%20%E7%88%AC%E8%99%AB&type=all'

const url = path.join(baseURL,searchURL)

https.get(url, function(res) {
	let chunks = []
	let size = 0 
	
	// 接收数据ing...
	res.on('data', function(chunk) {
		chunks.push(chunk)
		size += chunk.length
	})

	// 接收数据完成，进行信息的收集
	res.on('end', function() {
		const data = Buffer.concat(chunks,size)
		const html = data.toString()
		let $ = cheerio.load(html)

		let result = []

		$('.main-list>.item').each( (index,item) => {
			const obj = $(item)
			let tag = []
			
			// 获取标签
			obj.find('.tag a').each((index,item) => {
				tag.push($(item).text())
			})

			// 格式化
			const info = {
				title: obj.find('.title > span').text(),	//文章标题
				// href: path.join(baseURL,item.attr('href'))
				// 注意：爬取掘金网站获取某些网站时，使用上面的方式生成的路径，在路径斜杆处会多出一根斜杆，无法直接访问，可能是后台的处理问题
				href: baseURL + obj.find('.title').attr('href'),	// 链接
				tag: tag.join(' '),		// 文章标签
				createDate: obj.find('.username + .item').text()	// 文章创建日期
			}

			// 信息收集
			result.push(JSON.stringify(info))
		})
		
		// 写入文件
		fs.writeFile('./result.txt',result.join('\r\n'),{encoding: 'utf-8'},()=>{
			console.log('文件写入完成')
		})
	})
})

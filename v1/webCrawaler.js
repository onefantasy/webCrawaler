const https = require('https')
const cheerio = require('cheerio')
const fs = require('fs')
const db = require('./db')

const BASE_URL = 'https://www.baidu.com/s?wd='

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

class webCrawaler{
    // 构造器
    constructor(props){
        this.baseURL = props.baseURL || ''
        this.searchURL = props.searchURL || ''
        this.url = this.baseURL + this.searchURL // 请求的真实路径
        this.operation = props.operation || function(){console.log('请输入你的操作')}
        this.result = []    // 数据收集结果
        this.fileURL = props.fileURL || './result123456789.txt'  // 数据收集结果的存储文件
        this.saveCallback = props.saveCallback || function(){}    // 写入文件或者数据库之后的回调函数
        this.sqlName = props.sqlName
    }

    // 判断某两个值是否相等，如果是，则打印出相应的提示
    _isTrue(a,b,word){
        const bool = (a === b)
        if(bool){
            console.log(word)
        }
        return bool
    }

    // 写入文件
    _writeFile(){
        const file = this.result.map(item => JSON.stringify(item)).join('\r\n')
        fs.writeFile(this.fileURL, file, {encoding: 'utf-8'}, (err) => {
            if(err) console.error('写入文件出错',err)
            else this.saveCallback()
        })
    }

    // 写入数据库
    _writeDB(){
        // 获取键名
        const keys = Object.keys(this.result[0])
        const keysArr = keys.map(item => `${item} varchar(100)`)
        // 在数据库中创建表格
        db.query(`create table ${this.sqlName} (${keysArr.join(',')})`)
        .then(res => {
            // 数据表创建成功
            // 将收集到的数据写入数据库中
            const promises = this.result.map( item => {
                // 如果数据是字符型，必须使用单引号或者双引号，如："value"
                const values = Object.values(item).map(item => `"${item}"`)
                return db.query(`insert into ${this.sqlName}(${keys.join(',')}) values(${values.join(',')})`)
            })
            // 返回一个promise
            return Promise.all(promises)
        })
        .then(res => {
            //  插入数据成功
            this.saveCallback()
        })
        .catch(err => {
            // 数据库操作失败
            console.log('数据库操作失败：',err)
        })
    }

    // 数据请求和收集
    collectData(){
        // 设置路径不正确，退出程序
        if(this._isTrue(this.baseURL,'','必需设置基本路径(baseURL)')) return
        // 发起请求进行收集
        https.get(this.url,(res) => {
            let chunks = []
            let size = 0
            
            // 接收数据ing...
            res.on('data',(chunk) => {
                chunks.push(chunk) 
                size += chunk.length
            })

            // 数据接收完毕
            res.on('end',() => {
                const data = Buffer.concat(chunks,size)
		        const $ = cheerio.load(data.toString())
                this.operation($,this.result,this.baseURL)
                // 判断是否已经收集到想要的数据
                if(this._isTrue(this.result.length,0,'没有收集到想要的数据')) return
                // 写入文件或者是数据库
                !!this.sqlName ? this._writeDB() : this._writeFile()
            })
        }).on('error', (err) => {
            // 请求失败
            console.log('网络请求出错：',err)
        })
    }

}

// 导出类
module.exports = webCrawaler
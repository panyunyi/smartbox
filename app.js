'use strict';
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');
var AV = require('leanengine');
var async = require('async');

var app = express();

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云函数定义
require('./cloud');
// 加载云引擎中间件
app.use(AV.express());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.get('/', function(req, res) {
  res.render('index', { currentTime: new Date() });
});
app.get('/api/getData', function(req, res) {
    
    //var admincard={};

    function promise1(){
      var query = new AV.Query('AdminCard');
      query.equalTo('isDel',false);
      query.find().then(function (results) {
          console.log('ac:'+results.length);
          data.push(results);
          //callback(null,results
          return results;
        }, function (error) {
          // 异常处理
        });
    }
    function promise2(){
      var query = new AV.Query('Product');
      query.equalTo('isDel',false);
      query.find().then(function (results) {
          console.log('p:'+results.length);
          data.push(results);
          //callback(null,results);
          return results;
        }, function (error) {
          // 异常处理
          deferred.reject(error);
        });
    }
    async.parallel([
        function (callback){
            //promise1(callback);
            callback(null,promise1());
        },
        function (callback){
            //promise2(callback);
            callback(null,promise2());
        }],function(err,results){
        var data=[];
        data.push(results);
        var result={
            status:200,
            message:"",
            data:data,
            server_time:new Date()
        }
        res.jsonp(result);
        console.log(result);
        console.log(results);
    });
});
// 可以将一类的路由单独保存在一个文件中
app.use('/todos', todos);

app.use(function(req, res, next) {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  if (!res.headersSent) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function(err, req, res, next) { // jshint ignore:line
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if(statusCode === 500) {
    console.error(err.stack || err);
  }
  if(req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {}
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

module.exports = app;

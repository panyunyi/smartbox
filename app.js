'use strict';
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');
var getData=require('./routes/getData');
var tool=require('./routes/tool');
var AV = require('leanengine');
var users = require('./routes/users');
var app = express();
var admin=require('./routes/admin');
var error=require('./routes/error');
var takeout=require('./routes/takeout');
var borrow=require('./routes/borrow');
var back=require('./routes/return');
var takeout_record=require('./routes/takeout_record');
var takeout_record0=require('./routes/takeout_record0');
var supply_record=require('./routes/supply_record');
var borrow_record=require('./routes/borrow_record');
var datatable=require('./routes/datatable');
var update=require('./routes/update');

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 设置默认超时时间
app.use(timeout('175s'));

// 加载云函数定义
require('./cloud');
// 加载云引擎中间件
app.use(AV.express());
// 加载 cookieSession 以支持 AV.User 的会话状态
app.use(AV.Cloud.CookieSession({ secret: '05XgTktKPMkU', maxAge: 3600000, fetchUser: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.get('/', function(req, res) {
  res.render('login',{title:'用户登录'});
});
app.get('/logout',function(req,res){
    req.currentUser.logOut();
    res.clearCurrentUser();
    return res.redirect('login');
});

app.use('/api/json',datatable);
app.use('/api/getData',getData);
app.use('/api/takeout',takeout);
app.use('/api/borrow',borrow);
app.use('/api/return',back);
app.use('/api/takeout_record',takeout_record);
app.use('/api/temp',takeout_record0);
app.use('/api/supply_record',supply_record);
app.use('/api/borrow_record',borrow_record);
app.use('/api/error',error);
app.use('/api/update',update);
// 可以将一类的路由单独保存在一个文件中
//app.use('/todos', todos);
app.use('/tool',tool);
app.use('/login', users);
app.use('/admin',admin);

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

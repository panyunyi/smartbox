'use strict';
var router = require('express').Router();
var AV = require('leanengine');

router.get('/', function(req, res, next) {
  var errMsg = req.query.errMsg;
  res.render('login', {title: '用户登录', errMsg: errMsg});
})

router.post('/', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  AV.User.logIn(username, password).then(function(user) {
    res.saveCurrentUser(user);
    res.redirect('admin');
  }, function(err) {
    res.render('login',{
        title:"登录失败",
        errMsg:"帐号密码有误"
    });
  }).catch(next);
});

router.get('/register', function(req, res, next) {
  var errMsg = req.query.errMsg;
  res.render('register', {title: '用户注册', errMsg: errMsg});
});

router.post('/register', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  if (!username || username.trim().length == 0
    || !password || password.trim().length == 0) {
    return res.redirect('register?errMsg=用户名或密码不能为空');
  }
  var user = new AV.User();
  user.set("username", username);
  user.set("password", password);
  user.signUp().then(function(user) {
    res.saveCurrentUser(user);
    //res.redirect('/todos');
  }, function(err) {
    res.redirect('register?errMsg=' + JSON.stringify(err));
  }).catch(next);
});

module.exports = router;

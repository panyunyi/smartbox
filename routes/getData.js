'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');

router.get('/:id', function(req, res) {
    var deviceid=req.params.id;
    console.log(deviceid);
    //var
    function promise1(callback){
      var query = new AV.Query('AdminCard');
      query.equalTo('isDel',false);
      query.find().then(function (results) {
          results={AdminCard:results};
          return callback(null,results);
        }, function (error) {
          // 异常处理
          return callback(error)
        });
    }
    function promise2(callback){
      var query = new AV.Query('CustomerProduct');
      query.equalTo('isDel',false);
      query.find().then(function (results) {
          results={Product:results};
          return callback(null,results);
        }, function (error) {
          // 异常处理
          return callback(error)
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
        var result={
            status:200,
            message:"",
            data:results,
            server_time:new Date()
        }
        res.jsonp(result);
    });
});
module.exports = router;

'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log.js');

function doWork(cus,box,res,ts){
    var data={};
    function promise1(callback){
      var query = new AV.Query('AdminCard');
      query.greaterThanOrEqualTo('updatedAt',ts);
      query.equalTo('customer',cus);
      query.equalTo('isDel',false);
      query.select(['card']);
      query.find().then(function (results) {
          data["AdminCard"]=results;
          return callback(null,results);
        }, function (error) {
          // 异常处理
          return callback(error)
        });
    }
    function promise2(callback){
      var query = new AV.Query('CustomerProduct');
      query.greaterThanOrEqualTo('updatedAt',ts);
      query.include('product');
      query.equalTo('cusId',cus);
      query.equalTo('isDel',false);
      query.find().then(function (results) {
          var arr=[];
          results.forEach(function(result){
              var one={"cusProductName":result.get('cusProductName'),"productName":result.get('product').get('name'),"objectId":result.get('product').get('id'),"createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt')};
              arr.push(one);
          });
          data["Product"]=arr;
          return callback(null,results);
        }, function (error) {
          // 异常处理
          return callback(error)
        });
    }
    function promise3(callback){
        var query = new AV.Query('Employee');
        query.greaterThanOrEqualTo('updatedAt',ts);
        query.equalTo('isDel',false);
        query.equalTo('cusId',cus);
        query.find().then(function (results) {
            var arr=[];
            results.forEach(function(result){
                var one={"empNo":result.get('empNo'),"card":result.get('card'),"power":result.get('power'),"objectId":result.get('id'),"createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt')};
                arr.push(one);
            });
            data["Employee"]=arr;
            return callback(null,results);
          }, function (error) {
            // 异常处理
            return callback(error)
          });
    }
    function promise4(callback){
        var query=new AV.Query('EmployeePower');
        query.greaterThanOrEqualTo('updatedAt',ts);
        query.equalTo('isDel',false);
        query.equalTo('boxId',box);
        query.find().then(function (results) {
            var arr=[];
            results.forEach(function(result){
                var one={"unit":result.get('unit'),"product":result.get('product').get('id'),"count":result.get('count'),"period":result.get('period'),"objectId":result.get('id'),"createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt')};
                arr.push(one);
            });
            data["EmpPower"]=arr;
            return callback(null,results);
          }, function (error) {
            // 异常处理
            return callback(error)
          });
    }
    function promise5(callback){
        var query=new AV.Query('Passage');
        query.greaterThanOrEqualTo('updatedAt',ts);
        query.equalTo('isDel',false);
        query.equalTo('boxId',box);
        query.select(['capacity','seqNo','whorlSize','product','isSend','borrowState','stock']);
        query.find().then(function (results) {
            var arr=[];
            results.forEach(function(result){
                var one={"capacity":result.get('capacity'),"seqNo":result.get('seqNo'),"whorlSize":result.get('whorlSize'),"product":result.get('product').get('id'),"borrowState":result.get('borrowState'),"stock":result.get('stock'),"isSend":result.get('isSend'),"objectId":result.get('id'),"createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt')};
                arr.push(one);
            });
            data["Passage"]=arr;
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
        },
        function (callback){
            promise3(callback);
        },
        function (callback){
            promise4(callback);
        },
        function (callback){
            promise5(callback);
        }],function(err,results){
        var result={
            status:200,
            message:"",
            data:data,
            server_time:new Date()
        }
        res.jsonp(result);
    });
}
router.get('/:id', function(req, res) {
    var deviceid=req.params.id;
    var boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceid);
    boxQuery.include('cusId');
    boxQuery.first().then(function (data){
        var todo={"ip":req.headers['x-real-ip'],"api":"获取基础数据","deviceId":req.params.id,"msg":""};
        ApiLog.WorkOn(todo);
        if (typeof(data) == "undefined") { 
          var result={
            status:200,
            message:"",
            data:{},
            server_time:new Date()
          }
          res.jsonp(result);
          return;
        }
        var cus=data.get('cusId');
        doWork(cus,data,res,new Date(0));
    },function (error){
        console.log(error);
    });
});

router.get('/:id/:stamp', function(req, res) {
    var deviceid=req.params.id;
    var boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceid);
    boxQuery.include('cusId');
    boxQuery.first().then(function (data){
        var todo={"ip":req.headers['x-real-ip'],"api":"同步基础数据","deviceId":req.params.id,"msg":""};
        ApiLog.WorkOn(todo);
        if (typeof(data) == "undefined") { 
          var result={
            status:200,
            message:"",
            data:{},
            server_time:new Date()
          }
          res.jsonp(result);   
          return;   
        }
        var cus=data.get('cusId');
        doWork(cus,data,res,new Date(req.params.stamp*1000));
    },function (error){
        console.log(error);
    });
});
module.exports = router;

'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log');

function doWork(cus,box,res,ts){
    var data={};
    function promise1(callback){
      var query = new AV.Query('AdminCard');
      query.greaterThanOrEqualTo('updatedAt',ts);
      query.equalTo('customer',cus);
      if(ts-new Date(0)==0){
          query.equalTo('isDel',false);
      }
      query.select(['card','isDel']);
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
      if(new Date(0)==ts){
          query.equalTo('isDel',false);
      }
      query.find().then(function (results) {
          var arr=[];
          results.forEach(function(result){
              var one={"cusProductName":result.get('cusProductName'),"isDel":result.get('isDel'),"productName":result.get('product').get('name'),"objectId":result.get('product').get('id'),"createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt')};
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
        if(new Date(0)==ts){
            query.equalTo('isDel',false);
        }
        query.equalTo('cusId',cus);
        query.find().then(function (results) {
            var arr=[];
            async.map(results,function(result,callback2){
                async.map(result.get('card'),function(card,callback1){
                      var cardQuery = AV.Object.createWithoutData('EmployeeCard', card);
                      cardQuery.fetch().then(function () {
                        callback1(null,cardQuery.get('card'));
                    });
                },function(error,cards){
                  var one={"empNo":result.get('empNo'),"isDel":result.get('isDel'),"card":cards,"power":result.get('power'),"objectId":result.get('id'),"createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt')};
                  arr.push(one);
                  callback2(null,one);
                });
            },function(error,array){
              data["Employee"]=array;
              return callback(null,results);
          });
          }, function (error) {
            // 异常处理
            return callback(error)
          });
    }
    function promise4(callback){
        var query=new AV.Query('EmployeePower');
        query.greaterThanOrEqualTo('updatedAt',ts);
        if(new Date(0)==ts){
            query.equalTo('isDel',false);
        }
        query.equalTo('boxId',box);
        query.find().then(function (results) {
            var arr=[];
            results.forEach(function(result){
                var one={"unit":result.get('unit'),"begin":result.get('begin'),"isDel":result.get('isDel'),"product":result.get('product').get('id'),"count":result.get('count'),"period":result.get('period'),"objectId":result.get('id'),"createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt')};
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
        if(new Date(0)==ts){
            query.equalTo('isDel',false);
        }
        query.equalTo('boxId',box);
        query.select(['flag','capacity','isDel','seqNo','whorlSize','product','isSend','borrowState','stock']);
        query.find().then(function (results) {
            var arr=[];
            results.forEach(function(result){
                var one={"flag":result.get('flag'),"capacity":result.get('capacity'),"isDel":result.get('isDel'),"seqNo":result.get('seqNo'),"whorlSize":result.get('whorlSize'),"product":result.get('product').get('id'),"borrowState":result.get('borrowState'),"stock":result.get('stock'),"isSend":result.get('isSend'),"objectId":result.get('id'),"createdAt":result.get('createdAt'),"updatedAt":result.get('updatedAt')};
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
    var deviceId=req.params.id;
    var todo={"ip":req.headers['x-real-ip'],"api":"获取全部基础数据接口","deviceId":deviceId,"msg":""};
    ApiLog.WorkOn(todo);
    var boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (data){
        if (typeof(data) == "undefined") {
          var result={
            status:200,
            message:"无此设备号的数据",
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
        var result={
          status:200,
          message:"查询失败",
          data:{},
          server_time:new Date()
        }
        res.jsonp(result);
    });
});

router.get('/:id/:stamp', function(req, res) {
    var deviceId=req.params.id;
    var todo={"ip":req.headers['x-real-ip'],"api":"同步基础数据接口","deviceId":deviceId,"msg":req.params.stamp};
    ApiLog.WorkOn(todo);
    var boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (data){
        if (typeof(data) == "undefined") {
          var result={
            status:200,
            message:"无此设备号的数据",
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
        var result={
          status:200,
          message:"查询失败",
          data:{},
          server_time:new Date()
        }
        res.jsonp(result);
    });
});
module.exports = router;

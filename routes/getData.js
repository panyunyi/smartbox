'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');

function doWork(cus,box,res){
    var data={};
    function promise1(callback){
      var query = new AV.Query('AdminCard');
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
        var cus=data.get('cusId');
        doWork(cus,data,res);
    },function (error){
        console.log(error);
    });

});

router.get('/:id/:ver', function(req, res) {
    console.log(req.params.id+" "+req.params.ver);
});
module.exports = router;

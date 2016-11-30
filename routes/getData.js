'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');

router.get('/:id', function(req, res) {
    var deviceid=req.params.id;
    var boxQuery=new AV.Query('BoxInfo');
    var data={};
    //var customer=AV.
    boxQuery.equalTo('')
    function promise1(callback){
      var query = new AV.Query('AdminCard');
      query.equalTo('isDel',false);
      query.select(['card']);
      query.find().then(function (results) {
          //results={AdminCard:results};
          data["AdminCard"]=results;
          return callback(null,results);
        }, function (error) {
          // 异常处理
          return callback(error)
        });
    }
    function promise2(callback){
      var query = new AV.Query('Product');
      query.include('cusProduct');
      query.equalTo('isDel',false);
      query.select(['name','cusProduct.cusProductName']);
      query.find().then(function (results) {
          results.forEach(function(result){
              result.set('cusProduct', result.get('cusProduct') ?  result.get('cusProduct').toJSON() : null);
          });
          //results={Product:results};
          data["Product"]=results;
          return callback(null,results);
        }, function (error) {
          // 异常处理
          return callback(error)
        });
    }
    function promise3(callback){
        var query = new AV.Query('Employee');
        query.equalTo('isDel',false);
        query.include('card');
        query.include('power');
        query.select(['empNo','card','power']);
        query.find().then(function (results) {
            //results={Employee:results};
            data["Employee"]=results;
            return callback(null,results);
          }, function (error) {
            // 异常处理
            return callback(error)
          });
    }
    function promise4(callback){
        var query=new AV.Query('EmployeePower');
        query.equalTo('isDel',false);
        query.select(['unit','product','begin','count','period']);
        query.find().then(function (results) {
            //results={EmpPower:results};
            data["EmpPower"]=results;
            return callback(null,results);
          }, function (error) {
            // 异常处理
            return callback(error)
          });
    }
    function promise5(callback){
        var query=new AV.Query('Passage');
        query.equalTo('isDel',false);
        query.include('product');
        query.include('product.productId');
        query.select(['capacity','seqNo','whorlSize','product','isSend','borrowState','stock']);
        query.find().then(function (results) {
            //results={Passage:results};
            data["Passage"]=results;
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
});

router.get('/:id/:ver', function(req, res) {
    console.log(req.params.id+" "+req.params.ver);
});
module.exports = router;

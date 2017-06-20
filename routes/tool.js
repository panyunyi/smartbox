'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ejsExcel = require("ejsexcel");
var fs = require('fs');
function exportExcel(filename, data) {
    let exlBuf = fs.readFileSync("./public/upload/powerlist.xlsx");
    //用数据源(对象)data渲染Excel模板
    ejsExcel.renderExcelCb(exlBuf, data, function (err, exlBuf2) {
        if (err) {
            console.error(err);
            return;
        }
        fs.writeFileSync("./public/upload/" + filename + ".xlsx", exlBuf2);
        console.log(filename);
    });
}
router.get('/:cusid', function (req, res) {
    let customer = AV.Object.createWithoutData('Customer', req.params.cusid);
    let powerQuery = new AV.Query('EmployeePower');
    let jsondata = [];
    powerQuery.equalTo('isDel', false);
    powerQuery.equalTo('cusId', customer);
    powerQuery.include('product');
    powerQuery.include('emp');
    powerQuery.include('cusId');
    powerQuery.count().then(function (count) {
        let num = Math.ceil(count / 1000);
        console.log(count);
        async.times(num, function (n, callback1) {
            powerQuery.limit(1000);
            powerQuery.skip(n * 1000);
            powerQuery.find().then(function (powers) {
                async.map(powers, function (power, callback2) {
                    // let cardQuery = new AV.Query('EmployeeCard');
                    // cardQuery.equalTo('isDel', false);
                    // cardQuery.equalTo('emp', power.get('emp'));
                    // cardQuery.first().then(function (card) {
                    //     if (typeof (card) != "undefined") {
                    //         let one = {
                    //             unit: power.get('unit'), product: power.get('product').get('name'), count: power.get('count'), sku: power.get('product').get('sku'),
                    //             name: power.get('emp').get('name'), empno: power.get('emp').get('empNo'), period: power.get('period'), cus: power.get('cusId').get('name'),
                    //             card: card.get('card'), oldcard: card.get('oldCard')
                    //         };
                    //         jsondata.push(one);
                    //         callback2(null, one);
                    //     } else {
                    //         let one = {
                    //             unit: power.get('unit'), product: power.get('product').get('name'), count: power.get('count'), sku: power.get('product').get('sku'),
                    //             name: power.get('emp').get('name'), empno: power.get('emp').get('empNo'), period: power.get('period'), cus: power.get('cusId').get('name'),
                    //             card: "", oldcard: ""
                    //         };
                    //         jsondata.push(one);
                    //         callback2(null, one);
                    //     }
                    // });
                    let one = {
                        unit: power.get('unit'), product: power.get('product').get('name')?power.get('product').get('name'):"", count: power.get('count'), sku: power.get('product').get('sku')?power.get('product').get('sku'):"",
                        name: power.get('emp').get('name')?power.get('emp').get('name'):"", empno: power.get('emp').get('empNo')?power.get('emp').get('empNo'):"", period: power.get('period'), cus: power.get('cusId').get('name')?power.get('cusId').get('name'):"",
                        card: "", oldcard: ""
                    };
                    jsondata.push(one);
                    callback2(null, one);
                }, function (err, arr) {
                    console.log(arr.length);
                    callback1(null, n);
                });
            });
        }, function (err, nums) {
            console.log(jsondata.length);
            customer.fetch().then(function () {
                exportExcel(customer.get('name'), jsondata);
                res.jsonp(customer.get('name'));
            });

        });
    });
});
// router.get('/', function(req, res) {
//     let empQuery=new AV.Query('Employee');
//     empQuery.equalTo('isDel',false);
//     empQuery.limit(1000);
//     empQuery.find().then(function(emps){
//         let powerQuery=new AV.Query('EmployeePower');
//         powerQuery.equalTo('isDel',false);
//         powerQuery.count().then(function(count){
//             let num=Math.ceil(count/1000);
//             let powerArr=[];
//             async.times(num,function(n,callback1){
//                 powerQuery.limit(1000);
//                 powerQuery.skip(n*1000);
//                 powerQuery.find().then(function(powers){
//                     powerArr=powerArr.concat(powers);
//                     callback1(null,1);
//                 });
//             },function(err,timesres){
//                 async.map(emps,function(emp,callback2){
//                     let emppower=[];
//                     async.map(powerArr,function(power,callback3){
//                         if(power.get('emp').id==emp.id){
//                             emppower.push(power);
//                         }
//                         callback3(null,1);
//                     },function(err,powerres){
//                         let one={"name":emp.get('name'),"empNo":emp.get('empNo'),
//                         "dept":emp.get('dept'),"power":emppower};
//                         callback2(null,one);
//                     });
//                 },function(err,empsres){
//                     res.jsonp(empsres);
//                 });
//             });
//         });
//     });
// });
// router.get('/', function(req, res) {
//     let query=new AV.Query('TakeOut');
//     query.include('card');
//     query.include('passage');
//     query.count().then(function(count){
//         let num=Math.ceil(count/1000);
//         async.times(num,function(n,callback){
//             query.limit(1000);
//             query.skip(1000*n);
//             query.find().then(function(takes){
//                 async.map(takes,function(take,callback1){
//                     take.set('cardNo',take.get('card').get('card'));
//                 },function(err,takeres){

//                 });
//             });
//         },function(err,results){

//         });
//     });
// });

// router.get('/', function(req, res) {
//     let query=new AV.Query('EmployeeCard');
//     query.equalTo('isDel',false);
//     let time=new Date('2017-04-14 23:00:00');
//     query.greaterThan('createdAt',time);
//     query.limit(1000);
//     query.find().then(function(cards){
//         async.map(cards,function(card,callback){
//             let num=card.get('card')*1;
//             //console.log(PrefixInteger(num.toString(16),6));
//             card.set('card',PrefixInteger(num.toString(16),6));
//             callback(null,card);
//         },function(err,results){
//             AV.Object.saveAll(results).then(function (results) {
//             // 成功
//                 res.jsonp(results.length);
//             }, function (error) {
//             // 异常处理
//             });
//             console.log(results.length);

//         });
//     });
// });

/*
router.get('/', function(req, res) {
    let query=new AV.Query('EmployeePower');
    query.count().then(function(count){
        let num=Math.ceil(count/1000);
        let emps=[];
        async.times(num,function(n,callback){
            query.limit(1000);
            query.skip(1000*n);
            query.find().then(function(results){
                async.map(results,function(result,callback1){
                    if(result.get('unit')=="day"&&result.get('period')==7){
                        result.set('unit','week');
                        result.set('period',1);
                        emps.push(result);
                    }
                    callback1(null,result);
                },function(err,arr){
                    callback(null,arr);
                });
            });
        },function(err,empsres){
            //console.log(emps.length);
            AV.Object.saveAll(emps).then(function (results) {
            // 成功
                res.jsonp(results.length);
            }, function (error) {
            // 异常处理
            });
        });
    });
});
*/

function PrefixInteger(num, n) {
    var len = num.toString().length;
    while (len < n) {
        num = "0" + num;
        len++;
    }
    return num;
}
module.exports = router;

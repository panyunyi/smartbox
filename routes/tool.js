'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ejsExcel = require("ejsexcel");
var fs = require('fs');
var moment = require('moment');
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
function exportExcel2(filename, data) {
    let exlBuf = fs.readFileSync("./public/upload/pasrecord.xlsx");
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
//导出某公司员工权限
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
        let cardQuery = new AV.Query('EmployeeCard');
        cardQuery.equalTo('isDel', false);
        cardQuery.equalTo('cusId', customer);
        cardQuery.limit(1000);
        cardQuery.find().then(function (cards) {
            async.times(num, function (n, callback1) {
                powerQuery.limit(1000);
                powerQuery.skip(n * 1000);
                powerQuery.ascending('emp');
                powerQuery.find().then(function (powers) {
                    async.map(powers, function (power, callback2) {
                        if (typeof (power.get('emp')) != "undefined") {
                            let jsoncard="";
                            let jsonoldcard="";
                            async.map(cards,function(card,callback3){
                                if(card.get('emp').id==power.get('emp').id){
                                    jsoncard=card.get('card');
                                    jsonoldcard=card.get('oldCard');
                                }
                                callback3(null,card);
                            },function(err,cards){
                                let one = {
                                        unit: power.get('unit'), product: power.get('product').get('name'), count: power.get('count'), sku: power.get('product').get('sku'),
                                        name: power.get('emp').get('name'), empno: power.get('emp').get('empNo'), period: power.get('period'), cus: power.get('cusId').get('name'),
                                        card: jsoncard, oldcard: jsonoldcard
                                };
                                if(power.get('emp').get('dept')=='WH'){
                                    jsondata.push(one);
                                }
                                callback2(null, one);
                            });
                            // let one = {
                            //             unit: power.get('unit'), product: power.get('product').get('name'), count: power.get('count'), sku: power.get('product').get('sku'),
                            //             name: power.get('emp').get('name'), empno: power.get('emp').get('empNo'), period: power.get('period'), cus: power.get('cusId').get('name'),
                            //             card: "", oldcard: ""
                            //         };
                            //         jsondata.push(one);
                            //         callback2(null, one);
                        } else {
                            let one = {
                                unit: power.get('unit'), product: power.get('product').get('name'), count: power.get('count'), sku: power.get('product').get('sku'),
                                name: "", empno: "", period: power.get('period'), cus: power.get('cusId').get('name'),
                                card: "", oldcard: ""
                            };
                            jsondata.push(one);
                            callback2(null, one);
                        }
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
});
//导出中化格子柜领取数量大于1的交易记录
router.get('/pasrecord/1', function (req, res) {
    let cus_id = '598143f8a22b9d006d714d40';
    /*let arr = req.params.date.split(' - ');
    let start, end;
    start = new moment(arr[0],moment.ISO_8601).startOf('days').format('YYYY-MM-DD HH:mm:ss');
    if (arr.length == 1) {
        end = new moment(arr[0],moment.ISO_8601).endOf('days').format('YYYY-MM-DD HH:mm:ss');
    } else {
        end = new moment(arr[1],moment.ISO_8601).endOf('days').format('YYYY-MM-DD HH:mm:ss');
    }*/
    let jsondata = [];
    let cus = AV.Object.createWithoutData('Customer', cus_id);
    let cusName;
    let innerQuery = new AV.Query('BoxInfo');
    innerQuery.equalTo('cusId', cus);
    innerQuery.equalTo('isDel',false);
    let takeoutQuery = new AV.Query('TakeOut');
    takeoutQuery.equalTo('isDel', false);
    takeoutQuery.equalTo('result', true);
    //takeoutQuery.greaterThanOrEqualTo('time', new Date('2018-06-10'));
    //takeoutQuery.lessThanOrEqualTo('time', new Date('2018-07-01'));
    takeoutQuery.include('product');
    takeoutQuery.include('box');
    takeoutQuery.include('box.cusId');
    takeoutQuery.include('emp');
    takeoutQuery.include('emp.cusId');
    takeoutQuery.ascending('time');
    takeoutQuery.matchesQuery('box', innerQuery);
    takeoutQuery.greaterThan('count',1);
    takeoutQuery.startsWith('passageNo','1');
    takeoutQuery.count().then(function (count) {
        console.log(count);
        let num = Math.ceil(count / 1000);
        async.times(num, function (n, callback) {
            takeoutQuery.descending('time');
            takeoutQuery.limit(1000);
            takeoutQuery.skip(1000 * n);
            takeoutQuery.find().then(function (takeouts) {
                async.map(takeouts, function (takeout, callback1) {
                    if(takeout.get('passageNo').length==3){
                        let machine = takeout.get('box').get('machine');
                        let card = "";
                        let emp = "";
                        let empNo = "";
                        let dept = "";
                        if (typeof (takeout.get('emp')) != "undefined") {
                            emp = takeout.get('emp') ? takeout.get('emp').get('name') : "";
                            empNo = takeout.get('emp') ? takeout.get('emp').get('empNo') : "";
                            dept = takeout.get('emp') ? takeout.get('emp').get('dept') : "";
                        }
                        card = takeout.get('cardNo') ? takeout.get('cardNo') : "";
                        let sku = takeout.get('product').get('sku') ? takeout.get('product').get('sku') : "";
                        let product = takeout.get('product').get('name');
                        let unit = takeout.get('product').get('unit');
                        let passage = takeout.get('passageNo') ? takeout.get('passageNo') : "";
                        console.log(passage);
                        let time = new moment(takeout.get('time')).format('YYYY-MM-DD HH:mm:ss');
                        cusName = takeout.get('box').get('cusId').get('name');
                        let count = takeout.get('count');
                        let price = takeout.get('product').get('price') * count;
                        let unitprice = takeout.get('product').get('price');
                        let onetake = {
                            "time": time, "type": "领料", "objectId": takeout.get('id'),
                            "cus": cusName, "machine": machine, "passage": passage, "count": count,
                            "product": product, "sku": sku, "unit": unit, "employee": emp,
                            "empNo": empNo, "empCard": card, "price": price.toFixed(2),
                            "unitprice": unitprice, "dept": dept ? dept : ""
                        };
                        jsondata.push(onetake);
                        callback1(null, 1);
                    }else{
                        callback1(null, 0);
                    }
                    
                }, function (err, takesres) {
                    callback(null, n);
                });
            });
        }, function (err, takeoutsres) {
            console.log(jsondata.length);
            exportExcel2(cus_id, jsondata);
            res.jsonp({ "data": jsondata});
        });
    });
});
var EmployeePower = AV.Object.extend('EmployeePower');
router.get('/', function (req, res) {
    // let cus=AV.Object.createWithoutData('Customer','5981572961ff4b0057070694');
    // let product=AV.Object.createWithoutData('Product','59816760a22b9d006d737047');
    // let query=new AV.Query('Employee');
    // query.equalTo('cusId',cus);
    // query.limit(1000);
    // query.find().then(function(results){
    //     async.map(results,function(result,callback){
    //         let emppower=new EmployeePower();
    //         emppower.set('isDel',false);
    //         emppower.set('unit','month');
    //         emppower.set('product',product);
    //         emppower.set('count',1);
    //         emppower.set('emp',result);
    //         emppower.set('period',1);
    //         emppower.set('cusId',cus);
    //         emppower.set('used',0);
    //         callback(null,emppower);
    //     },function(err,results){
    //         AV.Object.saveAll(results).then(function (results) {
    //             res.jsonp(results.length);
    //         }, function (error) {
    //         // 异常处理
    //         });
    //     });
    // });
});
//router.get('/', function (req, res) {
    // let cus=AV.Object.createWithoutData('Customer','59afa618a0bb9f00645f6501');
    // let query=new AV.Query('EmployeeCard');
    // query.equalTo('cusId',cus);
    // query.limit(1000);
    // query.find().then(function(results){
    //     AV.Object.destroyAll(results).then(function () {
    //         // 成功
    //         res.jsonp(results.length);
    //       }, function (error) {
    //         // 异常处理
    //       });
    // });
//});
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

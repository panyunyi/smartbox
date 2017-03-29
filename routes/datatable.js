'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log');
var moment=require('moment');

//管理卡
router.get('/admincard', function(req, res) {
    var resdata={};
    function promise1(callback){
        var query=new AV.Query('AdminCard');
        query.equalTo('isDel',false);
        query.find().then(function (results){
            var jsondata=[];
            async.map(results,function(result,callback1){
                var arrboxes=[];
            	async.map(result.get('box'),function(boxId,callback2){
            		var box=AV.Object.createWithoutData('BoxInfo',boxId);
            		box.fetch().then(function(data){
                        var boxdata={};
                        boxdata['id']=data.id;
                        boxdata['name']=data.get('machine');
                        arrboxes.push(boxdata);
            			callback2(null,boxdata);
            		});
            	},function(err,boxes){
               		var one={"DT_RowId":result.id,"card":result.get('card'),
                    "box":boxes};
                	jsondata.push(one);
                	callback1(null,boxes);
            	});
            },function(err,results2){
                resdata["data"]=jsondata;
                callback(null,jsondata);
            });
        });
    }
    function promise2(callback){
        var query=new AV.Query('BoxInfo');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback1){
                result.set('label',result.get('machine'));
                result.set('value',result.id);
                callback1(null,result);
            },function(err,data){
                data={"box[].id":data};
                resdata["options"]=data;
                callback(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            res.jsonp(resdata);
    });
});
//增加管理卡
var AdminCard = AV.Object.extend('AdminCard');
router.post('/admincard/add',function(req,res){
    var arr=req.body;
    var admincard=new AdminCard();
    var box=[];
    var boxarr=[];
    admincard.set('card',arr['data[0][card]']);
    async.times(arr['data[0][box-many-count]']*1,function(i,callback){
        var boxdata={};
        box.push(arr['data[0][box]['+i+'][id]']);
        boxdata['id']=arr['data[0][box]['+i+'][id]'];
        var boxObj=AV.Object.createWithoutData('BoxInfo', arr['data[0][box]['+i+'][id]']);
        boxObj.fetch().then(function(){
            boxdata['name']=boxObj.get('machine');
            boxarr.push(boxdata);
            callback(null,boxdata);
        });
    },function(err,results){
        admincard.set('box',box);
        admincard.save().then(function(ac){
            var data=[];
            ac.set('DT_RowId',ac.id);
            ac.set('box',boxarr);
            data.push(ac);
            res.jsonp({"data":data});
        });
    });
});
//更新管理卡
router.put('/admincard/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var admincard = AV.Object.createWithoutData('AdminCard', id);
    var box=[];
    var boxarr=[];
    admincard.set('card',arr['data['+id+'][card]']);
    async.times(arr['data['+id+'][box-many-count]']*1,function(i,callback){
        var boxdata={};
        box.push(arr['data['+id+'][box]['+i+'][id]']);
        boxdata['id']=arr['data['+id+'][box]['+i+'][id]'];
        var boxObj=AV.Object.createWithoutData('BoxInfo', arr['data['+id+'][box]['+i+'][id]']);
        boxObj.fetch().then(function(){
            boxdata['name']=boxObj.get('machine');
            boxarr.push(boxdata);
            callback(null,boxdata);
        });
    },function(err,results){
        admincard.set('box',box);
        admincard.save().then(function(ac){
            var data=[];
            ac.set('DT_RowId',ac.id);
            ac.set('box',boxarr);
            data.push(ac);
            res.jsonp({"data":data});
        });
    });
});
//删除管理卡
router.delete('/admincard/remove/:id',function(req,res){
    var id=req.params.id;
    var admincard = AV.Object.createWithoutData('AdminCard', id);
    admincard.set('isDel',true);
    admincard.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//客户
router.get('/customer',function(req,res){
    var query=new AV.Query('Customer');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        async.map(results,function(result,callback){
            result.set('DT_RowId',result.id);
            result.set('name',result.get('name')?result.get('name'):"");
            result.set('connecter',result.get('connecter')?result.get('connecter'):"");
            result.set('connectPhone',result.get('connectPhone')?result.get('connectPhone'):"");
            result.set('province',result.get('province')?result.get('province'):"");
            result.set('city',result.get('city')?result.get('city'):"");
            result.set('area',result.get('area')?result.get('area'):"");
            result.set('address',result.get('address')?result.get('address'):"");
            callback(null,result);
        },function(err,data){
            res.jsonp({"data":data});
        });
    });
});
//增加客户
var Customer = AV.Object.extend('Customer');
router.post('/customer/add',function(req,res){
    var arr=req.body;
    var customer=new Customer();
    customer.set('name',arr['data[0][name]']);
    customer.set('connecter',arr['data[0][connecter]']);
    customer.set('connectPhone',arr['data[0][connectPhone]']);
    customer.set('province',arr['data[0][province]']);
    customer.set('city',arr['data[0][city]']);
    customer.set('area',arr['data[0][area]']);
    customer.set('address',arr['data[0][address]']);
    customer.set('isDel',false);
    customer.save().then(function(cus){
        var data=[];
        cus.set('DT_RowId',cus.id);
        data.push(cus);
        res.jsonp({"data":data});
    });
});
//更新客户资料
router.put('/customer/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var customer = AV.Object.createWithoutData('Customer', id);
    customer.set('name',arr['data['+id+'][name]']);
    customer.set('connecter',arr['data['+id+'][connecter]']);
    customer.set('connectPhone',arr['data['+id+'][connectPhone]']);
    customer.set('province',arr['data['+id+'][province]']);
    customer.set('city',arr['data['+id+'][city]']);
    customer.set('area',arr['data['+id+'][area]']);
    customer.set('address',arr['data['+id+'][address]']);
    customer.save().then(function(cus){
        var data=[];
        cus.set('DT_RowId',cus.id);
        data.push(cus);
        res.jsonp({"data":data});
    });
});
//删除客户资料
router.delete('/customer/remove/:id',function(req,res){
    var id=req.params.id;
    var customer = AV.Object.createWithoutData('Customer', id);
    customer.set('isDel',true);
    customer.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//产品
router.get('/product',function(req,res){
    var resdata={};
    function promise1(callback1){
        var query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.include('type');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('DT_RowId',result.id);
                result.set('typeId',result.get('type').id);
                result.set('type',result.get('type')?result.get('type').get('name'):"");
                result.set('price',result.get('price'));
                result.set('spec',result.get('spec')?result.get('spec'):"");
                result.set('sku',result.get('sku')?result.get('sku'):"");
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        var query=new AV.Query('Assortment');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                data={"assort":data};
                resdata["options"]=data;
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            res.jsonp(resdata);
    });
});
//增加产品
var Product = AV.Object.extend('Product');
router.post('/product/add',function(req,res){
    var arr=req.body;
    var product=new Product();
    product.set('name',arr['data[0][name]']);
    product.set('unit',arr['data[0][unit]']);
    var type=AV.Object.createWithoutData('Assortment', arr['data[0][assort]']);
    product.set('type',type);
    product.set('stockDays',arr['data[0][stockDays]']?arr['data[0][stockDays]']*1:1);
    product.set('spec',arr['data[0][spec]']);
    product.set('cue',arr['data[0][cue]']?arr['data[0][cue]']*1:0);
    product.set('price',arr['data[0][price]']?arr['data[0][price]']*1:0);
    product.set('warning',arr['data[0][warning]']?arr['data[0][warning]']*1:0);
    product.set('sku',arr['data[0][sku]']);
    product.set('isDel',false);
    product.save().then(function(pro){
        var data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('typeId',pro.get('type').id);
        pro.set('price',pro.get('price'));
        pro.set('spec',pro.get('spec')?pro.get('spec'):"");
        type.fetch().then(function(){
            pro.set('type',type.get('name'));
            data.push(pro);
            res.jsonp({"data":data});
        });
    },function(error){
        console.log(error);
    });
});
//更新产品资料
router.put('/product/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var product = AV.Object.createWithoutData('Product', id);
    product.set('name',arr['data['+id+'][name]']);
    product.set('unit',arr['data['+id+'][unit]']);
    var type=AV.Object.createWithoutData('Assortment', arr['data['+id+'][assort]']);
    product.set('type',type);
    product.set('stockDays',arr['data['+id+'][stockDays]']*1);
    product.set('spec',arr['data['+id+'][spec]']);
    product.set('cue',arr['data['+id+'][cue]']*1);
    product.set('price',arr['data['+id+'][price]']*1);
    product.set('warning',arr['data['+id+'][warning]']*1);
    product.set('sku',arr['data['+id+'][sku]']);
    product.set('isDel',false);
    product.save().then(function(pro){
        var data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('typeId',pro.get('type').id);
        pro.set('price',pro.get('price'));
        pro.set('spec',pro.get('spec')?pro.get('spec'):"");
        type.fetch().then(function(){
            pro.set('type',type.get('name'));
            data.push(pro);
            res.jsonp({"data":data});
        });
    });
});
//删除产品
router.delete('/product/remove/:id',function(req,res){
    var id=req.params.id;
    var product = AV.Object.createWithoutData('Product', id);
    product.set('isDel',true);
    product.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//产品分类
router.get('/category',function(req,res){
    var query=new AV.Query('Assortment');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('DT_RowId',result.id);
        });
        res.jsonp({"data":results});
    });
});
//增加产品分类
var Assortment = AV.Object.extend('Assortment');
router.post('/category/add',function(req,res){
    var arr=req.body;
    var assortment=new Assortment();
    assortment.set('name',arr['data[0][name]']);
    assortment.set('isDel',false);
    assortment.save().then(function(ass){
        var data=[];
        ass.set('DT_RowId',ass.id);
        data.push(ass);
        res.jsonp({"data":data});
    });
});
//更新产品分类
router.put('/category/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var assortment = AV.Object.createWithoutData('Assortment', id);
    assortment.set('name',arr['data['+id+'][name]']);
    assortment.save().then(function(ass){
        var data=[];
        ass.set('DT_RowId',ass.id);
        data.push(ass);
        res.jsonp({"data":data});
    });
});
//删除产品分类
router.delete('/category/remove/:id',function(req,res){
    var id=req.params.id;
    var assortment = AV.Object.createWithoutData('Assortment', id);
    assortment.set('isDel',true);
    assortment.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//客户产品管理
router.get('/customerProduct',function(req,res){
    var resdata={};
    function promise1(callback1){
        var query=new AV.Query('CustomerProduct');
        query.equalTo('isDel',false);
        query.include('product');
        query.include('cusId');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('DT_RowId',result.id);
                result.set('sku',result.get('product').get('sku'));
                result.set('productId',result.get('product').id);
                result.set('product',result.get('product').get('name'));
                result.set('cus',result.get('cusId').get('name'));
                result.set('cusId',result.get('cusId').id);
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        var query=new AV.Query('Customer');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    function promise3(callback1){
        var query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
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
        }],function(err,results){
            resdata["options"]=Object.assign({"cusId":results[1]},{"productId":results[2]});
            res.jsonp(resdata);
    });
});
//增加客户产品
var CusProduct = AV.Object.extend('CustomerProduct');
router.post('/cusproduct/add',function(req,res){
    var arr=req.body;
    var product=new CusProduct();
    product.set('cusProductPrice',arr['data[0][cusProductPrice]']*1);
    let proobj=AV.Object.createWithoutData('Product', arr['data[0][productId]']);
    product.set('product',proobj);
    let cus=AV.Object.createWithoutData('Customer', arr['data[0][cusId]']);
    product.set('cusId',cus);
    product.set('isDel',false);
    product.save().then(function(pro){
        var data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('cusId',pro.get('cusId').id);
        pro.set('productId',pro.get('product').id);
        proobj.fetch().then(function(){
            pro.set('product',proobj.get('name'));
            pro.set('sku',proobj.get('sku'));
            cus.fetch().then(function(){
                pro.set('cus',cus.get('name'));
                data.push(pro);
                res.jsonp({"data":data});
            });
        });
    },function(error){
        console.log(error);
    });
});
//更新客户产品资料
router.put('/cusproduct/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    var product = AV.Object.createWithoutData('CustomerProduct', id);
    product.set('cusProductPrice',arr['data['+id+'][cusProductPrice]']*1);
    let proobj=AV.Object.createWithoutData('Product', arr['data['+id+'][productId]']);
    product.set('product',proobj);
    let cus=AV.Object.createWithoutData('Customer', arr['data['+id+'][cusId]']);
    product.set('cusId',cus);
    product.set('isDel',false);
    product.save().then(function(pro){
        var data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('cusId',pro.get('cusId').id);
        pro.set('productId',pro.get('product').id);
        proobj.fetch().then(function(){
            pro.set('product',proobj.get('name'));
            pro.set('sku',proobj.get('sku'));
            cus.fetch().then(function(){
                pro.set('cus',cus.get('name'));
                data.push(pro);
                res.jsonp({"data":data});
            });
        });
    },function(error){
        console.log(error);
    });
});
//删除客户产品
router.delete('/cusproduct/remove/:id',function(req,res){
    var id=req.params.id;
    var cusproduct = AV.Object.createWithoutData('CustomerProduct', id);
    cusproduct.set('isDel',true);
    cusproduct.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//员工卡列表
router.get('/cardlist/:id',function(req,res){
    let id=req.params.id;
    let resdata={};
    let empObj=AV.Object.createWithoutData('Employee', id);
    function promise1(callback){
        empObj.fetch().then(function(){
            let query=new AV.Query('EmployeeCard');
            query.equalTo('isDel',false);
            query.equalTo('emp',null);
            query.equalTo('cusId',empObj.get('cusId'));
            query.find().then(function(result){
                callback(null,result);
            });
        });
    }
    function promise2(callback){
        let cardQuery=new AV.Query('EmployeeCard');
        cardQuery.equalTo('isDel',false);
        cardQuery.equalTo('emp',empObj);
        cardQuery.find().then(function(result){
            callback(null,result);
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            resdata["card"]=results[0];
            resdata["have"]=results[1];
            res.jsonp(resdata);
    });
});
//员工卡
router.get('/empCard',function(req,res){
    let resdata={};
    function promise1(callback){
        let query=new AV.Query('EmployeeCard');
        query.equalTo('isDel',false);
        query.equalTo('emp',null);
        query.include('cusId');
        query.find().then(function(results){
            results.forEach(function(result){
                result.set('DT_RowId',result.id);
                result.set('cus',result.get('cusId').get('name'));
                result.set('cusId',result.get('cusId').id);
            });
            callback(null,results);
        });
    }
    function promise2(callback1){
        let query=new AV.Query('Customer');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            resdata["data"]=results[0];
            resdata["options"]={"cusId":results[1]};
            res.jsonp(resdata);
    });
});
//增加员工卡
var EmpCard = AV.Object.extend('EmployeeCard');
router.post('/empCard/add',function(req,res){
    var arr=req.body;
    var employee=new EmpCard();
    employee.set('card',arr['data[0][card]']);
    let cus=AV.Object.createWithoutData('Customer', arr['data[0][cusId]']);
    employee.set('cusId',cus);
    employee.set('isDel',false);
    employee.save().then(function(emp){
        var data=[];
        emp.set('DT_RowId',emp.id);
        cus.fetch().then(function(c){
            emp.set('cus',c.get('name'));
            data.push(emp);
            res.jsonp({"data":data});
        });
    },function(error){
        console.log(error);
    });
});
//更新员工卡'+id+'
router.put('/empCard/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let employee = AV.Object.createWithoutData('EmployeeCard', id);
    employee.set('card',arr['data['+id+'][card]']);
    let cus=AV.Object.createWithoutData('Customer', arr['data['+id+'][cusId]']);
    employee.set('cusId',cus);
    employee.set('isDel',false);
    employee.save().then(function(emp){
        var data=[];
        emp.set('DT_RowId',emp.id);
        cus.fetch().then(function(c){
            emp.set('cus',c.get('name'));
            data.push(emp);
            res.jsonp({"data":data});
        });
    },function(error){
        console.log(error);
    });
});
//删除员工卡
router.delete('/empCard/remove/:id',function(req,res){
    var id=req.params.id;
    var employee = AV.Object.createWithoutData('EmployeeCard', id);
    employee.set('isDel',true);
    employee.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//客户员工
router.get('/employee',function(req,res){
    let resdata={};
    function promise1(callback){
        let query=new AV.Query('Employee');
        query.include('cusId');
        query.equalTo('isDel',false);
        query.limit(1000);
        query.find().then(function(results){
            function cardPromise(callback3){
                let cardQuery=new AV.Query('EmployeeCard');
                cardQuery.equalTo('isDel',false);
                cardQuery.equalTo('cusId',results[0].get('cusId'));
                cardQuery.limit(1000);
                cardQuery.find().then(function(cards){
                    callback3(null,cards);
                });
            }
            function resultsPromise(cards,callback3){
                async.map(results,function(result,callback1){
                    result.set('DT_RowId',result.id);
                    result.set('isDel',result.get('isDel')?"停用":"启用");
                    result.set('sex',result.get('sex'));
                    result.set('cus',result.get('cusId').get('name'));
                    result.set('cusId',result.get('cusId').id);
                    result.set('job',result.get('job')?result.get('job'):"");
                    result.set('phone',result.get('phone')?result.get('phone'):"");
                    result.set('notice',result.get('notice')?result.get('notice'):"");
                    result.set('dept',result.get('dept')?result.get('dept'):"");
                    let arr=[];
                    async.map(cards,function(card,callback2){
                        if(card.get('emp').id==result.id){
                            arr.push(card.get('card'));
                            callback2(null,1);
                        }else {
                            callback2(null,0);
                        }
                    },function(err,cardsdata){
                        result.set('card',arr);
                        callback1(null,result);
                    });
                },function(err,data){
                    resdata["data"]=data;
                    callback3(null,data);
                });
            }
            async.waterfall([
                function (callback3){
                    cardPromise(callback3);
                },
                function(cards,callback3){
                    resultsPromise(cards,callback3);
                }
            ],function(err,results){
                callback(null,results);
            });
        });
    }
    function promise2(callback1){
        let query=new AV.Query('Customer');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            resdata["options"]=Object.assign({"cusId":results[1]});
            res.jsonp(resdata);
    });
});
//增加员工
var Employee = AV.Object.extend('Employee');
router.post('/employee/add',function(req,res){
    let arr=req.body;
    let employee=new Employee();
    employee.set('empNo',arr['data[0][empNo]']);
    employee.set('name',arr['data[0][name]']);
    employee.set('sex',arr['data[0][sex]']*1);
    employee.set('job',arr['data[0][job]']);
    employee.set('phone',arr['data[0][phone]']);
    employee.set('dept',arr['data[0][dept]']);
    employee.set('notice',arr['data[0][notice]']);
    let cards=arr['data[0][card]'].split(',');
    let cus=AV.Object.createWithoutData('Customer', arr['data[0][cusId]']);
    employee.set('cusId',cus);
    employee.set('isDel',false);
    employee.save().then(function(emp){
        let data=[];
        let cardArr=[];
        let errArr=[];
        async.map(cards,function(card,callback){
            if(card!==null&&card!==undefined&&card!==''){
                let cardQuery=new AV.Query('EmployeeCard');
                cardQuery.equalTo('isDel',false);
                cardQuery.equalTo('card',card);
                cardQuery.count().then(function(count){
                    if(count==0){
                        let cardObj=new EmpCard();
                        cardObj.set('cusId',cus);
                        cardObj.set('card',card);
                        cardObj.set('emp',emp);
                        cardObj.save().then(function(ca){
                            cardArr.push(card);
                            callback(null,1);
                        });
                    }else {
                        emp.set('isDel',true);
                        emp.save();
                        errArr.push({"name":"card","status":card+"已存在"});
                        callback(null,0);
                    }
                });
            }else {
                callback(null,0);
            }
        },function(err,results){
            emp.set('card',cardArr);
            emp.set('DT_RowId',emp.id);
            cus.fetch().then(function(c){
                emp.set('cus',c.get('name'));
                data.push(emp);
                if(errArr.length>0){
                    res.jsonp({"data":data,"fieldErrors":errArr});
                }else {
                    res.jsonp({"data":data});
                }
            });
        });
    },function(error){
        console.log(error);
    });
});
//更新员工'+id+'
router.put('/employee/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let employee = AV.Object.createWithoutData('Employee', id);
    employee.set('empNo',arr['data['+id+'][empNo]']);
    employee.set('name',arr['data['+id+'][name]']);
    employee.set('sex',arr['data['+id+'][sex]']*1);
    employee.set('job',arr['data['+id+'][job]']);
    employee.set('phone',arr['data['+id+'][phone]']);
    employee.set('dept',arr['data['+id+'][dept]']);
    employee.set('notice',arr['data['+id+'][notice]']);
    let cards=arr['data['+id+'][card]'].split(',');
    let cus=AV.Object.createWithoutData('Customer', arr['data['+id+'][cusId]']);
    employee.set('cusId',cus);
    employee.set('isDel',false);
    employee.save().then(function(emp){
        let data=[];
        let cardArr=[];
        let errArr=[];
        async.map(cards,function(card,callback){
            if(card!==null&&card!==undefined&&card!==''){
                let cardQuery=new AV.Query('EmployeeCard');
                cardQuery.equalTo('isDel',false);
                cardQuery.equalTo('card',card);
                cardQuery.count().then(function(count){
                    if(count==0){
                        let cardObj=new EmpCard();
                        cardObj.set('cusId',cus);
                        cardObj.set('card',card);
                        cardObj.set('emp',emp);
                        cardObj.save().then(function(ca){
                            cardArr.push(card);
                            callback(null,1);
                        });
                    }
                });
            }else {
                callback(null,0);
            }
        },function(err,results){
            emp.set('card',cardArr);
            emp.set('DT_RowId',emp.id);
            cus.fetch().then(function(c){
                emp.set('cus',c.get('name'));
                data.push(emp);
                if(errArr.length>0){
                    res.jsonp({"data":data,"fieldErrors":errArr});
                }else {
                    res.jsonp({"data":data});
                }
            });
        });
    },function(error){
        console.log(error);
    });
});
//删除员工
router.delete('/employee/remove/:id',function(req,res){
    var id=req.params.id;
    var employee = AV.Object.createWithoutData('Employee', id);
    employee.set('isDel',true);
    employee.save().then(function(emp){
        let cardQuery=new AV.Query('EmployeeCard');
        cardQuery.equalTo('isDel',false);
        cardQuery.equalTo('emp',emp);
        cardQuery.find().then(function(cards){
            async.map(cards,function(card,callback){
                card.set('isDel',true);
                callback(null,card);
            },function(err,results){
                AV.Object.saveAll(cards);
            });
        }).then(function(cards){
            res.jsonp({"data":[]});
        },function(err){
            console.log(err);
        });
    });
});

//根据员工id获取权限列表
router.get('/powerlist/:id',function(req,res){
    let resdata={};
    let id=req.params.id;
    let powerarr=[];
    let havearr=[];
    function promise1(callback){
        let empObj=AV.Object.createWithoutData('Employee', id);
        empObj.fetch().then(function(){
            let boxQuery=new AV.Query('BoxInfo');
            boxQuery.equalTo('isDel',false);
            boxQuery.equalTo('cusId',empObj.get('cusId'));
            boxQuery.find().then(function(boxes){
                let empPowerQuery=new AV.Query('EmployeePower');
                empPowerQuery.equalTo('isDel',false);
                empPowerQuery.ascending('dept');
                empPowerQuery.find().then(function(emppowers){
                    async.map(boxes,function(box,callback1){
                        async.map(emppowers,function(emppower,callback2){
                            if(emppower.get('boxId').id==box.id){
                                powerarr.push({"dept":emppower.get('dept'),
                                "objectId":emppower.id});
                                callback2(null,emppower.get('dept'));
                            }
                        },function(err,results){
                            callback1(null,results);
                        });
                    },function(err,results){
                        callback(null,results);
                    });
                });
            });
        });
    }
    function promise2(callback){
        let empObj=AV.Object.createWithoutData('Employee', id);
        empObj.fetch().then(function(){
            async.map(empObj.get('power'),function(powerid,callback1){
                let powerObj=AV.Object.createWithoutData('EmployeePower', powerid);
                powerObj.fetch().then(function(){
                    havearr.push({"dept":powerObj.get('dept'),"objectId":powerObj.id});
                    callback1(null,powerObj.get('dept'));
                });
            },function(err,results){
                callback(null,results);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            resdata['power']=powerarr;
            resdata['have']=havearr;
            res.jsonp(resdata);
    });
});
//员工权限
router.get('/empPower/:id',function(req,res){
    function promise1(callback){
        let id=req.params.id;
        let emp=AV.Object.createWithoutData('EmployeeCard',id);
        let query=new AV.Query('EmployeePower');
        query.include('product');
        query.equalTo('emp',emp);
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback1){
                result.set('DT_RowId',result.id);
                result.set('sku',result.get('product').get('sku'));
                result.set('product',result.get('product').get('name'));
                result.set('productId',result.get('product').id);
                let unit="";
                if(result.get('unit')=="month"){
                    unit="月";
                }else if(result.get('unit')=="day"){
                    unit="日";
                }else if(result.get('unit')=="week"){
                    unit="周";
                }
                result.set('unit',unit);
                callback1(null,result);
            },function(err,data){
                callback(null,data);
            });
        });
    }
    function promise2(callback1){
        var query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            res.jsonp({"data":results[0],"options":{"productId":results[1]}});
    });
});
//新增权限
var EmpPower = AV.Object.extend('EmployeePower');
router.post('/empPower/add',function(req,res){
    let arr=req.body;
    let power=new EmpPower();
    power.set('unit',arr['data[0][unit]']);
    power.set('count',arr['data[0][count]']*1);
    power.set('period',arr['data[0][period]']*1);
    let emp=AV.Object.createWithoutData('Employee', arr['data[0][emp]']);
    let cus=AV.Object.createWithoutData('Customer', arr['data[0][cus]']);
    let product=AV.Object.createWithoutData('Product', arr['data[0][productId]']);
    power.set('emp',emp);
    power.set('cusId',cus);
    power.set('product',product);
    power.set('isDel',false);
    power.save().then(function(emppower){
        let data=[];
        emppower.set('DT_RowId',emppower.id);
        let unit="";
        if(emppower.get('unit')=="month"){
            unit="月";
        }else if(emppower.get('unit')=="day"){
            unit="日";
        }else if(emppower.get('unit')=="year"){
            unit="年";
        }
        emppower.set('unit',unit);
        product.fetch().then(function(p){
            emppower.set('productId',p.id);
            emppower.set('sku',p.get('sku'));
            emppower.set('product',p.get('name'));
            cus.fetch().then(function(c){
                emppower.set('cus',c.get('name'));
                emppower.set('cusId',c);
                data.push(emppower);
                res.jsonp({"data":data});
            });
        });
    },function(error){
        console.log(error);
    });
});
//更新员工权限'+id+'
router.put('/empPower/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let power = AV.Object.createWithoutData('EmployeePower', id);
    power.set('unit',arr['data['+id+'][unit]']);
    power.set('count',arr['data['+id+'][count]']*1);
    power.set('period',arr['data['+id+'][period]']*1);
    let product=AV.Object.createWithoutData('Product', arr['data['+id+'][productId]']);
    power.set('product',product);
    power.set('isDel',false);
    power.save().then(function(emppower){
        let data=[];
        emppower.set('DT_RowId',emppower.id);
        let unit="";
        if(emppower.get('unit')=="month"){
            unit="月";
        }else if(emppower.get('unit')=="day"){
            unit="日";
        }else if(emppower.get('unit')=="year"){
            unit="年";
        }
        emppower.set('unit',unit);
        product.fetch().then(function(p){
            emppower.set('productId',p.id);
            emppower.set('sku',p.get('sku'));
            emppower.set('product',p.get('name'));
            data.push(emppower);
            res.jsonp({"data":data});
        });
    },function(error){
        console.log(error);
    });
});
//删除权限
router.delete('/empPower/remove/:id',function(req,res){
    var id=req.params.id;
    var employee = AV.Object.createWithoutData('EmployeePower', id);
    employee.set('isDel',true);
    employee.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//售货机管理
router.get('/box',function(req,res){
    var resdata={};
    function promise1(callback1){
        var query=new AV.Query('BoxInfo');
        query.equalTo('isDel',false);
        query.include('cusId');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('cusId',result.get('cusId').get('name'));
                result.set('DT_RowId',result.id);
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        var query=new AV.Query('Customer');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            resdata["options"]={"cusId":results[1]};
            res.jsonp(resdata);
    });
});
//增加售货机
var Box = AV.Object.extend('BoxInfo');
router.post('/box/add',function(req,res){
    var arr=req.body;
    var box=new Box();
    box.set('address',arr['data[0][address]']);
    box.set('machine',arr['data[0][machine]']);
    box.set('deviceId',arr['data[0][deviceId]']);
    let cus=AV.Object.createWithoutData('Customer', arr['data[0][cusId]']);
    box.set('cusId',cus);
    let version=AV.Object.createWithoutData('Update','585cd8dc61ff4b00688dc4e4');
    box.set('version',version);
    box.set('model',arr['data[0][model]']);
    box.set('type',arr['data[0][issend]']*1?"螺纹柜":"格子柜");
    box.set('issend',arr['data[0][issend]']*1);
    box.set('child',arr['data[0][child]']*1);
    box.set('connecter',arr['data[0][connecter]']);
    box.set('conPhone',arr['data[0][conPhone]']);
    box.set('state',arr['data[0][state]']?arr['data[0][state]']:"可用");
    box.set('isLive',false);
    box.set('isDel',false);
    box.save().then(function(b){
        var data=[];
        b.set('DT_RowId',b.id);
        cus.fetch().then(function(c){
            b.set('cusId',c.get('name'));
            data.push(b);
            res.jsonp({"data":data});
        },function(err){
            console.log(err);
        });
    },function(err){
        console.log(err);
    });
});
//更新售货机
router.put('/box/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var box = AV.Object.createWithoutData('BoxInfo', id);
    box.set('address',arr['data['+id+'][address]']);
    box.set('machine',arr['data['+id+'][machine]']);
    box.set('deviceId',arr['data['+id+'][deviceId]']);
    let cus=AV.Object.createWithoutData('Customer', arr['data['+id+'][cusId]']);
    box.set('cusId',cus);
    let version=AV.Object.createWithoutData('Update','585cd8dc61ff4b00688dc4e4');
    box.set('version',version);
    box.set('model',arr['data['+id+'][model]']);
    box.set('type',arr['data['+id+'][issend]']*1?"螺纹柜":"格子柜");
    box.set('issend',arr['data['+id+'][issend]']*1);
    box.set('child',arr['data['+id+'][child]']*1);
    box.set('connecter',arr['data['+id+'][connecter]']);
    box.set('conPhone',arr['data['+id+'][conPhone]']);
    box.set('state',arr['data['+id+'][state]']?arr['data['+id+'][state]']:"可用");
    box.set('isLive',false);
    box.set('isDel',false);
    box.save().then(function(b){
        var data=[];
        b.set('DT_RowId',b.id);
        cus.fetch().then(function(c){
            b.set('cusId',c.get('name'));
            data.push(b);
            res.jsonp({"data":data});
        },function(err){
            console.log(err);
        });
    },function(err){
        console.log(err);
    });
});
//删除售货机
router.delete('/box/remove/:id',function(req,res){
    let id=req.params.id;
    let box = AV.Object.createWithoutData('BoxInfo', id);
    box.set('isDel',true);
    box.save().then(function(){
        function promise1(callback){
            let passageQuery=new AV.Query('Passage');
            passageQuery.equalTo('isDel',false);
            passageQuery.equalTo('boxId',box);
            passageQuery.find().then(function(results){
                results.map(function(result){
                    result['isDel']=false;
                });
                AV.Object.saveAll(results);
            }).then(function(){
                callback(null,1);
            });
        }
        function promise2(callback){
            let boxProductQuery=new AV.Query('BoxProduct');
            boxProductQuery.equalTo('isDel',false);
            boxProductQuery.equalTo('boxId',box);
            boxProductQuery.find().then(function(results){
                results.map(function(result){
                    result['isDel']=false;
                });
                AV.Object.saveAll(results);
            }).then(function(){
                callback(null,1);
            });
        }
        async.parallel([
            function (callback){
                promise1(callback);
            },
            function (callback){
                promise2(callback);
            }],function(err,results){
                res.jsonp({"data":[]});
        });
    });
});
//货道配置
router.get('/passage/:id',function(req,res){
    let resdata={};
    let arr=['A','B','C','D','E','F','G','H','I','J','L'];
    function promise1(callback1) {
        let id=req.params.id;
        let box=AV.Object.createWithoutData('BoxInfo', id);
        let query=new AV.Query('Passage')
        query.include('boxId');
        query.include('product');
        query.equalTo('boxId',box);
        query.equalTo('isDel',false);
        query.ascending('seqNo');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('DT_RowId',result.id);
                result.set('machine',result.get('boxId').get('machine'));
                result.set('boxId',result.get('boxId').id);
                result.set('type',result.get('type')?result.get('type'):"");
                result.set('sku',result.get('product').get('sku')?result.get('product').get('sku'):"");
                result.set('productId',result.get('product').id);
                result.set('product',result.get('product').get('name'));
                result.set('seqNo',result.get('seqNo'));
                result.set('child',result.get('flag')*1>0?arr[result.get('flag')*1-1]:"");
                result.set('childId',result.get('flag')*1);
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        let query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.ascending('sku');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('sku')+" "+result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    function promise3(callback1){
        let id=req.params.id;
        let box=AV.Object.createWithoutData('BoxInfo', id);
        box.fetch().then(function(result){
            let count=result.get('child');
            async.timesSeries(count,function(i,callback){
                let child={};
                child['label']=arr[i];
                child['value']=i+1;
                callback(null,child);
            },function(err,data){
                data.splice(0,0,{'label':'无','value':0});
                callback1(null,data);
            });
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
        }],function(err,results){
            resdata["options"]=Object.assign({"productId":results[1]},
            {"childId":results[2]});
            res.jsonp(resdata);
    });
});
//增加货道
var Passage = AV.Object.extend('Passage');
var BoxProduct=AV.Object.extend('BoxProduct');
router.post('/passage/add',function(req,res){
    let flag=['A','B','C','D','E','F','G','H','I','J','L'];
    let arr=req.body;
    let passage=new Passage();
    passage.set('capacity',arr['data[0][capacity]']*1);
    let product=AV.Object.createWithoutData('Product', arr['data[0][productId]']);
    passage.set('product',product);
    passage.set('row',arr['data[0][seqNo]'].substr(0,1)*1);
    passage.set('col',arr['data[0][seqNo]'].substr(1)*1);
    passage.set('state',arr['data[0][state]']*1?true:false);
    passage.set('seqNo',arr['data[0][seqNo]']);
    passage.set('borrowState',false);
    passage.set('stock',0);
    passage.set('isSend',arr['data[0][isSend]']*1?true:false);
    passage.set('flag',arr['data[0][childId]']>0?arr['data[0][childId]']:"");
    passage.set('type',arr['data[0][childId]']>0?"格子柜":"螺纹柜");
    let box=AV.Object.createWithoutData('BoxInfo', arr['data[0][boxId]']);
    passage.set('boxId',box);
    passage.set('isDel',false);
    function promise1(callback){
        let boxProductQuery=new AV.Query('BoxProduct');
        boxProductQuery.equalTo('isDel',false);
        boxProductQuery.equalTo('boxId',box);
        boxProductQuery.equalTo('productId',product);
        boxProductQuery.count().then(function(count){
            if(count==0){
                let boxpro=new BoxProduct();
                boxpro.set('isDel',false);
                boxpro.set('boxId',box);
                boxpro.set('productId',product);
                boxpro.set('stockDays',0);
                boxpro.set('warning',0);
                boxpro.set('cue',0);
                boxpro.save().then(function(data){
                    callback(null,data);
                });
            }else{
                callback(null,0);
            }
        });
    }
    function promise2(callback){
        box.fetch().then(function(b){
            let cusProQuery=new AV.Query('CustomerProduct');
            cusProQuery.equalTo('isDel',false);
            cusProQuery.equalTo('product',product);
            cusProQuery.equalTo('cusId',b.get('cusId'));
            cusProQuery.first().then(function(cuspro){
                passage.set('customerProduct',cuspro);
                passage.save().then(function(p){
                    let data=[];
                    p.set('DT_RowId',p.id);
                    p.set('machine',b.get('machine'));
                    p.set('boxId',b.id);
                    p.set('type',p.get('type')?p.get('type'):"");
                    p.set('child',p.get('flag')*1>0?flag[p.get('flag')*1-1]:"");
                    p.set('childId',p.get('flag')*1);
                    product.fetch().then(function(pro){
                        p.set('productId',pro.id);
                        p.set('product',pro.get('name'));
                        p.set('sku',pro.get('sku'));
                        data.push(p);
                        callback(null,data);
                    });
                },function(err){
                    console.log(err);
                });
            });
        });
    }
    async.parallel([
        function(callback){
            promise1(callback);
        },
        function (callback) {
            promise2(callback);
        }
    ],function(err,results){
        res.jsonp({"data":results[1]});
    });
});
//更新货道'+id+'
router.put('/passage/edit/:id',function(req,res){
    let flag=['A','B','C','D','E','F','G','H','I','J','L'];
    var arr=req.body;
    var id=req.params.id;
    var passage = AV.Object.createWithoutData('Passage', id);
    passage.set('capacity',arr['data['+id+'][capacity]']*1);
    let product=AV.Object.createWithoutData('Product', arr['data['+id+'][productId]']);
    passage.set('product',product);
    passage.set('row',arr['data['+id+'][seqNo]'].substr(0,1)*1);
    passage.set('col',arr['data['+id+'][seqNo]'].substr(1)*1);
    passage.set('state',arr['data['+id+'][state]']*1?true:false);
    passage.set('seqNo',arr['data['+id+'][seqNo]']);
    passage.set('isSend',arr['data['+id+'][isSend]']*1?true:false);
    passage.set('flag',arr['data['+id+'][childId]']>0?arr['data['+id+'][childId]']:"");
    passage.set('type',arr['data['+id+'][childId]']>0?"格子柜":"螺纹柜");
    let boxQuery=new AV.Query('BoxInfo');
    boxQuery.get(arr['data['+id+'][boxId]']).then(function(b){
        function promise1(callback){
            let boxProductQuery=new AV.Query('BoxProduct');
            boxProductQuery.equalTo('isDel',false);
            boxProductQuery.equalTo('boxId',b);
            boxProductQuery.equalTo('productId',product);
            boxProductQuery.count().then(function(count){
                if(count==0){
                    let boxpro=new BoxProduct();
                    boxpro.set('isDel',false);
                    boxpro.set('boxId',b);
                    boxpro.set('productId',product);
                    boxpro.set('stockDays',0);
                    boxpro.set('warning',0);
                    boxpro.set('cue',0);
                    boxpro.save().then(function(data){
                        callback(null,data);
                    });
                }else{
                    callback(null,0);
                }
            });
        }
        function promise2(callback){
            let cusProQuery=new AV.Query('CustomerProduct');
            cusProQuery.equalTo('isDel',false);
            cusProQuery.equalTo('product',product);
            cusProQuery.equalTo('cusId',b.get('cusId'));
            cusProQuery.first().then(function(cuspro){
                passage.set('customerProduct',cuspro);
                passage.save().then(function(p){
                    let data=[];
                    p.set('DT_RowId',p.id);
                    p.set('machine',b.get('machine'));
                    p.set('child',p.get('flag')*1>0?flag[p.get('flag')*1-1]:"");
                    p.set('childId',p.get('flag')*1);
                    p.set('type',p.get('type')?p.get('type'):"");
                    product.fetch().then(function(pro){
                        p.set('productId',pro.id);
                        p.set('product',pro.get('name'));
                        p.set('sku',pro.get('sku'));
                        data.push(p);
                        callback(null,data);
                    });
                },function(err){
                    console.log(err);
                });
            });
        }
        async.parallel([
            function(callback){
                promise1(callback);
            },
            function(callback){
                promise2(callback);
            }
        ],function(err,results){
            res.jsonp({"data":results[1]});
        });
    });
});
//删除货道
router.delete('/passage/remove/:id',function(req,res){
    var id=req.params.id;
    var passage = AV.Object.createWithoutData('Passage', id);
    passage.set('isDel',true);
    passage.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//售货机产品
router.get('/boxProduct/:id',function(req,res){
    let id=req.params.id;
    let query=new AV.Query('BoxProduct');
    let box=AV.Object.createWithoutData('BoxInfo', id);
    query.equalTo('isDel',false);
    query.equalTo('boxId',box);
    query.include('boxId');
    query.include('productId');
    query.find().then(function(results){
        async.map(results,function(result,callback1){
            result.set('DT_RowId',result.id);
            result.set('machine',result.get('boxId').get('machine'));
            result.set('product',result.get('productId').get('name'));
            result.set('sku',result.get('productId').get('sku'));
            result.set('productId',result.get('productId').id);
            callback1(null,result);
        },function(err,data){
            res.jsonp({"data":data});
        });
    });
});
//售货机产品补货提示、警戒值、备货天数修改
router.put('/boxProduct/edit/:id',function(req,res){
    let id=req.params.id;
    let arr=req.body;
    let boxProduct=AV.Object.createWithoutData('BoxProduct',id);
    let cue=arr['data['+id+'][cue]'];
    let warning=arr['data['+id+'][warning]'];
    let stockDays=arr['data['+id+'][stockDays]'];
    if(typeof(cue)!="undefined"){
        boxProduct.set('cue',cue*1);
    }
    if(typeof(warning)!="undefined"){
        boxProduct.set('warning',warning*1);
    }
    if(typeof(stockDays)!="undefined"){
        boxProduct.set('stockDays',stockDays*1);
    }
    boxProduct.save().then(function(){
        let query=new AV.Query('BoxProduct');
        query.include('boxId');
        query.include('productId');
        query.equalTo('objectId',id);
        query.first().then(function(data){
            data.set('machine',data.get('boxId').get('machine'));
            data.set('DT_RowId',data.id);
            data.set('product',data.get('productId').get('name'));
            data.set('sku',data.get('productId').get('sku'));
            let result=[];
            result.push(data);
            res.jsonp({"data":result});
        });
    });
});
//货道库存
router.get('/passtock',function(req,res){
    let flag=['A','B','C','D','E','F','G','H','I','J','L'];
    var query=new AV.Query('Passage');
    query.equalTo('isDel',false);
    query.include('boxId');
    query.include('boxId.cusId');
    query.include('product');
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('cus',result.get('boxId').get('cusId').get('name'));
            result.set('machine',result.get('boxId').get('machine'));
            result.set('type',result.get('type')?result.get('type'):"");
            result.set('sku',result.get('product').get('sku')?result.get('product').get('sku'):"");
            result.set('product',result.get('product').get('name'));
            result.set('seqNo',result.get('seqNo'));
            result.set('child',result.get('flag')*1>0?flag[result.get('flag')*1-1]:"");
        });
        res.jsonp({"data":results});
    });
});

//交易记录
router.get('/pasrecord',function(req,res){
    let arr=['A','B','C','D','E','F','G','H','I','J','L'];
    let takeoutQuery=new AV.Query('TakeOut');
    let borrowQuery=new AV.Query('Borrow');
    let jsondata=[];
    function promise1(callback){
        takeoutQuery.equalTo('isDel',false);
        takeoutQuery.equalTo('result',true);
        takeoutQuery.include('product');
        takeoutQuery.include('passage');
        takeoutQuery.include('box');
        takeoutQuery.include('card');
        takeoutQuery.include('box.cusId');
        takeoutQuery.include('card.emp');
        takeoutQuery.descending('createdAt');
        takeoutQuery.find().then(function(takeouts){
            async.map(takeouts,function(takeout,callback1){
                let machine=takeout.get('box').get('machine');
                let card=takeout.get('card').get('card');
                let sku=takeout.get('product').get('sku')?takeout.get('product').get('sku'):"";
                let product=takeout.get('product').get('name');
                let unit=takeout.get('product').get('unit');
                let passage=takeout.get('passage').get('flag')*1>0?arr[takeout.get('passage').get('flag')*1-1]+takeout.get('passage').get('seqNo'):takeout.get('passage').get('seqNo');
                let time=new moment(takeout.get('time')).format('YYYY-MM-DD HH:mm:ss');
                let cus=takeout.get('box').get('cusId').get('name');
                let emp=takeout.get('card').get('emp').get('name');
                let empNo=takeout.get('card').get('emp').get('empNo');
                let onetake={"time":time,"type":"领料","objectId":takeout.get('id'),
                "cus":cus,"machine":machine,"passage":passage,"count":-1,
                "product":product,"sku":sku,"unit":unit,"employee":emp,
                "empNo":empNo,"empCard":card};
                jsondata.push(onetake);
                callback1(null,onetake);
            },function(error,results){
                return callback(null,results);
            });
        });
    }
    function promise2(callback){
        borrowQuery.equalTo('isDel',false);
        borrowQuery.equalTo('result',true);
        borrowQuery.include('product');
        borrowQuery.include('passage');
        borrowQuery.include('box');
        borrowQuery.include('card');
        borrowQuery.include('box.cusId');
        borrowQuery.include('card.emp');
        borrowQuery.descending('createdAt');
        borrowQuery.find().then(function(borrows){
            async.map(borrows,function(borrow,callback1){
                let machine=borrow.get('box').get('machine');
                let card=borrow.get('card').get('card');
                let sku=borrow.get('product').get('sku')?borrow.get('product').get('sku'):"";
                let product=borrow.get('product').get('name');
                let unit=borrow.get('product').get('unit');
                let passage=borrow.get('passage').get('flag')*1>0?arr[borrow.get('passage').get('flag')*1-1]+borrow.get('passage').get('seqNo'):borrow.get('passage').get('seqNo');
                let time=new moment(borrow.get('time')).format('YYYY-MM-DD HH:mm:ss');
                let cus=borrow.get('box').get('cusId').get('name');
                let emp=borrow.get('card').get('emp').get('name');
                let empNo=borrow.get('card').get('emp').get('empNo');
                let flag=borrow.get('borrow');
                let oneborrow={"time":time,"type":flag?"借":"还",
                "objectId":borrow.get('id'),"cus":cus,"machine":machine,
                "passage":passage,"sku":sku,"product":product,"count":flag?-1:+1,
                "unit":unit,"employee":emp,"empNo":empNo,"empCard":card};
                jsondata.push(oneborrow);
                callback1(null,oneborrow);
            },function(error,results){
                return callback(null,results);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            res.jsonp({"data":jsondata});
    });
});

//补货业务
router.get('/supply',function(req,res){
    let arr=['A','B','C','D','E','F','G','H','I','J','L'];
    var query=new AV.Query('Supply');
    query.equalTo('isDel',false);
    query.greaterThan('count',0);
    query.include('box');
    query.include('card');
    query.include('passage');
    query.include('passage.product');
    query.include('box.cusId');
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('number',new moment(result.get('createdAt')).unix());
            result.set('product',result.get('passage').get('product').get('name'));
            result.set('time',new moment(result.get('time')).format('YYYY-MM-DD HH:mm:ss'));
            result.set('sku',result.get('passage').get('product').get('sku')?result.get('passage').get('product').get('sku'):"");
            result.set('cus',result.get('box').get('cusId').get('name'));
            result.set('machine',result.get('box').get('machine'));
            //result.set('card',result.get('card').get('card'));
            result.set('passage',result.get('passage').get('flag')*1>0?
            arr[result.get('passage').get('flag')*1-1]+result.get('passage').get('seqNo'):result.get('passage').get('seqNo'));
        });
        res.jsonp({"data":results});
    });
});

//补货计划
router.get('/supplyplan',function(req,res){

});

//盘点业务
router.get('/checklist',function(req,res){

});

router.get('/checkrecord',function(req,res){

});

//仓库管理
router.get('/storehouse',function(req,res){

});

//数据报表-用量汇总报告
router.get('/summary/:date',function(req,res){
    let resdata={};
    function getCustomer(callback){
        let cusQuery=new AV.Query('Customer');
        cusQuery.equalTo('isDel',false);
        cusQuery.find().then(function(results){
            callback(null,results);
        });
    }
    function getBox(customers,callback){
        let boxQuery=new AV.Query('BoxInfo');
        boxQuery.equalTo('isDel',false);
        boxQuery.find().then(function(results){
            callback(null,customers,results);
        });
    }
    function getCusProduct(customers,boxes,callback){
        let cusProQuery=new AV.Query('CustomerProduct');
        cusProQuery.equalTo('isDel',false);
        cusProQuery.find().then(function(results){
            callback(null,customers,boxes,results);
        });
    }
    function getTakeout(customers,boxes,cuspros,callback){
        let arr=req.params.date.split(' - ');
        let start,end;
        let query=new AV.Query('TakeOut');
        let boxArr=[];
        let cusArr=[];
        query.equalTo('isDel',false);
        query.equalTo('result',true);
        start=new moment(arr[0]).startOf('days').format('YYYY-MM-DD HH:mm:ss');
        if(arr.length==1){
            end=new moment(arr[0]).endOf('days').format('YYYY-MM-DD HH:mm:ss');
        }else{
            end=new moment(arr[1]).endOf('days').format('YYYY-MM-DD HH:mm:ss');
        }
        query.greaterThanOrEqualTo('time',new Date(start));
        query.lessThan('time',new Date(end));
        query.limit(1000);
        query.include('product');
        query.count().then(function(count){
            let num=Math.ceil(count/1000);
            let takes=[];
            async.times(num,function(n,callback5){
                query.skip(1000*n);
                query.find().then(function(results){
                    if(n==0){
                        takes=results;
                    }else {
                        takes.concat(results);
                    }
                    callback5(null,n);
                });
            },function(err,takesres){
                async.map(boxes,function(box,callback1){
                    let boxList=[];
                    let boxData={};
                    boxData['name']=box.get('machine');
                    boxData['count']=0;
                    boxData['total']=0;
                    boxData['cus']=box.get('cusId').id;
                    async.map(takes,function(take,callback2){
                        if(take.get('box').id==box.id){
                            boxData['count']+=1;
                            cuspros.forEach(function(cuspro){
                                if(cuspro.get('product').id==take.get('product').id&&
                                    cuspro.get('cusId').id==box.get('cusId').id){
                                    boxData['total']+=cuspro.get('cusProductPrice');
                                    boxList.push({'sku':take.get('product').get('sku'),
                                    'name':take.get('product').get('name'),'id':
                                    take.get('product').id,'price':cuspro.get('cusProductPrice')});
                                }
                            });
                            callback2(null,take);
                        }
                    },function(err,takeres){
                        if(boxData['count']>0){
                            boxData['list']=boxList;
                            boxArr.push(boxData);
                        }
                        callback1(null,takeres);
                    });
                },function(err,boxres){
                    resdata['box']=boxArr;
                    async.map(customers,function(cus,callback3){
                        let cusList=[];
                        let cusData={};
                        cusData['name']=cus.get('name');
                        cusData['count']=0;
                        cusData['total']=0;
                        async.map(boxArr,function(ba,callback4){
                            if(cus.id==ba['cus']){
                                let i=0;
                                cusData['count']+=ba['count'];
                                cusData['total']+=ba['total'];
                                cusArr.push(cusData);
                                if(i==0){
                                    cusList=ba['list'];
                                }else{
                                    cusList.concat(ba['list']);
                                }
                                callback4(null,1);
                            }else{
                                callback4(null,0);
                            }
                        },function(err,bares){
                            cusData['list']=cusList;
                            callback3(null,cus);
                        });
                    },function(err,cusres){
                        resdata['cus']=cusArr;
                        callback(null,boxres);
                    });
                });
            });
        });
    }
    async.waterfall([
        function (callback){
            getCustomer(callback);
        },
        function(customers,callback){
            getBox(customers,callback);
        },
        function(customers,boxes,callback){
            getCusProduct(customers,boxes,callback);
        },
        function(customers,boxes,cuspros,callback){
            getTakeout(customers,boxes,cuspros,callback);
        }
    ],function(err,results){
        return res.jsonp(resdata);
    });
});
module.exports = router;

$(function() {

    Morris.Area({
        element: 'morris-area-chart',
        data: [{
            period: '2010 Q1',
            慕贝尔: 2666,
            法克赛: null,
            佩尔哲: 2647
        }, {
            period: '2010 Q2',
            慕贝尔: 2778,
            法克赛: 2294,
            佩尔哲: 2441
        }, {
            period: '2010 Q3',
            慕贝尔: 4912,
            法克赛: 1969,
            佩尔哲: 2501
        }, {
            period: '2010 Q4',
            慕贝尔: 3767,
            法克赛: 3597,
            佩尔哲: 5689
        }, {
            period: '2011 Q1',
            慕贝尔: 6810,
            法克赛: 1914,
            佩尔哲: 2293
        }, {
            period: '2011 Q2',
            慕贝尔: 5670,
            法克赛: 4293,
            佩尔哲: 1881
        }, {
            period: '2011 Q3',
            慕贝尔: 4820,
            法克赛: 3795,
            佩尔哲: 1588
        }, {
            period: '2011 Q4',
            慕贝尔: 15073,
            法克赛: 5967,
            佩尔哲: 5175
        }, {
            period: '2012 Q1',
            慕贝尔: 10687,
            法克赛: 4460,
            佩尔哲: 2028
        }, {
            period: '2012 Q2',
            慕贝尔: 8432,
            法克赛: 5713,
            佩尔哲: 1791
        }],
        xkey: 'period',
        ykeys: ['慕贝尔', '法克赛', '佩尔哲'],
        labels: ['慕贝尔', '法克赛', '佩尔哲'],
        pointSize: 2,
        hideHover: 'auto',
        resize: true
    });

    Morris.Donut({
        element: 'morris-donut-chart',
        data: [{
            label: "Download Sales",
            value: 12
        }, {
            label: "In-Store Sales",
            value: 30
        }, {
            label: "Mail-Order Sales",
            value: 20
        }],
        resize: true
    });

    Morris.Bar({
        element: 'morris-bar-chart',
        data: [{
            y: '2006',
            a: 100,
            b: 90
        }, {
            y: '2007',
            a: 75,
            b: 65
        }, {
            y: '2008',
            a: 50,
            b: 40
        }, {
            y: '2009',
            a: 75,
            b: 65
        }, {
            y: '2010',
            a: 50,
            b: 40
        }, {
            y: '2011',
            a: 75,
            b: 65
        }, {
            y: '2012',
            a: 100,
            b: 90
        }],
        xkey: 'y',
        ykeys: ['a', 'b'],
        labels: ['Series A', 'Series B'],
        hideHover: 'auto',
        resize: true
    });
    
});

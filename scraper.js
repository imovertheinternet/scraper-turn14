
var casper = require('casper').create()
var utils = require('utils');
var x = require('casper').selectXPath;
var fs = require('fs');
casper.options.waitTimeout = 200000;
casper.userAgent('Mozilla/4.0 (comptible; MSIE 6.0; Windows NT 5.1)');

// Log In
casper.start('http://turn14.com/main.php', function() {
    this.fill('form[id="login"]', {
        'username': 'xxx',
        'pass': 'xxx'
    }, true);
});

//clicking submit button
casper.thenClick('.header-submit');
// Search by URL
casper.thenOpen('http://turn14.com/search.php?search=brz&type=Keyword&stock=on&rpp=100&page=2');

/* Uncomment this block if you want to search by keyword input
casper.wait(4000, function() {
  casper.then(function() {
    this.sendKeys('#keywordSearchInput', "as");
  });
});

// This clicks the 100 items at a time link
casper.thenClick(x('//*[@id="search-v4-controls"]/div[2]/a[5]'));

// Select In stock items only
casper.thenClick(x('/html/body/div[2]/div[2]/div[1]/a'));
*/

// Get info on all elements matching this CSS selector
casper.wait(7000, function getparts() {
ourcost = casper.fetchText('span.large');
ourcostsplit = ourcost.split('$').join(" \n");
ourcostsplit2 = ourcostsplit.replace(/\.[0-9]*/g,"");

fulldes = casper.fetchText('.search-v4-product-info');

partnumbersplit =  fulldes.match(/Part #(.*)/g).join(" \n");
partnumbersplit2 = partnumbersplit.split('Part #: ').join('');

manu =  fulldes.match(/Manufacturer:(.*)/g).join(" \n");
manu2 =  manu.split('Manufacturer: ').join('');

/*
cost123 = casper.getfetchText(ourcost);
var costarray = []
for (var i = 0; i < cost123.length; i++){
  costarray.push(cost123[i].text);
}
*/

// Description works
longdescription = '';
function scheduleScrapeAndClose(){
    casper.waitUntilVisible(x('//*[@id="product-infoform"]'));
    casper.wait(5000, function(){
    // fetch text
    lbdes = this.getHTML(x('//*[@id="product_overview"]', true));
     //lbdes2 = lbdes.replace(/\s{2,100}/g, ' ');
 /*
    lbdes3 = lbdes.replace(/\n/g, '');
    lbdes4 = lbdes3.replace(/\s+(<b>)\s?/g, '\n <b>');
    lbdes5 = lbdes4.replace(/\s+(<\/b>)\s+/g, '</b>').replace(/\t/g, '');
    longdescription  += lbdes5;
    */
//   lbdestrim = lbdes.trim();
//    lbdessplit = lbdestrim.split('<br>').join('');
    //utils.dump(lbdes2);
    casper.click(x('//*[@id="product-infocloser"]'));
});
    casper.waitWhileVisible(x('//*[@id="product_overview"]'));
}

casper.then(function(){
    var buttonNumber = casper.getElementsInfo(".button.small.orange").length;
    for(var i = 0; i < buttonNumber; i++) {
        casper.thenClick(x("(//*[contains(@class,'button') and contains(@class,'small') and contains(@class,'orange')])["+(i+1)+"]"));
        scheduleScrapeAndClose();
    }
});

// PRINT EVERYTHING TO STOUT
/*
casper.then(function(){
  utils.dump(longdescription);
});
*/

var imgList = this.evaluate(function(){
        var productImages = document.querySelectorAll("div.search-v4-product-image"),
            imageList = [];
        Array.prototype.forEach.call(productImages, function(div){
            if (div.children.length == 0) {
                imageList.push({empty: true});
            } else {
                var img = div.children[0]; // assumes that the image is the first child
                imageList.push({empty: false, src: img.src.split('100.jpg').join("420.jpg") });
            }
        });
        return imageList;
    });

    var csv = "";

    imgList.forEach(function(img){
        // If the image is empty, pass in a placeholder
        if (img.empty) {
            csv += "http://cdn.shopify.com/s/files/1/0210/8586/products/123.png?v=1403635515\n";
        } else {
            csv += img.src+"\n";
        }
    });

//Save the shit to csv - used 'a' flag to append rather than write, works for pagination!
casper.then(function() {
var f = fs.open('Miata.xls', 'a');
f.write(longdescription + String.fromCharCode(13));
//f.write(imagessplit + String.fromCharCode(13));
//f.write(lbdes);
f.write(csv);
//f.write(dessplit2 + String.fromCharCode(13));
f.write(partnumbersplit2);
f.write(ourcostsplit2 + String.fromCharCode(13));
f.write(manu2 + String.fromCharCode(13));
f.close();
});

// Pagination works. HAVE TO START FROM 2ND PAGE CAUSE NEXT BUTTON CHANGES LOCATION IN DOM
    var nextLink = "#search-v4-controls-left.left > a:nth-child(3)";
    if (casper.visible(nextLink)) {
        casper.thenClick(nextLink);
        casper.wait(3000);
        casper.then(getparts);
    } else {
        casper.echo("DING - dinners done, doing last page now")
    }

});

casper.run();

var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var mongoose = require('mongoose');

var incidentSchema = require('./models/incident.js');
var DB = require('./config/database.js');
mongoose.connect(DB.url);

var baseUrl = "http://www.gunviolencearchive.org/incident/";

request("http://www.gunviolencearchive.org/last-72-hours", function (error, response, html) {
  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);
    var first = 365410; //read max from db
    var last = $('.links-new-lines .first a')[0].attribs.href.replace(/\D/g, '');
    last = 365420;
    for (var i = first + 1; i <= last; i++) {
      scrapIncident(i);
    }
  }
});
Participant = function (type, name, age, ageGroup, gendre, status) {
  this.type = type ? type.replace(/Type: /, '') : null;
  this.name = name ? name.replace(/Name: /, '') : null;
  this.age = age ? parseInt(age.replace(/Age: /, '')) : null;
  this.ageGroup = ageGroup ? ageGroup.replace(/Age Group: /, '') : null;
  this.gendre = gendre ? gendre.replace(/Gender: /, '') : null;
  this.status = status ? status.replace(/Status: /, '') : null;
};
Gun = function (type, stolen) {
  this.type = type ? type.replace(/Type: /, '') : null;
  ;
  this.stolen = stolen ? stolen.replace(/Stolen: /, '') : null;
  ;
};
scrapIncident = function (i) {
  console.log('trying : ' + i);
  request(baseUrl + i, function (error, response, html) {
    console.log('    ----Matched on: ' + i);
    if (!error && response.statusCode == 200) {
      //var incident = {id: i, participants: [], characteristics: [], notes: [], guns: [], sources: [],districts: {congressional: -1, senate: -1, house: -1}};
      var incident = new incidentSchema;
      incident.id = i;
      $ = cheerio.load(html);
      var body = $('#block-system-main').children('div');
      var geoDates = $(body[0]).children();
      incident.date = new Date($(geoDates[1]).text());
      if (geoDates.length === 7)
        incident.address = $(geoDates[2]).text();
      else if (geoDates.length === 9)
        incident.address = $(geoDates[2]).text() + ' ' + $(geoDates[4]).text();
      else
        incident.address = $(geoDates[2]).text() + ' ' + $(geoDates[4]).text() + ' ' + $(geoDates[6]).text();
      var zones = $(geoDates[geoDates.length - 3]).text().split(", ");
      incident.region = zones[0];
      incident.state = zones[1];
      var geos = $(geoDates[geoDates.length - 1]).text().match(/[\d\.-]+/g);
      incident.latitude = parseFloat(geos[0]);
      incident.longitude = parseFloat(geos[1]);
      var participants = $($(body[1]).children()[1]).children();
      for (var j = 0; j < participants.length; j++) {
        var pDetails = $(participants[j]).children('li');
        var type = '', name = '', age = '', ageGroup = '', gendre = '', status = '';
        for (var k = 0; k < pDetails.length; k++) {
          if ($(pDetails[k]).text().match(/Type: /))
            type = $(pDetails[k]).text();
          else if ($(pDetails[k]).text().match(/Name: /))
            name = $(pDetails[k]).text();
          else if ($(pDetails[k]).text().match(/Age: /))
            age = $(pDetails[k]).text();
          else if ($(pDetails[k]).text().match(/Age Group: /))
            ageGroup = $(pDetails[k]).text();
          else if ($(pDetails[k]).text().match(/Gender: /))
            gendre = $(pDetails[k]).text();
          else if ($(pDetails[k]).text().match(/Status: /))
            status = $(pDetails[k]).text();
        }
        var participant = new Participant(type, name, age, ageGroup, gendre, status);
        incident.participants.push(participant);
      }
      var characteristics = $($(body[3]).children('ul')[0]).children('li');
      for (var j = 0; j < characteristics.length; j++) {
        incident.characteristics.push($(characteristics[j]).text());
      }
      var notes = $(body[4]).children('p');
      for (var j = 0; j < notes.length; j++) {
        incident.notes.push($(notes[j]).text());
      }
      var guns = $(body[5]).children('ul');
      for (var j = 0; j < guns.length; j++) {
        var gDetails = $(guns[j]).children('li');
        var type = '', stolen = '';
        for (var k = 0; k < gDetails.length; k++) {
          if ($(gDetails[k]).text().match(/Type: /))
            type = $(gDetails[k]).text();
          else if ($(gDetails[k]).text().match(/Stolen: /))
            stolen = $(gDetails[k]).text();
        }
        var gun = new Gun(type, stolen);
        incident.guns.push(gun);
      }
      //sources goes here $(body[6])
      var sources = $($(body[6]).children('ul')[0]).children('li');
      if (sources) {
        for (var j = 0; j < sources.length; j++) {
          incident.sources.push($(sources[j]).children('a')[0].attribs.href);
        }
      }
      var districs = $(body[7]).text().match(/\d+/g);
      if (districs) {
        incident.districts.congressional = parseInt(districs[0]);
        incident.districts.senate = parseInt(districs[1]);
        incident.districts.house = parseInt(districs[2]);
      }
      incident.save();
    }
  });
};

//var lastTreated;
//var args = process.argv.slice(2);
//
//fs.exists('treated.json', function (exists) {
//  if (!exists) {
//    fs.writeFile('treated.json', '{"index": 0}', function (err) {
//      if (err)
//        throw err;
//      console.log("Checkpoint file created");
//    });
//  }
//  fs.readFile('treated.json', function (err, data) {
//    if (err)
//      throw err;
//    checkpoint = JSON.parse(data);
//    lastTreated = checkpoint.index;
//    console.log(lastTreated);
//    var range = [lastTreated, args[0] ? parseInt(args[0]) : 700000];
//    var baseUrl = "http://www.gunviolencearchive.org/incident/";
//    console.log(range);
//    for (var i = range[0]; i < range[1];) {
////  request(baseUrl + i, function (error, response, body) {
////    if (!error && response.statusCode == 200) {
////      console.log(body);
////    }
//      fs.writeFile('treated.json', '{"index": ' + i + '}', function (err) {
//        if (err)
//          throw err;
//        console.log("Checkpoint file updated, index is now : " + i);
//        i++;
//      });
////  });
//    }
//  });
//});


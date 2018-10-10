const express = require('express');
const _ = require('lodash');
const { authenticate } = require('../../../middleware/authenticate');
var { mongoose } = require('../../../db/mongoose');
var { Guide } = require('../../../db/models/Guide');
var { Topic } = require('../../../db/models/Topic');
var { Analytics } = require('../../../db/models/Analytics');
var { Comments } = require('../../../db/models/Comments');

var route = require('express').Router();

route.post('/guides', function(req, res) {
  const { query, timeRange, start, getAmount } = req.body;

  if(validateOneQuery(query) && validateIndex(start)) {
    let orArr = [];
    query.trim().replace(/\s/g, ' ').split(' ').map((q) => {
      orArr.push({'head.heading': { $regex: q + ".*", $options: 'i'}});
      orArr.push({'head.subHeading': { $regex: q + ".*", $options: 'i'}});
    });
    const amquery = Guide.find({ $or: orArr, 'head.private': false }).count();
    const dbquery = Guide.find({ $or: orArr, 'head.private': false }).skip(start).limit(10);
    dbquery.exec((err, guides) => {
      if(err){
        res.send({status: 400});
      } else {
        if(guides) {

          guides = guides.map((g) => {
            let image = g.content.find((c) => c.type === "image");
            return { image, head: g.head, _id: g._id, searchTitle: g.searchTitle }
          });

          if(getAmount) {
            amquery.exec((err, amount) => {
              if(err) {
                res.send({guides, amount: null, status: 200});
              } else {
                res.send({guides, amount, status: 200});
              }
            });
          } else {
            res.send({guides, status: 200});
          }

          trackSearch(guides);

        } else {
          res.send({guides: [], status: 200});
        }
      }
    });
  } else if(validateTimeRange(timeRange) && validateIndex(start)) {

    const query = Guide.find({
      $and: [{ 'head.date.time': { $gte: timeRange.start } },{ 'head.date.time': { $lte: timeRange.end } }],
      'head.private': false
    }).skip(start).limit(10);

    const amquery = Guide.find({
      $and: [{ 'head.date.time': { $gte: timeRange.start } },{ 'head.date.time': { $lte: timeRange.end } }],
      'head.private': false
    }).count();

    query.exec((err, guides) => {
      if(err){
        res.send({status: 400});
      } else {
        if(guides) {
          
          guides = guides.map((g) => {
            let image = g.content.find((c) => c.type === "image");
            return { topics: g.topics, image, head: g.head, _id: g._id, searchTitle: g.searchTitle }
          });

          if(getAmount) {
            amquery.exec((err, amount) => {
              if(err) {
                res.send({guides, amount: null, status: 200});
              } else {
                res.send({guides, amount, status: 200});
              }
            });
          } else {
            res.send({guides, status: 200});
          }

          trackSearch(guides);

        } else {
          res.send({guides: [], status: 200});
        }
      }
    });
  } else {
    res.send({status: 400, message: 'Invalid parameters'});
  }
});

const trackSearch = (data) => {
  data.map((g) => {
    Analytics.findOne({
      $or: [{ 'guideId': g._id }, { 'searchTitle': g.searchTitle }]
    }, (err, a) => {
      if(err) {
        console.log(err)
      } else if(a) {

        a.activeSearches ? a.activeSearches+=1 : a.activeSearches = 1;
        a.save().catch((err) => console.log(err));

      } else {

        let ana = new Analytics({
          heading: g.head.heading,
          searchTitle: g.searchTitle,
          guideId: g._id,
          activeSearches: 1,
          activeViews: 0,
          activeLinks: 0
        });

        ana.save().catch((err) => console.log(err));

      }
    });
  });
}

const validateQuery = (heading, time, subHeading, id) => {
  return (typeof heading === 'string' && heading.length <= 500 && heading.length >= 0) ||
         (typeof time === 'string' && time.length < 200) ||
         (typeof subHeading === 'string' && subHeading.length <= 500 && heading.length >= 0) ||
         (typeof id === 'string' && id.length < 200 && id >= 0)
}

const validateTimeRange = (range) => {
  return range && typeof range.start === 'number' && typeof range.end === 'number' &&
  range.start >= 0 && range.end >= 0 && range.start < range.end;
}

const validateOneQuery = (value) => {
  return typeof value === 'string' && value.length <= 500 && value.length > 0;
}

const validateIndex = (start) => {
  return typeof start === 'number' && start >= 0
}

const validateKeywords = (keywords) => {
  return Array.isArray(keywords) && keywords.length > 0 && keywords.length <= 100 &&
  !keywords.find((k) => typeof k !== 'string' || k.length > 30);
};

module.exports = route;

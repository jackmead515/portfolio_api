const express = require('express');
const _ = require('lodash');
var { mongoose } = require('../../../db/mongoose');
var { Guide } = require('../../../db/models/Guide');
var { Topic } = require('../../../db/models/Topic');
var { Analytics } = require('../../../db/models/Analytics');
var { Comments } = require('../../../db/models/Comments');

var route = require('express').Router();

/**
* @api {post} /guides/guide Get Guide
* @apiName GetGuide
* @apiGroup Guides
* @apiDescription Retrieves a guide from the database. Guide will be tracked on the view
* @apiPermission Public
*
* @apiParam {String} searchTitle - searchTitle of guide to query
*
* @apiSuccessExample {json} Success-Response:
*     {
*       "status": 200,
*       "guide": {Mongoose Guide Schema} or null if no guide is found
*     }
*
* @apiErrorExample {json} Error-Response:
*     {
*       "status": 400,
*       "message": "Invalid searchTitle parameter"
*     }
*/
route.post('/guide', function(req, res) {
  const { searchTitle } = req.body;

  if(validateOneQuery(searchTitle)) {
    Guide.findOne({'searchTitle': searchTitle, 'head.private': false}, (err, guide) => {
      if(err) {
        console.log(err);
        res.send({status: 400});
      } else {
        if(guide) {
          res.send({guide, status: 200});

          //tracking the view...
          trackView([guide]);

        } else {
          res.send({guide: null, status: 200});
        }
      }
    });
  } else {
    res.send({status: 400, message: 'Invalid searchTitle parameter'});
  }
});

/**
* @api {post} /guides/topic Get Guides by Topic
* @apiName GetGuidesByTopic
* @apiGroup Guides
* @apiDescription Retrieves a section (10) guides from the topic.
* @apiPermission Public
*
* @apiParam {String} title - title of topic to query
* @apiParam {Number} start - start index to query guides
*
* @apiSuccessExample {json} Success-Response:
*     {
*       "status": 200,
*       "guide": [{Mongoose Guide Schema}]
*     }
*
* @apiErrorExample {json} Error-Response:
*     {
*       "status": 400,
*       "message": "Invalid parameters"
*     }
*/
route.post('/topic', function(req, res) {
  const { title, start } = req.body;

  if(validateOneQuery(title) && validateIndex(start)) {
    Topic.findOne({ title }, (err, t) => {
      if(err) {
        console.log(err);
        res.send({status: 400});
      } else {
        if(t) {

          let s = start >= t.guides.length ? t.guides.length-1 : start;
          let e = start+10 > t.guides.length ? t.guides.length : start+10;
          let slicedGuides = t.guides.slice(s, e);

          let gPromises = slicedGuides.map((guide) => {
            return new Promise((resolve, reject) => {
              Guide.findOne({searchTitle: guide.searchTitle, 'head.private': false}, (err, dbguide) => {
                if(err) {
                  resolve(null);
                } else {
                  if(dbguide) {
                    let image = dbguide.content.find((c) => c.type === "image");
                    resolve({image, head: dbguide.head, _id: dbguide._id, searchTitle: dbguide.searchTitle });
                  } else {
                    resolve(null);
                  }
                }
              });
            });
          });

          Promise.all(gPromises).then((data) => {
            data = data.filter((d) => d !== null);
            res.send({guides: data, status: 200});
          });

        } else {
          res.send({guides: [], status: 200});
        }
      }
    });
  } else {
    res.send({status: 400, message: 'Invalid parameters'});
  }
});

route.post('/recent', function(req, res) {
  const { amount } = req.body;

  Guide.aggregate([
    { $project: {
      searchTitle: '$searchTitle',
      heading: '$head.heading',
      time: '$head.date.time',
      private: '$head.private'
    }},
    { $group: {
        _id: '$_id',
        private: { $first: '$private' },
        searchTitle: { $first: '$searchTitle' },
        heading: { $first: '$heading' },
        time: {$max : '$time'},
    }},
    { "$sort": { time: -1 }},
    { "$limit": (amount && typeof amount === 'number' && amount <= 10 ? amount : 3) }
  ], (err, guides) => {
    if(err) {
      res.send({status: 400});
    } else {
      if(guides) {
        guides = guides.filter((g) => !g.private);
        res.send({status: 200, guides});
      } else {
        res.send({status: 200, guides: []})
      }
    }
  });
});

route.post('/related', function(req, res) {
  const { heading, subHeading, tags } = req.body;

  if(validateRelated(heading, subHeading, tags)) {

    let keywords = [];
    keywords = keywords.concat(heading.trim().replace(/\s/g, ' ').split(' ').filter((w) => w.length > 4));
    keywords = keywords.concat(subHeading.trim().replace(/\s/g, ' ').split(' ').filter((w) => w.length > 4));
    keywords = keywords.map((w) => w.toLowerCase());
    let searchTags = tags.map((t) => t.trim().toLowerCase());

    let orArr = [];
    keywords.map((q) => {
      orArr.push({'head.heading': { $regex: q + ".*", $options: 'i'}});
      orArr.push({'head.subHeading': { $regex: q + ".*", $options: 'i'}});
    });
    if(searchTags.length > 0) {
      orArr.push({'head.tags': { $in: searchTags }});
    }
    const dbquery = Guide.find({ $or: orArr, "head.private": false }, { searchTitle: 1, "head.heading": 1 }).limit(10);
    dbquery.exec((err, guides) => {
      if(err){
        res.send({status: 400});
      } else {
        if(guides) {
          res.send({guides, status: 200});
        } else {
          res.send({guides: [], status: 200});
        }
      }
    });
  } else {
    res.send({status: 400, message: 'Invalid parameters'});
  }
});

route.post('/', function(req, res) {
    const { start } = req.body;

    if(validateIndex(start)) {
      const query = Guide.find({'head.private': false}).skip(start).sort({"head.date.time": -1}).limit(10);
      query.exec((err, guides) => {
        if(err){
          res.send({status: 400});
        } else {
          if(guides) {

            guides = guides.map((g) => {
              let image = g.content.find((c) => c.type === "image");
              return { image, head: g.head, _id: g._id, searchTitle: g.searchTitle }
            });

            res.send({guides: guides, status: 200});
          } else {
            res.send({guides: [], status: 200});
          }
        }
      });
    } else {
      res.send({status: 400, message: 'Invalid parameters'});
    }
});

const trackView = (data) => {
  data.map((g) => {
    Analytics.findOne({
      $or: [{ 'guideId': g._id }, { 'searchTitle': g.searchTitle }]
    }, (err, a) => {
      if(err) {
        console.log(err)
      } else if(a) {

        a.activeViews ? a.activeViews+=1 : a.activeViews = 1;
        a.save().catch((err) => console.log(err));

      } else {

        let ana = new Analytics({
          heading: g.head.heading,
          searchTitle: g.searchTitle,
          guideId: g._id,
          activeSearches: 0,
          activeViews: 1,
          activeLinks: 0
        });

        ana.save().catch((err) => console.log(err));

      }
    });
  });
}

const validateRelated = (heading, subHeading, tags) => {
  return (typeof heading === 'string' && heading.length <= 500 && heading.length >= 0) &&
         (typeof subHeading === 'string' && subHeading.length <= 500 && subHeading.length >= 0) &&
         (Array.isArray(tags) && tags.length >= 0 && tags.length <= 100 && !tags.find((t) => typeof t !== 'string' || t.length > 30))
}

const validateOneQuery = (value) => {
  return typeof value === 'string' && value.length <= 500 && value.length > 0;
}

const validateIndex = (start) => {
  return typeof start === 'number' && start >= 0
}

module.exports = route;

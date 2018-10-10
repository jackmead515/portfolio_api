const express = require('express');
const _ = require('lodash');
const { authenticate, admin_authenticate } = require('../../../middleware/authenticate');
var { mongoose } = require('../../../db/mongoose');
var { Guide } = require('../../../db/models/Guide');
var { Topic } = require('../../../db/models/Topic');
var { Analytics } = require('../../../db/models/Analytics');
var { Comments } = require('../../../db/models/Comments');

var route = require('express').Router();

route.post('/all_guides', authenticate, function(req, res) {
  const query = Guide.find({}, {head: 1, searchTitle: 1}).sort({"head.date.time": -1});
  query.exec((err, guides) => {
    if(err){
      console.log(err);
      res.send({status: 400, message: err});
    } else {
      if(guides) {
        res.send({guides, status: 200});
      } else {
        res.send({guides: [], status: 200});
      }
    }
  });
});

route.post('/get_all_tracking', authenticate, function(req, res) {
  Analytics.find({}, (err, a) => {
    if(err) {
      console.log(err);
      res.send({status: 400, message: err});
    } else {
      if(a) {
        res.send({tracking: a, status: 200});
      } else {
        res.send({status: 400});
      }
    }
  });
});

route.post('/guide', authenticate, function(req, res) {
  const { searchTitle } = req.body;

  if(validateOneQuery(searchTitle)) {
    Guide.findOne({'searchTitle': searchTitle}, (err, guide) => {
      if(err) {
        console.log(err);
        res.send({status: 400, message: err});
      } else {
        if(guide) {
          res.send({guide, status: 200});
        } else {
          res.send({guide: null, status: 200});
        }
      }
    });
  } else {
    res.send({status: 400, message: 'Invalid searchTitle parameter'});
  }
});

route.post('/save', admin_authenticate, function(req, res) {
  const { guide } = req.body;

  Guide.findOne({_id: guide._id}, (err, dbGuide) => {
    if(err) {
      console.log(err);
      res.send({status: 400, message: err});
    } else {
      if(dbGuide) {

        const newHeading = guide.head.heading;
        const oldHeading = dbGuide.head.heading;
        const oldSearchTitle = dbGuide.searchTitle;
        const newSearchTitle = guide.head.heading.trim().replace(/\s/g, '-').toLowerCase();

        dbGuide.content = guide.content;
        dbGuide.head = guide.head;
        dbGuide.searchTitle = newSearchTitle;

        dbGuide.save().then(() => {
          if(newHeading !== oldHeading) {
            Comments.findOneAndUpdate({"searchTitle": oldSearchTitle}, {"searchTitle": newSearchTitle}).exec();
            Analytics.findOneAndUpdate({"searchTitle": oldSearchTitle}, {"searchTitle": newSearchTitle, "heading": newHeading}).exec();

            Topic.find({}, (err, dbTopics) => {
              if(!err) {
                dbTopics = dbTopics.map((t) => {
                  t.guides = t.guides.map((g) => {
                    if(g.searchTitle === oldSearchTitle) {
                      g.searchTitle = newSearchTitle; g.heading = newHeading;
                    }
                    return g;
                  });
                  return t;
                });

                dbTopics.map((dbt) => dbt.save());
              }
            });
          }
          res.send({guide: dbGuide, status: 200});
        }).catch((err) => {
          res.send({message: err, status: 400});
        })
      } else {

        guide.searchTitle = guide.head.heading.replace(/\s/g, '-').toLowerCase();
        var g = new Guide(guide);

        g.save().then(() => {
          res.send({guide, status: 200});
        }).catch((err) => {
          console.log(err);
          res.send({message: err, status: 400});
        });
      }
    }
  });
});

route.post('/delete', admin_authenticate, function(req, res) {
  const { guide } = req.body;

  Guide.findOneAndRemove({_id: guide._id}, (err, dbGuide) => {
    if(err) {
      console.log(err);
      res.send({status: 400, message: err});
    } else {
      Comments.findOneAndRemove({ 'searchTitle': dbGuide.searchTitle }).exec();
      Analytics.findOneAndRemove({ 'searchTitle': dbGuide.searchTitle }).exec();
      Topic.find({}, (err, dbTopics) => {
        if(!err) {
          dbTopics = dbTopics.map((t) => t.guides.filter((g) => g.searchTitle !== dbGuide.searchTitle));
          dbTopics.map((dbt) => dbt.save());
        }
      });
      res.send({status: 200});
    }
  });
});

const validateQuery = (heading, time, subHeading, id) => {
  return (heading && typeof heading === 'string' && heading.length < 200) ||
         (time && typeof time === 'string' && time.length < 200) ||
         (subHeading && typeof subHeading === 'string' && subHeading.length < 200) ||
         (id && typeof id === 'string' && id.length < 200)
}

const validateTimeRange = (range) => {
  return typeof range.start === 'number' && typeof range.end === 'number' &&
  range.start >= 0 && range.end >= 0 && range.start < range.end;
}

const validateOneQuery = (value) => {
  return value && typeof value === 'string' && value.length < 200 && value.length > 0;
}

const validateIndex = (start) => {
  return typeof start === 'number' && start >= 0
}

const validateKeywords = (keywords) => {
  return Array.isArray(keywords) && keywords.length > 0 && keywords.length <= 100 &&
  !keywords.find((k) => k.length > 30);
};

module.exports = route;

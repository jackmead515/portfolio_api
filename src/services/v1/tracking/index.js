const express = require('express');
const { authenticate } = require('../../../middleware/authenticate');
var { mongoose } = require('../../../db/mongoose');
var { Guide } = require('../../../db/models/Guide');
var { Analytics } = require('../../../db/models/Analytics');

var route = require('express').Router();

route.post('/get_tracking', function(req, res) {
  const { searchTitle } = req.body;

  if(searchTitle) {
    Analytics.findOne({searchTitle}, (err, a) => {
      if(err) {
        console.log(err);
        res.send({status: 400});
      } else {
        if(a) {
          res.send({tracking: a, status: 200});
        } else {
          res.send({status: 400});
        }
      }
    });
  } else {
    res.send({status: 400, message: "searchTitle param required"});
  }
});

route.post('/popular', function(req, res) {
  const { amount } = req.body;

  Analytics.aggregate([
    { $project: {
      views: {$max: '$activeViews'},
      links: {$max: '$activeLinks'},
      searches: {$max: '$activeSearches'},
      guideId: '$guideId',
      searchTitle: '$searchTitle',
      heading: '$heading',
    }},
    { $group: {
        _id: '$_id',
        views: { $first: '$views'},
        links: { $first: '$links'},
        searches: { $first: '$searches'},
        score: {$sum: { $add: ['$views', '$links', '$searches']}},
        guideId: { $first: '$guideId' },
        searchTitle: { $first: '$searchTitle' },
        heading: { $first: '$heading' },
    }},
    { "$sort": { score: -1 }},
    { "$limit": (amount && typeof amount === 'number' && amount <= 10 ? amount : 3) }
  ], (err, guides) => {
    if(err) {
      res.send({status: 400});
    } else {
      if(guides) {
        guidePromises = guides.map((g) => {
          return new Promise((resolve, reject) => {
              Guide.findOne({searchTitle: g.searchTitle, 'head.private': false}, {searchTitle: 1}, (err, dbGuide) => {
                if(!err && dbGuide) {
                  resolve(g);
                } else {
                  resolve(null);
                }
              });
          });
        });

        Promise.all(guidePromises).then((pguides) => {
          pguides = pguides.filter((g) => g !== null);
          res.send({status: 200, guides: pguides});
        });
      } else {
        res.send({status: 200, guides: []})
      }
    }
  });
});

route.post('/clicked_link', function(req, res) {
  const { searchTitle } = req.body;

  if(validateOneQuery(searchTitle)) {
    Analytics.findOne({searchTitle}, (err, a) => {
      if(err) {
        console.log(err);
        res.send({status: 400});
      } else {
        if(a) {

          a.activeLinks+=1;

          a.save(() => {
            res.send({status: 200});
          }).catch((err) => {
            console.log(err);
            res.send({status: 400});
          });

        } else {

          Guide.findOne({searchTitle}, (err, g) => {
            if(err) {
              console.log(err);
              res.send({status: 400});
            } else {
              if(g) {

                let ana = new Analytics({
                  heading: g.head.heading,
                  searchTitle: g.searchTitle,
                  guideId: g._id,
                  activeSearches: 0,
                  activeViews: 0,
                  activeLinks: 1
                });

                ana.save().catch((err) => console.log(err));

                res.send({status: 200});

              } else {
                res.send({status: 400});
              }
            }
          });

        }
      }
    });
  } else {
      res.send({status: 400, message: 'Invalid parameter'})
  }
});

const validateOneQuery = (value) => {
  return typeof value === 'string' && value.length <= 500 && value.length > 0;
}

module.exports = route;

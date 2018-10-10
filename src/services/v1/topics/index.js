const express = require('express');
const { authenticate, admin_authenticate } = require('../../../middleware/authenticate');
var { mongoose } = require('../../../db/mongoose');
var { Guide } = require('../../../db/models/Guide');
var { Topic } = require('../../../db/models/Topic');

var route = require('express').Router();

route.post('/get_topics', function(req, res) {
    Topic.find({}, (err, topics) => {
      if(err){
        res.send({status: 400});
      } else {
        if(topics) {
          res.send({topics, status: 200});
        } else {
          res.send({topics: [], status: 200});
        }
      }
    });
});

route.post('/add_guide', admin_authenticate, function(req, res) {
  const { topicId, guideId } = req.body;

  Guide.findOne({_id: guideId}, (err, g) => {
    if(err) {
      res.send({status: 400, message: err});
    } else {
      if(g) {

        Topic.findOne({_id: topicId}, (err, t) => {
          if(err) {
            res.send({status: 400, message: err});
          } else {
            if(t) {

              let inTopic = t.guides.find((d) => {
                return d.searchTitle === g.searchTitle ||
                       d.guideId === guideId ||
                       d.heading === g.head.heading;
              });

              if(inTopic) {

                res.send({status: 400, message: 'Guide is already in Topic'});

              } else {

                g.topics.push({title: t.title, topicId: t._id});
                t.guides.push({guideId, searchTitle: g.searchTitle, heading: g.head.heading});

                t.save().then(() => {
                  g.save().then(() => {
                    res.send({status: 200});
                  }).catch((err) => {
                    res.send({status: 400, message: err});
                  })
                }).catch((err) => {
                  res.send({status: 400, message: err});
                })

              }
            } else {
              res.send({status: 400, message: 'Topic not found'});
            }
          }
        });

      } else {
        res.send({status: 400, message: 'Guide not found'});
      }
    }
  });
});

route.post('/remove_guide', admin_authenticate, function(req, res) {
  const { topicId, guideId } = req.body;

  Guide.findOne({_id: guideId}, (err, g) => {
    if(err) {
      res.send({status: 400, message: err});
    } else {
      if(g) {

        Topic.findOne({_id: topicId}, (err, t) => {
          if(err) {
            res.send({status: 400, message: err});
          } else {
            if(t) {

              t.guides.filter((d) => {
                return d.searchTitle === g.searchTitle ||
                       d.guideId === guideId ||
                       d.heading === g.head.heading;
              });

              g.topics.filter((d) => {
                return d.title === t.title ||
                      d.topicId === t._id
              });

              t.save().then(() => {
                g.save().then(() => {
                  res.send({status: 200});
                }).catch((err) => {
                  res.send({status: 400, message: err});
                })
              }).catch((err) => {
                res.send({status: 400, message: err});
              })

            } else {
              res.send({status: 400, message: 'Topic not found'});
            }
          }
        });

      } else {
        res.send({status: 400, message: 'Guide not found'});
      }
    }
  });
});

route.post('/save', admin_authenticate, function(req, res) {
  const { topic } = req.body;

  Topic.findOne({title: topic.title}, (err, dbtopic) => {
    if(err) {
      console.log(err);
      res.send({status: 400, message: err});
    } else {

      if(dbtopic) {
        dbtopic.title = topic.title;
        dbtopic.guides = topic.guides;

        dbtopic.save().then(() => {
          res.send({dbtopic, status: 200});
        }).catch((err) => {
          res.send({message: err, status: 400});
        })

      } else {
        var t = new Topic(topic);

        t.save().then(() => {
          res.send({topic, status: 200});
        }).catch((err) => {
          res.send({message: err, status: 400});
        });
      }
    }
  });
});

route.post('/delete', admin_authenticate, function(req, res) {
  const { title, id } = req.body;

  Topic.findOneAndRemove({
    $or: [
      { title: title },
      { _id: id }
    ]}, (err, dbGuide) => {
      if(err) {
        console.log(err);
        res.send({status: 400, message: err});
      } else {
        res.send({status: 200});
      }
  });
});

module.exports = route;

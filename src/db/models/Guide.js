const mongoose = require('mongoose');

var GuideSchema = new mongoose.Schema({
  "searchTitle": {
    unique: true,
    type: String,
    required: true,
    minlength: 1,
    maxlength: 500
  },
  "head": {
    "private": {
      type: Boolean,
      default: true
    },
    "tags": [
      {
        type: String,
        minlength: 1,
        maxlength: 20,
        trim: true,
        lowercase: true
      }
    ],
    "date": {
      "time": {
        type: Number,
        required: true,
        min: 0,
      },
      "style": {
        type: String,
        required: false,
        minlength: 1,
        maxlength: 200
      }
    },
    "heading": {
      unique: true,
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500
    },
    "subHeading": {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500
    }
  },
  "content": [
    {
      "type": {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 10
      },
      "content": {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 10000
      },
      "style": {
        type: String,
        required: false,
        minlength: 1,
        maxlength: 500
      },
      "title": {
        type: String,
        required: false,
        minlength: 1,
        maxlength: 50
      },
      "icon": {
        type: String,
        required: false,
        minlength: 1,
        maxlength: 50
      }
    }
  ]
});

var Guide = mongoose.model('Guides', GuideSchema);

module.exports = {
  Guide: Guide
}

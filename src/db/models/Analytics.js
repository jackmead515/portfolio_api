const mongoose = require('mongoose');

var AnalyticsSchema = new mongoose.Schema({
    guideId: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 50,
      trim: true,
      unique: true
    },
    heading: {
      unique: true,
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500
    },
    searchTitle: {
      unique: true,
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500
    },
    activeViews: {
      type: Number
    },
    activeLinks: {
      type: Number
    },
    activeSearches: {
      type: Number
    },
});

var Analytics = mongoose.model('Analytics', AnalyticsSchema);

module.exports = {
  Analytics
}

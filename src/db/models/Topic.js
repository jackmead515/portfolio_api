const mongoose = require('mongoose');

var TopicSchema = new mongoose.Schema({
    title: {
      unique: true,
      type: String,
      required: true,
      minlength: 1,
      maxlength: 50
    },
    guides: [{
      guideId: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 50,
        trim: true,
      },
      searchTitle: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 500
      },
      heading: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 500
      },
    }]
});

var Topic = mongoose.model('Topics', TopicSchema);

module.exports = {
  Topic
}

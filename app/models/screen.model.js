const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  requireLogin = require('../middlewares/requireLogin');

const ScreenSchema = new Schema({
  name: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    lowercase: true,
  },
  widgets: [
    {
      id: {
        type: Schema.ObjectId,
        ref: 'Widgets',
      },
      pos: {
        x: Number,
        y: Number,
      },
      size: {
        width: Number,
        height: Number,
      },
    },
  ],
});

ScreenSchema.set('timestamps', true);
ScreenSchema.set('collection', 'screens');
ScreenSchema.set('versionKey', false);
// SolutionSchema.index({ 'email.addr': 1 });

module.exports.modelRestify = mongoose.main_conn.model('Screens', ScreenSchema);
module.exports.preMiddleware = requireLogin.validToken;

const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  requireLogin = require('../middlewares/requireLogin');

const WidgetSchema = new Schema({
  name: {
    type: String,
    required: true,
    // unique: true,
    trim: true,
    lowercase: true,
  },
  type: String,
});

WidgetSchema.set('timestamps', true);
WidgetSchema.set('collection', 'widgets');
WidgetSchema.set('versionKey', false);
// SolutionSchema.index({ 'email.addr': 1 });

module.exports.modelRestify = mongoose.main_conn.model('Widgets', WidgetSchema);
module.exports.preMiddleware = requireLogin.validToken;

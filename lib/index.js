'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash.merge');

var _lodash2 = _interopRequireDefault(_lodash);

var _aorGraphqlClient = require('aor-graphql-client');

var _aorGraphqlClient2 = _interopRequireDefault(_aorGraphqlClient);

var _buildQuery = require('./buildQuery');

var _buildQuery2 = _interopRequireDefault(_buildQuery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOptions = {
    queryBuilder: _buildQuery2.default
};

exports.default = function (options) {
    return (0, _aorGraphqlClient2.default)((0, _lodash2.default)({}, defaultOptions, options));
};
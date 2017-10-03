'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.buildApolloArgs = exports.buildArgs = exports.getArgType = exports.buildFields = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends9 = require('babel-runtime/helpers/extends');

var _extends10 = _interopRequireDefault(_extends9);

var _constants = require('aor-graphql-client/lib/constants');

var _graphql = require('graphql');

var _graphqlify = require('./graphqlify');

var _getFinalType = require('./getFinalType');

var _getFinalType2 = _interopRequireDefault(_getFinalType);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buildFields = exports.buildFields = function buildFields(introspectionResults) {
    return function (fields) {
        return fields.reduce(function (acc, field) {
            var type = (0, _getFinalType2.default)(field.type);

            if (type.name.startsWith('_')) {
                return acc;
            }

            if (type.kind !== _graphql.TypeKind.OBJECT) {
                return (0, _extends10.default)({}, acc, (0, _defineProperty3.default)({}, field.name, {}));
            }

            var linkedResource = introspectionResults.resources.find(function (r) {
                return r.type.name === type.name;
            });

            if (linkedResource) {
                return (0, _extends10.default)({}, acc, (0, _defineProperty3.default)({}, field.name, { fields: { id: {} } }));
            }

            var linkedType = introspectionResults.types.find(function (t) {
                return t.name === type.name;
            });

            if (linkedType) {
                return (0, _extends10.default)({}, acc, (0, _defineProperty3.default)({}, field.name, { fields: buildFields(introspectionResults)(linkedType.fields) }));
            }

            // NOTE: We might have to handle linked types which are not resources but will have to be careful about
            // ending with endless circular dependencies
            return acc;
        }, {});
    };
};

var getArgType = exports.getArgType = function getArgType(arg) {
    if (arg.type.kind === _graphql.TypeKind.NON_NULL) {
        return arg.type.ofType.name + '!';
    }

    return arg.type.name;
};

var buildArgs = exports.buildArgs = function buildArgs(query, variables) {
    if (query.args.length === 0) {
        return {};
    }

    var validVariables = Object.keys(variables).filter(function (k) {
        return typeof variables[k] !== 'undefined' && variables[k] !== null;
    });
    var args = query.args.filter(function (a) {
        return validVariables.includes(a.name);
    }).reduce(function (acc, arg) {
        return (0, _extends10.default)({}, acc, (0, _defineProperty3.default)({}, '' + arg.name, '$' + arg.name));
    }, {});

    return args;
};

var buildApolloArgs = exports.buildApolloArgs = function buildApolloArgs(query, variables) {
    if (query.args.length === 0) {
        return {};
    }

    var validVariables = Object.keys(variables).filter(function (k) {
        return typeof variables[k] !== 'undefined' && variables[k] !== null;
    });

    var args = query.args.filter(function (a) {
        return validVariables.includes(a.name);
    }).reduce(function (acc, arg) {
        if (arg.name.endsWith('Ids')) {
            return (0, _extends10.default)({}, acc, (0, _defineProperty3.default)({}, '$' + arg.name, '[ID!]!'));
        }

        if (arg.name.endsWith('Id')) {
            return (0, _extends10.default)({}, acc, (0, _defineProperty3.default)({}, '$' + arg.name, 'ID!'));
        }

        return (0, _extends10.default)({}, acc, (0, _defineProperty3.default)({}, '$' + arg.name, getArgType(arg)));
    }, {});

    return args;
};

exports.default = function (introspectionResults) {
    return function (resource, aorFetchType, queryType, variables) {
        var apolloArgs = buildApolloArgs(queryType, variables);
        var args = buildArgs(queryType, variables);
        var fields = buildFields(introspectionResults)(resource.type.fields);
        if (aorFetchType === _constants.GET_LIST || aorFetchType === _constants.GET_MANY || aorFetchType === _constants.GET_MANY_REFERENCE) {
            var _result = (0, _graphqlify.encodeQuery)(queryType.name, {
                params: apolloArgs,
                fields: {
                    items: {
                        field: queryType.name,
                        params: args,
                        fields: fields
                    },
                    total: {
                        field: '_' + queryType.name + 'Meta',
                        params: args,
                        fields: { count: {} }
                    }
                }
            });

            return _result;
        }

        if (aorFetchType === _constants.DELETE) {
            return (0, _graphqlify.encodeMutation)(queryType.name, {
                params: apolloArgs,
                fields: {
                    data: {
                        field: queryType.name,
                        params: args,
                        fields: { id: {} }
                    }
                }
            });
        }

        var query = {
            params: apolloArgs,
            fields: {
                data: {
                    field: queryType.name,
                    params: args,
                    fields: fields
                }
            }
        };

        var result = _constants.QUERY_TYPES.includes(aorFetchType) ? (0, _graphqlify.encodeQuery)(queryType.name, query) : (0, _graphqlify.encodeMutation)(queryType.name, query);

        return result;
    };
};

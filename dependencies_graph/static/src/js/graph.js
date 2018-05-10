odoo.define('dependencies_graph.graph', function (require) {
    "use strict";

    var w = window['dependencies_graph'] = {};
    var session = require('web.session');

    var filter = function (string, keywords) {
        return _.every(keywords, function (k) {
            return string.toLowerCase().includes(k.toLowerCase());
        });
    };

    var selector = '#graph';
    var options = {
        configure: {
            enabled: true,
            filter: 'layout',
            showButton: true
        },
        physics: {
            stabilization: false
        },
    };

    w.generate = function () {
        var type = $('#type').val();
        var module = $('#module').val();
        var keywords = $('#keywords').val().split(" ");

        window.dependencies_graph[type](module, keywords).done(function (network) {
            console.log('generated', module, keywords);

            // network.on("configChange", function () {
            //     // this will immediately fix the height of the configuration
            //     // wrapper to prevent unecessary scrolls in chrome.
            //     // see https://github.com/almende/vis/issues/1568
            //     var div = $('.vis-configuration-wrapper');
            //     var top = div.scrollTop();
            //     _.delay(function () {
            //         $('.vis-configuration-wrapper').scrollTop(top)
            //     }, 0);
            // });
        });
    };

    w.type_changed = function () {
        var type = $('#type').val();
        var module = $('#module');
        var keywords = $('#keywords');

        switch (type) {
            case 'module_children':
                module.prop('disabled', false);
                keywords.prop('disabled', true);
                keywords.val('');
                break;
            case 'module_parents':
                module.prop('disabled', false);
                keywords.prop('disabled', true);
                keywords.val('');
                break;
            case 'module_graph':
                module.prop('disabled', false);
                keywords.prop('disabled', false);
                break;
            case 'js_graph':
                module.prop('disabled', true);
                module.val('');
                keywords.prop('disabled', false);
                break;
        }
    };

    w.module_children = function (module, keywords) {
        var promise = $.Deferred();
        session.rpc('/dependencies_graph/' + module).done(function (result) {
            var deps = JSON.parse(result);
            var nodes = new vis.DataSet([]);
            var edges = new vis.DataSet([]);

            var modules = [module];
            while (modules.length > 0) {
                var m = modules.shift();
                var children = _.filter(_.keys(deps), function (k) {
                    return _.contains(deps[k], m);
                });
                modules = _.union(modules, children);

                nodes.update({id: m, label: m});
                _.each(children, function (child) {
                    if (!nodes.get(child)) {
                        nodes.update({id: child, label: child});
                        edges.update({from: m, to: child, arrows: 'to'})
                    }
                })
            }

            // create a network
            var container = $(selector)[0];
            var data = {
                nodes: nodes,
                edges: edges
            };
            options['configure']['container'] = $('#settings')[0];
            var network = new vis.Network(container, data, options);

            promise.resolve(network);
        });
        return promise;
    };

    w.module_parents = function (module, keywords) {
        var promise = $.Deferred();
        session.rpc('/dependencies_graph/' + module).done(function (result) {
            var deps = JSON.parse(result);
            var nodes = new vis.DataSet([]);
            var edges = new vis.DataSet([]);

            var modules = [module];
            while (modules.length > 0) {
                var m = modules.shift();
                var parents = deps[m];
                modules = _.union(modules, parents);

                nodes.update({id: m, label: m});
                _.each(parents, function (p) {
                    if (!nodes.get(p)) {
                        nodes.update({id: p, label: p});
                        edges.update({from: p, to: m, arrows: 'to'})
                    }
                })
            }

            // create a network
            var container = $(selector)[0];
            var data = {
                nodes: nodes,
                edges: edges
            };
            options['configure']['container'] = $('#settings')[0];
            var network = new vis.Network(container, data, options);

            promise.resolve(network);
        });
        return promise;
    };

    w.module_graph = function (module, keywords) {
        var promise = $.Deferred();
        session.rpc('/dependencies_graph/' + module).done(function (result) {
            var deps = JSON.parse(result);
            var nodes = new vis.DataSet([]);
            var edges = new vis.DataSet([]);

            _.each(_.keys(deps), function (dep) {
                if (filter(dep, keywords) || dep === module) {
                    nodes.add({id: dep, label: dep});
                }
            });

            _.each(deps, function (value, key) {
                _.each(value, function (dep) {
                    if (filter(key, keywords) && filter(dep, keywords) || dep === module) {
                        edges.add({from: dep, to: key, arrows: 'to'})
                    }
                })
            });

            // create a network
            var container = $(selector)[0];
            var data = {
                nodes: nodes,
                edges: edges
            };
            options['configure']['container'] = $('#settings')[0];
            var network = new vis.Network(container, data, options);

            promise.resolve(network);
        });
        return promise;
    };

    w.js_graph = function (module, keywords) {
        var promise = $.Deferred();
        var nodes = new vis.DataSet([]);
        var edges = new vis.DataSet([]);

        _.each(window.odoo.__DEBUG__.services, function (value, key) {
            if (typeof value === 'function' && filter(key, keywords)) {
                nodes.add({id: key, label: key, value: value})
            }
            if (typeof value === 'object') {
                _.each(value, function (v, k) {
                    if (typeof v === 'function') {
                        var name = key.concat('.', k);
                        if (filter(name, keywords)) {
                            nodes.add({id: name, label: name, value: v});
                        }
                    }
                })
            }
        });

        _.each(nodes._data, function (x) {
            _.each(nodes._data, function (y) {
                if (x['value'].prototype && x['value'].prototype.__proto__.constructor === y['value']) {
                    edges.add({from: y['id'], to: x['id'], arrows: 'to'})
                }
            })

        });

        // create a network
        var container = $(selector)[0];
        var data = {
            nodes: nodes,
            edges: edges
        };
        options['configure']['container'] = $('#settings')[0];
        var network = new vis.Network(container, data, options);

        promise.resolve(network);
        return promise;
    };
});

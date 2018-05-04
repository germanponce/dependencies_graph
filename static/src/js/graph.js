odoo.define('dependencies_graph.graph', function (require) {
    "use strict";

    var session = require('web.session');

    var filter = function (string, keywords) {
        return _.every(keywords, function (k) {
            return string.toLowerCase().includes(k.toLowerCase());
        });
    };

    var graph_options = {
        layout: {
            improvedLayout: true,
            hierarchical: {
                enabled: false,
                nodeSpacing: 100,
                treeSpacing: 200,
                blockShifting: true,
                edgeMinimization: true,
                parentCentralization: true,
                direction: 'UD',        // UD, DU, LR, RL
                sortMethod: 'hubsize'   // hubsize, directed
            }
        }
    };

    var tree_options = {
        physics: false,
        layout: {
            improvedLayout: true,
            hierarchical: {
                enabled: true,
                // levelSeparation: 250,
                nodeSpacing: 50,
                treeSpacing: 50,
                blockShifting: true,
                edgeMinimization: true,
                parentCentralization: false,
                direction: 'LR',        // UD, DU, LR, RL
            }
        }
    };

    window.odoo_children = function (selector) {
        var module = prompt('write a module name');
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
                    nodes.update({id: child, label: child});
                    edges.update({from: m, to: child, arrows: 'to'})
                })
            }
            ;

            // create a network
            var container = $(selector)[0];
            var data = {
                nodes: nodes,
                edges: edges
            };
            var network = new vis.Network(container, data, tree_options);

            return network
        });
    };

    window.odoo_graph = function (selector) {
        var module = prompt('write a module name if you want to filter by a module');
        session.rpc('/dependencies_graph/' + module).done(function (result) {
            var deps = JSON.parse(result);
            var nodes = new vis.DataSet([]);
            var edges = new vis.DataSet([]);

            var keywords = prompt('write keywords separated by spaces to filter').split(" ");

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
            var network = new vis.Network(container, data, graph_options);

            return network
        });
    };

    window.js_graph = function (selector) {
        var keywords = prompt('write keywords separated by spaces to filter').split(" ");
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
        var network = new vis.Network(container, data, tree_options);

        return network
    };
});

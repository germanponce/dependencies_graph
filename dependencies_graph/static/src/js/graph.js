odoo.define('dependencies_graph.graph', function (require) {
    "use strict";

    var session = require('web.session');

    var w = window['dependencies_graph'] = {};
    var selector = '#graph';
    var options = {
        configure: {
            enabled: true,
            filter: 'layout',
            showButton: true
        },
        physics: {
            stabilization: false
        }
    };

    w.get_js_services = function () {
        var services = {};
        _.each(window.odoo.__DEBUG__.services, function (value, key) {
            if (typeof value === 'function') {
                services[key] = value;
            }
            if (typeof value === 'object') {
                _.each(value, function (v, k) {
                    if (typeof v === 'function') {
                        var name = key.concat('.', k);
                        services[name] = v;
                    }
                })
            }
        });
        return services;
    };

    w.set_js_services = function () {
        var services = w.get_js_services();
        var module = $('#js-module');
        _.each(services, function (value, key) {
            module
                .append($("<option></option>")
                    .attr("value", key)
                    .text(key));
        });
        module.chosen({search_contains: true});
    };

    w.set_odoo_modules = function () {
        var module = $('#odoo-module');
        session.rpc('/dependencies_graph/modules').done(function (result) {
            var deps = JSON.parse(result);
            _.each(deps, function (value, key) {
                module
                    .append($("<option></option>")
                        .attr("value", key)
                        .text(key));
            });
            module.chosen({search_contains: true});
        });
    };

    w.generate = function () {
        var type = $('#type').val();
        var odoo_module = $('#odoo-module').val();
        var js_services = $('#js-module').val();
        var acyclic_graph = $('#acyclic-graph:checked').length === 1;
        var module;

        if (_.contains(['module_parents', 'module_children'], type)) {
            module = odoo_module;
        }
        if (_.contains(['js_parents', 'js_children'], type)) {
            module = js_services;
        }

        window.dependencies_graph[type](module, acyclic_graph).done(function () {
            console.log('generated', type, module);
        });
    };

    w.type_changed = function () {
        var type = $('#type').val();
        var odoo_module = $('#odoo-module').parents('.form-group');
        var js_services = $('#js-module').parents('.form-group');
        var acyclic_graph = $('#acyclic-graph').parents('.form-group');

        switch (type) {
            case 'module_parents':
            case 'module_children':
                odoo_module.show();
                js_services.hide();
                acyclic_graph.show();
                w.set_odoo_modules();
                break;
            case 'js_parents':
            case 'js_children':
                odoo_module.hide();
                js_services.show();
                acyclic_graph.hide();
                w.set_js_services();
                break;
        }
    };

    $(w.type_changed);

    w.module_children = function (module, acyclic_graph) {
        var promise = $.Deferred();
        session.rpc('/dependencies_graph/modules').done(function (result) {
            var deps = JSON.parse(result);
            var nodes = new vis.DataSet([]);
            var edges = new vis.DataSet([]);

            var modules = [module];
            while (modules.length > 0) {
                var m = modules.shift();
                var children = _.filter(_.keys(deps), function (k) {
                    return _.contains(deps[k]['depends'], m);
                });
                modules = _.union(modules, children);

                nodes.update({id: m, label: m});
                _.each(children, function (child) {
                    if (!(acyclic_graph && nodes.get(child))) {
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

    w.module_parents = function (module, acyclic_graph) {
        var promise = $.Deferred();
        session.rpc('/dependencies_graph/modules').done(function (result) {
            var deps = JSON.parse(result);
            var nodes = new vis.DataSet([]);
            var edges = new vis.DataSet([]);

            var modules = [module];
            while (modules.length > 0) {
                var m = modules.shift();
                var parents = deps[m]['depends'];
                modules = _.union(modules, parents);

                nodes.update({id: m, label: m});
                _.each(parents, function (p) {
                    if (!(acyclic_graph && nodes.get(p))) {
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

    w.js_parents = function (module, acyclic_graph) {
        var promise = $.Deferred();
        var nodes = new vis.DataSet([]);
        var edges = new vis.DataSet([]);
        var services = w.get_js_services();

        var modules = _.pairs(_.pick(services, module));

        while (modules.length > 0) {
            var m = modules.pop()
            var x = m[0];
            var x_value = m[1];
            nodes.update({id: x, label: x});
            _.each(services, function (y_value, y) {
                if (x_value.prototype && x_value.prototype.__proto__.constructor === y_value) {
                    nodes.update({id: y, label: y});
                    edges.add({from: y, to: x, arrows: 'to'});

                    modules.push([y, y_value]);
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
        return promise;
    };

    w.js_children = function (module, acyclic_graph) {
        var promise = $.Deferred();
        var nodes = new vis.DataSet([]);
        var edges = new vis.DataSet([]);
        var services = w.get_js_services();

        var modules = _.pairs(_.pick(services, module));

        while (modules.length > 0) {
            var m = modules.pop()
            var x = m[0];
            var x_value = m[1];
            nodes.update({id: x, label: x});
            _.each(services, function (y_value, y) {
                if (y_value.prototype && y_value.prototype.__proto__.constructor === x_value) {
                    nodes.update({id: y, label: y});
                    edges.add({from: x, to: y, arrows: 'to'})

                    modules.push([y, y_value]);
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
        return promise;
    };
});

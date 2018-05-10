# -*- coding: utf-8 -*-
import json
from odoo import http

import odoo
import odoo.modules.db
import odoo.modules.graph
from odoo.modules.registry import Registry


class DependenciesGraph(http.Controller):
    @http.route('/dependencies_graph/<string:module_name>', type='json', auth="none")
    def get_graph(self, module_name):
        dbname = odoo.tools.config['db_name']
        cr = Registry.new(dbname)._db.cursor()
        graph = odoo.modules.graph.Graph()

        states = ['installed', 'to upgrade', 'to remove']
        cr.execute("SELECT name from ir_module_module WHERE state IN %s", (tuple(states),))
        module_list = [name for (name,) in cr.fetchall() if name not in graph]

        graph.add_modules(cr, module_list)
        if module_name is graph:
            graph = graph[module_name]

        deps = {}
        for key, value in graph.iteritems():
            deps[key] = value.info['depends']

        return json.dumps(deps)

    @http.route('/dependencies_graph/graph/', auth='public', website=True)
    def index(self, **kw):
        return http.request.render('dependencies_graph.graph')

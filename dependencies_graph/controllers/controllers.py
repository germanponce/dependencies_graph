# -*- coding: utf-8 -*-
import json

import odoo
from odoo import http
import odoo.modules.graph


class DependenciesGraph(http.Controller):

    @http.route('/dependencies_graph/graph/', auth='user')
    def index(self, **kw):
        return http.request.render('dependencies_graph.graph')

    @http.route('/dependencies_graph/modules', type='json', auth='user')
    def get_graph(self):
        cr = http.request.cr
        graph = odoo.modules.graph.Graph()

        cr.execute("SELECT name, state FROM ir_module_module")
        graph.add_modules(cr, map(lambda m: m[0], cr.fetchall()))

        response = {}
        for key, value in graph.iteritems():
            response[key] = {}
            response[key]['depends'] = value.info['depends']
            response[key]['name'] = value.info['name']
            response[key]['state'] = value.state

        return json.dumps(response)

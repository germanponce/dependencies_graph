# -*- coding: utf-8 -*-
from odoo import http

# class DependenciesGraph(http.Controller):
#     @http.route('/dependencies_graph/dependencies_graph/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/dependencies_graph/dependencies_graph/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('dependencies_graph.listing', {
#             'root': '/dependencies_graph/dependencies_graph',
#             'objects': http.request.env['dependencies_graph.dependencies_graph'].search([]),
#         })

#     @http.route('/dependencies_graph/dependencies_graph/objects/<model("dependencies_graph.dependencies_graph"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('dependencies_graph.object', {
#             'object': obj
#         })

# Odoo Dependencies Graph

This tool is aimed to help software developers to get a better understanding of the dependencies among the installed modules in an Odoo application.
It also shows the dependencies graph of the JavaScript files defined in Odoo.

We use the library [vis.js](http://visjs.org/) to render the graph.

## Types of graph

1. Odoo Module Children

    Given an Odoo module it shows every module that depends of him directly or indirectly.
    
2. Odoo Module Parents

    Given an Odoo module it shows every module in which the module depends on. These are every modules that needs to be installed before him.
    
3. JavaScript Graph

    This is the graph of every JavaScript file declared using `odoo.define()` function. Every dependency is declared using `require()` function from Odoo.
    
    
In the `keywords` input you can filter the nodes shown in the graph.
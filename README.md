indoor-json
===========

This document specifies a GeoJSON variant used by indoor.io toolset to define indoor maps. This format is called IndoorJSON.

Included is also a JavaScript validator that can be used to validate a given file to be valid IndoorJSON.

Features
==

IndoorJSON may consist of any number of Features and/or FeatureCollections. All Features are interpreted similarly regardless of their grouping into nested FeatureCollections.

Geometry Types
==

IndoorJSON supports all GeoJSON geometry types.

`Point` and geometry types are interpreted as general Points of Interest. `MultiPoint` geometry type equals multiple similar `Point` geometries.

`LineString` and `MultiLineString` are interpreted as walls, doorways and level connectors.

`Polygon` and `MultiPolygon` are interpreted as open areas, e.g. rooms, halls, corridors. Typically, `Polygon` boundaries match respective `LineString` geometries, but it is equally possible for a single polygon to cover a larger area. 

`GeometryCollection` geometries are interpreted similarly as if included geometries had been specified outside of the collection.

Please note that even if `Polygon` and `MultiPolygon` geometries typically designate rooms, there MAY be multiple such geometries overlapping each other.

Please not that if `LineString` geometries intersect each other on a given level, they are interpreted as if there had been multiple similar `LineString`s joining at the intersection point. Therefore it is recommended that IndoorJSON files do not contain intersecting `LineString`s residing on the same level.

Properties
==

Each IndoorJSON Feature MAY have the following properties:

- `level`: an integer designating the floor number of the Feature. Typically it is assumed that `0` means ground level. If not present, defaults to `0`.

- `geomType`: an object containing additional information for the visualization of the geometry. This could be for instance specifying whether the geometry is a pillar (for `Point` geometries), a wall, doorway, window or railing (for `LineString` geometries), or a regular floor, blocked area or hole (for `Polygon` geometries), or a elevator, stairway or escalator (for `LineString` geometries with `connector` property).

Features with `Point`, `MultiPoint`, `LineString` or `MultiLineString` geometry type may have the following properties:

- `accessible`: a boolean value indicating whether the point or line is accessible e.g. if it can be walked through. If not present, defaults to `false`.

Features with `LineString` geometry type may have the following properties:

- `connector`: a boolean value indicating whether this line designates a connecting line between floors. 

- `direction`: an integer designating the direction that this connector may be used for. `0` means both ways, `1` means only up, `2` means only down.

For `connector` features, the `level` property is interpreted as the level of the level above. The level below is interpreted to be `level - 1`. If a `connector` feature has a `level` property that equals the lowest level in the file, that connector is not accessible.

Of course, typically IndoorJSON features also have other properties, like store names, descriptions, phone numbers, etc.

Validation
==

All valid GeoJSON files are also valid IndoorJSON files. 

This project includes a simple validator that can be run using Node.js:

```
$ node validate.js indoor-example.json
```

or used within another Node.js program like this:

```javascript
var jsonobj = { type: 'Point', geometry: [ 10, 20 ] };
var validateIndoorJSON = require('indoor-json');
if( validateIndoorJSON(jsonobj) ) {	
    // validated       
}			      
```

In fact, it can also be used in any browser-side JavaScript as well.

Because all GeoJSON files are also valid IndoorJSON files, this can be used as a generic GeoJSON validator as well.
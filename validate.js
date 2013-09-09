
if( typeof process != 'undefined' ) {
    if( typeof process.argv[2] != 'string' ) {
	process.stderr.write('usage: node validate.js [indoorjson-file]\n');
	process.exit(1);
	return;
    }

    try {
	var json = JSON.parse(require('fs').readFileSync
			      (process.argv[2]).toString('utf8'));
    } catch(err) {
	process.stderr.write('invalid JSON at ' + process.argv[2] + '\n');
	process.exit(1);
	return;
    }

    var res = validateGeoJSON(json, true);
    if( res ) {
	process.stderr.write('invalid GeoJSON: ' + res + '\n');
	process.exit(1);
	return;
    } else 
	process.exit(0);
}

function validateCoords(c) {
    var res = validateArray(c);
    if( res )
	return res;
    if( c.length < 2 )
	return 'not enough coordinates';
    for( var ci = 0; ci < c.length; ci++ ) {
	if( typeof c[ci] != 'number' ) 
	    return 'non-number coordinates';
	if( isNaN(c[ci]) )
	    return 'NaN coordinates';
    }
    return null;
}

function validateArray(arr) {
    if( arr == null )
	return 'null array';
    else if( typeof arr != 'object' )
	return 'non-object array';
    else if( typeof arr.length != 'number' )
	return 'unknown array length';
    else if( Math.floor(arr.length) != arr.length )
	return 'non-integer geometries array length';
    else {
	for( var ai = 0; ai < arr.length; ai++ ) 
	    if( typeof arr[ai] == 'undefined' )
		return 'undefined array element';
	for( var a in arr ) { 
	    if( a == 'length' )
		continue;
	    if( a.match(/^[0-9]+$/) ) {
		var aint = parseInt(a);
		if( a < 0 || a >= arr.length )
		    return 'unknown attribute in array: ' + a;
	    } else
		return 'unknown attribute in array: ' + a;
	}
    }
    return null;
}

function validateGeometry(geom, toplevel) {
    if( geom == null )
	return 'null geometry';
    else if( typeof geom != 'object' )
	return 'non-object geometry';
    else if( typeof geom.type != 'string' )
	return 'no geometry type';
    else if( geom.type == 'GeometryCollection' ) {
	var res = validateArray(geom.geometries);
	if( res )
	    return res;

	for( var gi = 0; gi < geom.geometries.length; gi++ ) {
	    var res = validateGeometry(geom.geometries[gi]);
	    if( res )
		return res;
	}

	for( var a in geom ) {
	    if( a == 'crs' && toplevel ) {
		var res = validateCRS(feat.crs);
		if( res )
		    return res;
		continue;
	    }
	    if( a != 'type' &&
		a != 'geometries' )
		return 'unknown attribute ' + a;
	}
	return null;
    } else { 
	var res = validateArray(geom.coordinates);
	if( res )
	    return res;
	if( geom.type == 'Point' ) {
	    var res = validateCoords(geom.coordinates);
	    if( res ) 
		return res;
	} else if( geom.type == 'MultiPoint' ||
		   geom.type == 'LineString' ) {
	    for( var gi = 0; gi < geom.coordinates.length; gi++ ) {
		var res = validateCoords(geom.coordinates[gi]);
		if( res )
		    return res;
	    }
	} else if( geom.type == 'MultiLineString' ||
		   geom.type == 'Polygon' ) {
	    for( var pi = 0; pi < geom.coordinates.length; pi++ ) {
		var res = validateArray(geom.coordinates[pi]);
		if( res )
		    return res;
		for( var gi = 0; gi < geom.coordinates[pi].length; gi++ ) {
		    var res = validateCoords(geom.coordinates[pi][gi]);
		    if( res )
			return res;
		}	    
	    }
	} else if( geom.type == 'MultiPolygon' ) {
	    for( var ppi = 0; ppi < geom.coordinates.length; ppi++ ) {
		var res = validateArray(geom.coordinates[ppi]);
		if( res )
		    return res;
		for( var pi = 0; pi < geom.coordinates[ppi].length; pi++ ) {
		    var res = validateArray(geom.coordinates[ppi][pi]);
		    if( res )
			return res;
		    for( var gi = 0; gi < geom.coordinates[ppi][pi].length; 
			 gi++ ) {
			var res = validateCoords(geom.coordinates[ppi][pi][gi]);
			if( res )
			    return res;
		    }	    
		}
	    }	    
	} else
	    return 'unknown geometry type';
	for( var a in geom ) {
	    if( a == 'crs' && toplevel ) {
		var res = validateCRS(feat.crs);
		if( res )
		    return res;
		continue;
	    }
	    if( a != 'type' &&
		a != 'coordinates' )
		return 'unknown attribute ' + a;
	}
	return null;
    }
}

function validateCRS(crs) {
    if( crs == null )
	return 'null crs';
    else if( typeof crs != 'object' ) 
	return 'non-object crs';
    else if( typeof crs.type != 'string' )
	return 'non-string crs type';
    else if( typeof crs.properties != 'object' )
	return 'non-object crs properties';
    for( var a in crs )
	if( a != 'type' &&
	    a != 'properties' )
	    return 'unknown attribute in crs: ' + a;
    return null;
}

function validateFeature(feat, toplevel) {
    if( feat == null )
	return 'null feature';
    else if( typeof feat != 'object' )
	return 'non-object feature';
    else if( typeof feat.type == 'string' ) {
	if( feat.type == 'Feature' ) {

	    var res = validateGeometry(feat.geometry, false);
	    if( res )
		return res;
	    
	    if( typeof feat.properties != 'object' )
		return 'no properties in a feature';

	    for( var a in feat ) {
		if( a != 'type' &&
		    a != 'geometry' &&
		    a != 'properties' )
		    return 'unknown attribute ' + a;
	    }
	} else if( feat.type == 'FeatureCollection' ) {
	    var res = validateArray(feat.features);
	    if( res )
		return res;
	    for( var fi = 0; fi < feat.features.length; fi++ ) {
		var res = validateFeature(feat.features[fi], false);
		if( res )
		    return res;
	    }
	    for( var a in feat ) {
		if( a == 'crs' && toplevel ) {
		    var res = validateCRS(feat.crs);
		    if( res )
			return res;
		    continue;
		}
		if(a != 'type' &&
		   a != 'features' ) 
		    return 'unknown attribute ' + a;
	    }
	    return null;
	} else
	    return 'invalid feature type ' + feat.type;
    } else
	return 'invalid feature';
}

function validateGeoJSON(obj, toplevel) {
    if( obj == null )
	return 'null object';
    if( typeof obj != 'object' )
	return 'non-object object';
    if( typeof obj.type != 'string' )
	return 'unknown type';
    if( obj.type == 'Feature' ||
	obj.type == 'FeatureCollection' )
	return validateFeature(obj, toplevel);
    else 
	return validateGeometry(obj, toplevel);
}




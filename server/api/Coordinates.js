var coordinates = [ {lat: 45, long: 45}];

exports.index = function(req, res){
    res.send(coordinates);
};

exports.create = function(req, res){
    var coordinate = req.body;
    coordinates.push(req.body);
    console.log('Added coordinate: ' + JSON.stringify(coordinate));
    res.send(coordinate);
};




var Q = require("q");

var processCallQueue = function(me) {
	if (!me.callQueue.length) {
		me.processingCallQueue = false;
		console.log('Done processing call queue.');
	} else {
		var fnData = me.callQueue.shift();
		fnData.fn.apply(null).then(function(result) {
			fnData.deferred.resolve(result);
		}, function(error) {
			fnData.deferred.reject(error);
		});
		setTimeout(processCallQueue, me.intervalMs, me);
	}
};

function CallSequentializer(id, intervalMs) {
	this.callQueue = [];
	this.processingCallQueue = false;
	this.intervalMs = intervalMs;
}

CallSequentializer.prototype.enqueueCall = function(fn) {
	var me = this;
	var deferred = Q.defer();
	me.callQueue.push({
		fn: fn,
		deferred: deferred
	});
	if (!me.processingCallQueue) {
		console.log('Started process call queue.');
		me.processingCallQueue = true;
		processCallQueue(me);
	}
	return deferred.promise;
};

module.exports = CallSequentializer;
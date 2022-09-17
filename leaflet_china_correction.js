L.CoordConver = function () {
    var pi = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;

    /*wgs84 -> gcj02*/
    this.WGS84ToGCJ02 = function (lng, lat) {
        if (outOfChina(lng, lat)) {
            return {
                lng: lng,
                lat: lat
            };
        };
        var dLat = transformLat(lng - 105.0, lat - 35.0);
        var dLng = transformLng(lng - 105.0, lat - 35.0);
        var radLat = lat / 180.0 * pi;
        var magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        var sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
        dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
        var mgLat = lat + dLat;
        var mgLng = lng + dLng;
        return {
            lng: mgLng,
            lat: mgLat
        };
    }

    function transformLat(x, y) {
        var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function transformLng(x, y) {
        var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
        return ret;
    }

    function outOfChina(lng, lat) {
        return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
    }
}

L.coordConver = function () {
    return new L.CoordConver()
}

L.GridLayer.include({
    _setZoomTransform: function (level, _center, zoom) {
        var center = _center;
        if (center != undefined && this.options) {
            if (this.options['attribution'].includes('GeoQ')) {
                center = L.coordConver().WGS84ToGCJ02(_center.lng, _center.lat);
            }
        }
        var scale = this._map.getZoomScale(zoom, level.zoom),
            translate = level.origin.multiplyBy(scale)
            .subtract(this._map._getNewPixelOrigin(center, zoom)).round();

        if (L.Browser.any3d) {
            L.DomUtil.setTransform(level.el, translate, scale);
        } else {
            L.DomUtil.setPosition(level.el, translate);
        }
    },
    
    _getTiledPixelBounds: function (_center) {
        var center = _center;
        if (center != undefined && this.options) {
            if (this.options['attribution'].includes('GeoQ')) {
                center = L.coordConver().WGS84ToGCJ02(_center.lng, _center.lat);
            }
        }
        var map = this._map,
            mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(),
            scale = map.getZoomScale(mapZoom, this._tileZoom),
            pixelCenter = map.project(center, this._tileZoom).floor(),
            halfSize = map.getSize().divideBy(scale * 2);

        return new L.Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
    }
})
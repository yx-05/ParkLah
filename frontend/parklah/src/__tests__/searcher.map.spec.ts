import {
  getLeafletHtml,
  calculateZoomFromLatitudeDelta,
  parseLeafletBridgeMessage,
} from '../components/SearcherMap.native';
import { ParkingSpot } from '../components/SearcherMap.types';

describe('SearcherMap (Leaflet WebView Edition)', () => {
  const mockSpots: ParkingSpot[] = [
    {
      id: 'spot-1',
      name: 'Mid Valley Bay 12',
      address: 'Mid Valley Megamall',
      rating: 4.8,
      pricePerHour: 3.0,
      distance: '150m',
      eta: '2 mins',
      availableSpots: 1,
      latitude: 3.1178,
      longitude: 101.6779,
    },
    {
      id: 'spot-2',
      name: 'The Gardens P2',
      address: 'The Gardens Mall',
      rating: 4.9,
      pricePerHour: 4.0,
      distance: '300m',
      eta: '4 mins',
      availableSpots: 3,
      latitude: 3.1185,
      longitude: 101.6765,
    },
  ];

  describe('Leaflet HTML Template Generation', () => {
    it('generates valid HTML with Leaflet CDN resources', () => {
      const html = getLeafletHtml(3.1176, 101.6778);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('leaflet@1.9.4/dist/leaflet.css');
      expect(html).toContain('leaflet@1.9.4/dist/leaflet.js');
      expect(html).toContain('id="map"');
    });

    it('embeds CartoDB Voyager tiles (OpenStreetMap-based) for sleek theme-matched styling without watermark', () => {
      const html = getLeafletHtml(3.1176, 101.6778);

      expect(html).toContain('basemaps.cartocdn.com/rastertiles/voyager');
      expect(html).toContain('maxZoom: 19');
    });

    it('appends Carto API key query parameter when provided', () => {
      const htmlWithKey = getLeafletHtml(3.1176, 101.6778, 'cb1_32bm_1_81c741f59643c4560dc385b3');
      expect(htmlWithKey).toContain('key=cb1_32bm_1_81c741f59643c4560dc385b3');

      const htmlWithoutKey = getLeafletHtml(3.1176, 101.6778);
      expect(htmlWithoutKey).not.toContain('?key=');
    });

    it('initializes map with provided coordinates and zoom level 16', () => {
      const html = getLeafletHtml(3.1412, 101.6865);

      expect(html).toContain('var initialLat = 3.1412;');
      expect(html).toContain('var initialLng = 101.6865;');
      expect(html).toContain('setView([initialLat, initialLng], 16)');
    });

    it('defines brand-styled car marker and parking spot pin styles matching Aegean theme', () => {
      const html = getLeafletHtml(3.1176, 101.6778);

      // Car marker
      expect(html).toContain('.car-marker');
      expect(html).toContain('.car-icon-inner');
      expect(html).toContain('background-color: #006d77');

      // Spot pin with Aegean dark teal and pearl aqua accents
      expect(html).toContain('.spot-pin');
      expect(html).toContain('.p-badge');
      expect(html).toContain('.spot-pin.selected');
      expect(html).toContain('background: #00535b');
      expect(html).toContain('border-color: #82d3de');

      // Fluid pinch zoom & touch options
      expect(html).toContain('zoomSnap: 0');
      expect(html).toContain('bounceAtZoomLimits: false');
      expect(html).toContain('touch-action: none');
    });

    it('implements window bridge functions for bidirectional communication', () => {
      const html = getLeafletHtml(3.1176, 101.6778);

      expect(html).toContain('window.updateCar = function');
      expect(html).toContain('window.panToLocation = function');
      expect(html).toContain('window.fitBounds = function');
      expect(html).toContain('window.setSpots = function');
      expect(html).toContain('window.setSelectedSpot = function');
      expect(html).toContain('window.setRoute = function');
      expect(html).toContain('SPOT_PRESS');
      expect(html).toContain('MAP_READY');
    });

    it('serializes initial spots directly into the HTML to eliminate render lag or missed bridge calls', () => {
      const html = getLeafletHtml(3.1176, 101.6778, undefined, mockSpots);
      expect(html).toContain('spot-1');
      expect(html).toContain('spot-2');
      expect(html).toContain('renderSpots()');
    });

    it('defines destination ending flag marker styles and logic on navigation route with ETA badge', () => {
      const html = getLeafletHtml(3.1176, 101.6778);
      expect(html).toContain('.destination-marker');
      expect(html).toContain('.destination-flag-head');
      expect(html).toContain('.destination-eta-badge');
      expect(html).toContain('createDestinationFlagIcon');
      expect(html).toContain('destinationMarker');
    });
  });

  describe('calculateZoomFromLatitudeDelta', () => {
    it('defaults to zoom 16 when delta is undefined or zero', () => {
      expect(calculateZoomFromLatitudeDelta(undefined)).toBe(16);
      expect(calculateZoomFromLatitudeDelta(0)).toBe(16);
      expect(calculateZoomFromLatitudeDelta(-0.01)).toBe(16);
    });

    it('calculates appropriate zoom levels for typical map viewports', () => {
      const zoom = calculateZoomFromLatitudeDelta(0.005);
      expect(zoom).toBeGreaterThanOrEqual(15);
      expect(zoom).toBeLessThanOrEqual(17);
    });

    it('clamps zoom levels within bounds [12, 18]', () => {
      expect(calculateZoomFromLatitudeDelta(5.0)).toBe(12);
      expect(calculateZoomFromLatitudeDelta(0.00001)).toBe(18);
    });
  });

  describe('parseLeafletBridgeMessage', () => {
    it('handles MAP_READY events', () => {
      const result = parseLeafletBridgeMessage(JSON.stringify({ type: 'MAP_READY' }), mockSpots);
      expect(result.type).toBe('MAP_READY');
      expect(result.handled).toBe(true);
    });

    it('handles SPOT_PRESS events and triggers onSpotPress callback', () => {
      const onSpotPress = jest.fn();
      const message = JSON.stringify({ type: 'SPOT_PRESS', spotId: 'spot-1' });

      const result = parseLeafletBridgeMessage(message, mockSpots, onSpotPress);

      expect(result.type).toBe('SPOT_PRESS');
      expect(result.handled).toBe(true);
      expect(result.spot).toEqual(mockSpots[0]);
      expect(onSpotPress).toHaveBeenCalledTimes(1);
      expect(onSpotPress).toHaveBeenCalledWith(mockSpots[0]);
    });

    it('does not trigger onSpotPress if spot ID is unknown', () => {
      const onSpotPress = jest.fn();
      const message = JSON.stringify({ type: 'SPOT_PRESS', spotId: 'nonexistent-spot' });

      const result = parseLeafletBridgeMessage(message, mockSpots, onSpotPress);

      expect(result.type).toBe('SPOT_PRESS');
      expect(result.handled).toBe(false);
      expect(result.spot).toBeUndefined();
      expect(onSpotPress).not.toHaveBeenCalled();
    });

    it('gracefully handles invalid JSON strings without throwing', () => {
      const onSpotPress = jest.fn();
      const result = parseLeafletBridgeMessage('invalid-json-string{', mockSpots, onSpotPress);

      expect(result.type).toBe('PARSE_ERROR');
      expect(result.handled).toBe(false);
      expect(onSpotPress).not.toHaveBeenCalled();
    });

    it('gracefully handles empty or undefined message payloads', () => {
      const result1 = parseLeafletBridgeMessage('', mockSpots);
      expect(result1.type).toBe('EMPTY');
      expect(result1.handled).toBe(false);

      const result2 = parseLeafletBridgeMessage(undefined, mockSpots);
      expect(result2.type).toBe('EMPTY');
      expect(result2.handled).toBe(false);
    });
  });
});

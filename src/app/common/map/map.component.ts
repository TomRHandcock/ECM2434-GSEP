import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {FullscreenControl, Map as MapboxMap, Popup as MapboxPopup} from 'mapbox-gl';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit {

  map: mapboxgl.Map;
  @Input() markers: Array<any> = [];


  /**
   * Full screen button that floats top-right of the map.
   */
  mapFsControl: FullscreenControl;

  constructor() {
  }

  ngOnInit() {
  }

  /**
   * Runs when the view is rendered, adds the Mapbox map
   * @author TomRHandcock, galexite
   */
  ngAfterViewInit() {
    this.map = new MapboxMap({
      container: 'mapElement',
      accessToken: 'pk.eyJ1IjoidG9tcmhhbmRjb2NrIiwiYSI6ImNrNjZpemRzMDA4Nmcza3A2ZXB4YzR3MDQifQ.ut4uLWl97TVdhGxP1TEgoQ',
      style: 'mapbox://styles/mapbox/navigation-guidance-day-v4',
      center: [-3.533636, 50.736],
      zoom: 15
    });
    this.mapFsControl = new FullscreenControl();
    this.map.addControl(this.mapFsControl);

    // Add the campus building GeoJSON dataset
    this.map.on('load', () => this.onMapLoad(this.map));

    this.markers.forEach((center) => {
      const markerElem = document.createElement('div');
      markerElem.className = 'marker';
      markerElem.style.width = '20px';
      markerElem.style.height = '20px';
      markerElem.style.backgroundColor = 'red';
      markerElem.style.borderRadius = '50%';
      markerElem.style.backgroundSize = 'cover';

      new mapboxgl.Marker(markerElem)
        .setLngLat([center.lon, center.lat])
        .addTo(this.map);

      document.getElementById('mapElement').appendChild(markerElem);
    });
  }


  /**
   * Add the campus polygons to the map
   * @author galexite
   */
  onMapLoad(map: MapboxMap) {
    map.addSource('campus', {
      type: 'geojson',
      data: '/assets/campus.geojson'
    });
    map.addLayer({
      id: 'campus',
      source: 'campus',
      type: 'fill',
      paint: {
        'fill-color': 'rgba(0,0,0,0.4)'
      }
    });
    map.addLayer({
      id: 'campus-labels',
      source: 'campus',
      type: 'symbol',
      layout: {
        'text-field': ['get', 'name']
      }
    });
    map.on('click', 'campus', (event) => {
      new MapboxPopup()
        .setLngLat(event.lngLat)
        .setHTML('<b>' + event.features[0].properties.name + '</b><br>' + event.features[0].properties.description)
        .addTo(this.map);
    });
  }
}

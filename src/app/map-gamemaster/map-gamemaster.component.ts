import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-map-gamemaster',
  templateUrl: './map-gamemaster.component.html',
  styleUrls: ['./map-gamemaster.component.scss']
})
export class MapGamemasterComponent implements OnInit, AfterViewInit {

  map: mapboxgl.Map;
  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.map = new mapboxgl.Map({
      container: 'mapElement',
      accessToken: 'pk.eyJ1IjoidG9tcmhhbmRjb2NrIiwiYSI6ImNrNjZpemRzMDA4Nmcza3A2ZXB4YzR3MDQifQ.ut4uLWl97TVdhGxP1TEgoQ',
      style: 'mapbox://styles/mapbox/navigation-guidance-day-v4',
      center: [-3.533636, 50.736],
      zoom: 15
    });
  }

}

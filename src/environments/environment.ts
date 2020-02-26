import { accessToken } from 'mapbox-gl';

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  mapbox: {
    accessToken: 'pk.eyJ1IjoidG9tcmhhbmRjb2NrIiwiYSI6ImNrNjZpemRzMDA4Nmcza3A2ZXB4YzR3MDQifQ.ut4uLWl97TVdhGxP1TEgoQ'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

const firebaseConfig = {
  apiKey: 'AIzaSyAL4V69MO2IiQtUgkAgDPlbrgX4Yu7-j9I',
  authDomain: 'exe-marks-the-spot.firebaseapp.com',
  databaseURL: 'https://exe-marks-the-spot.firebaseio.com',
  projectId: 'exe-marks-the-spot',
  storageBucket: 'exe-marks-the-spot.appspot.com',
  messagingSenderId: '737006524525',
  appId: '1:737006524525:web:519a96b62575eaea120764'
};

import { Linking, Platform } from 'react-native';

export class NavigationLauncher {
  static openWaze(lat: number, lng: number): Promise<any> {
    const url = `waze://?ll=${lat},${lng}&navigate=yes`;
    return Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      }
      return Linking.openURL(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`);
    });
  }

  static openGoogleMaps(lat: number, lng: number): Promise<any> {
    const url =
      Platform.OS === 'ios'
        ? `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`
        : `google.navigation:q=${lat},${lng}&mode=d`;

    return Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      }
      return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  }

  static openAppleMaps(lat: number, lng: number): Promise<any> {
    const url = `maps://?daddr=${lat},${lng}&dirflg=d`;
    return Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      }
      return Linking.openURL(`https://maps.apple.com/?daddr=${lat},${lng}`);
    });
  }
}

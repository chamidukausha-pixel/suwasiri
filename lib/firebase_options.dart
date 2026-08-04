// File generated for Firebase project suwasiri-91824.
// ignore_for_file: type=lint

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCBgdW47IyLRtDPn7YMNbtkOyyl3MlWMPg',
    appId: '1:900720308322:android:b8f00a226b5317ed7f613b',
    messagingSenderId: '900720308322',
    projectId: 'suwasiri-91824',
    storageBucket: 'suwasiri-91824.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyA9RUQtY2b76vtRYD2j8mHeGm-Wt2viKFA',
    appId: '1:900720308322:ios:c0ad7813f5c27b387f613b',
    messagingSenderId: '900720308322',
    projectId: 'suwasiri-91824',
    storageBucket: 'suwasiri-91824.firebasestorage.app',
    iosBundleId: 'com.thepatientcare.suwasiri',
  );
}

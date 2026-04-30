import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useQiblaDirection } from '@/src/hooks/useQiblaDirection';

export default function QiblaScreen() {
  const {
    qiblaBearing,
    qiblaRelativeAngle,
    cityName,
    accuracy,
    isLoading,
    isSensorAvailable,
    errorMessage,
  } = useQiblaDirection();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: qiblaRelativeAngle,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [qiblaRelativeAngle, rotation]);

  const animatedRotation = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const roundedBearing = Math.round(qiblaBearing);
  const shouldCalibrate = isSensorAvailable && accuracy !== null && accuracy < 3;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <Text style={styles.locationText}>{cityName}</Text>

        <View style={styles.compassWrap}>
          <View style={styles.compassRing}>
            <Text style={[styles.cardinalText, styles.northText]}>N</Text>
            <Text style={[styles.cardinalText, styles.eastText]}>E</Text>
            <Text style={[styles.cardinalText, styles.southText]}>S</Text>
            <Text style={[styles.cardinalText, styles.westText]}>W</Text>

            {isSensorAvailable ? (
              <Animated.View
                style={[styles.qiblaNeedle, { transform: [{ rotate: animatedRotation }] }]}>
                <View style={styles.needleLine} />
                <View style={styles.kaabaMarker}>
                  <MaterialCommunityIcons name="cube-outline" size={24} color="#FFFFFF" />
                </View>
              </Animated.View>
            ) : (
              <View style={styles.fallbackMarker}>
                <MaterialCommunityIcons name="cube-outline" size={40} color="#007322" />
              </View>
            )}
          </View>
        </View>

        <Text style={styles.bearingText}>
          {isLoading ? 'Menghitung arah kiblat...' : `${roundedBearing}° dari utara`}
        </Text>

        {!isSensorAvailable ? (
          <Text style={styles.warningText}>
            Sensor kompas tidak tersedia. Arah kiblat tetap ditampilkan sebagai derajat dari utara.
          </Text>
        ) : null}

        {shouldCalibrate ? (
          <Text style={styles.warningText}>
            Akurasi kompas rendah. Gerakkan perangkat membentuk angka 8 untuk kalibrasi.
          </Text>
        ) : null}

        {errorMessage ? <Text style={styles.infoText}>{errorMessage}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E7F0DE',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#E7F0DE',
  },
  locationText: {
    color: '#007322',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginBottom: 22,
    textAlign: 'center',
  },
  compassWrap: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassRing: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 12,
    borderColor: '#007322',
    backgroundColor: '#F5FAEF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardinalText: {
    position: 'absolute',
    color: '#1D2A21',
    fontSize: 18,
    fontWeight: '900',
  },
  northText: {
    top: 16,
  },
  eastText: {
    right: 20,
  },
  southText: {
    bottom: 16,
  },
  westText: {
    left: 20,
  },
  qiblaNeedle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  needleLine: {
    width: 4,
    height: '41%',
    borderRadius: 999,
    backgroundColor: '#F6D365',
    marginTop: '9%',
  },
  kaabaMarker: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#007322',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
  },
  fallbackMarker: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#D7E6CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bearingText: {
    color: '#1D2A21',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginTop: 26,
    textAlign: 'center',
  },
  warningText: {
    color: '#7A4E00',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    backgroundColor: '#FFF7D6',
    borderWidth: 1,
    borderColor: '#F2D17A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  infoText: {
    color: '#5E636A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 12,
  },
});

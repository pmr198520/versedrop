import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/appStore';
import { useDrops } from '../hooks/useDrops';
import { colors, radii, spacing, type, shadows } from '../theme';
import { IconButton } from '../ui';
import type { Drop } from '../types';
import DropDetailSheet from '../components/DropDetailSheet';
import LocationDeniedBanner from '../components/LocationDeniedBanner';

const PICKUP_RANGE = 50;

const VOTD_VERSES = [
  { ref: 'Psalm 118:24', text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.' },
  { ref: 'Lamentations 3:22-23', text: "It is of the LORD's mercies that we are not consumed. They are new every morning: great is thy faithfulness." },
  { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
  { ref: 'Isaiah 40:31', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.' },
  { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God.' },
  { ref: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
];

function getVotd() {
  const day = Math.floor(Date.now() / 86400000);
  return VOTD_VERSES[day % VOTD_VERSES.length];
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const userLocation = useAppStore((s) => s.userLocation);
  const nearbyDrops = useAppStore((s) => s.nearbyDrops);
  const selectedDrop = useAppStore((s) => s.selectedDrop);
  const setSelectedDrop = useAppStore((s) => s.setSelectedDrop);
  const [showVotd, setShowVotd] = useState(true);
  const [centeredOnce, setCenteredOnce] = useState(false);
  const navigation = useNavigation<any>();
  const { refresh } = useDrops();
  const votd = getVotd();

  useEffect(() => {
    if (userLocation && mapRef.current && !centeredOnce) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
      setCenteredOnce(true);
    }
  }, [userLocation, centeredOnce]);

  const handleRecenter = useCallback(() => {
    if (userLocation && mapRef.current) {
      Haptics.selectionAsync();
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
  }, [userLocation]);

  const handleOrbPress = useCallback((drop: Drop) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDrop(drop);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: drop.latitude,
        longitude: drop.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 400);
    }
  }, [setSelectedDrop]);

  const inRangeCount = nearbyDrops.filter(
    (d) => (d.distance_meters ?? Infinity) <= PICKUP_RANGE && !d.is_picked_up
  ).length;
  const nearbyActive = nearbyDrops.filter(d => !d.is_picked_up).length;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        initialRegion={{
          latitude: 39.7392,
          longitude: -104.9903,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {userLocation && (
          <>
            <Circle
              center={{ latitude: userLocation.lat, longitude: userLocation.lng }}
              radius={50}
              fillColor="rgba(212,168,87,0.10)"
              strokeColor="rgba(212,168,87,0.35)"
              strokeWidth={1}
            />
            <Marker
              coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerHalo} />
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          </>
        )}

        {nearbyDrops.map((drop) => {
          const isPickedUp = drop.is_picked_up;
          const isInRange = (drop.distance_meters ?? Infinity) <= PICKUP_RANGE;
          return (
            <Marker
              key={drop.id}
              coordinate={{ latitude: drop.latitude, longitude: drop.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => handleOrbPress(drop)}
              tracksViewChanges={false}
            >
              <View style={styles.orbContainer}>
                <View style={[
                  styles.orb,
                  isPickedUp ? styles.orbDim : styles.orbGold,
                  isInRange && !isPickedUp && styles.orbGlow,
                ]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top bar — translucent over the map */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <BlurView intensity={70} tint="dark" style={styles.topBarBlur}>
          <Text style={styles.brand}>VerseDrop</Text>
          {nearbyDrops.length > 0 ? (
            <View style={styles.statRow}>
              <View style={styles.dot} />
              <Text style={styles.statText}>
                <Text style={styles.statValue}>{nearbyActive}</Text> nearby
                {inRangeCount > 0 ? <Text>  ·  <Text style={styles.statValueGold}>{inRangeCount}</Text> in range</Text> : null}
              </Text>
            </View>
          ) : null}
        </BlurView>
      </View>

      {/* Verse of the Day */}
      {showVotd && (
        <View
          style={[styles.votdCard, { top: insets.top + 86 }]}
          accessible
          accessibilityLabel={`Verse of the Day. ${votd.text} ${votd.ref}`}
        >
          <View style={styles.votdHeader}>
            <Text style={styles.votdLabel}>VERSE OF THE DAY</Text>
            <Pressable
              onPress={() => setShowVotd(false)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Dismiss verse of the day"
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.votdText}>&ldquo;{votd.text}&rdquo;</Text>
          <Text style={styles.votdRef}>{votd.ref}</Text>
        </View>
      )}

      {/* Bottom-left: recenter */}
      <View style={[styles.leftControls, { bottom: insets.bottom + 110 }]} pointerEvents="box-none">
        <IconButton
          icon="locate"
          onPress={handleRecenter}
          accessibilityLabel="Re-center map on my location"
          size={48}
        />
      </View>

      {/* FAB - Drop a Verse */}
      <View style={[styles.fabWrapper, { bottom: insets.bottom + 110 }]} pointerEvents="box-none">
        <IconButton
          icon="add"
          onPress={() => navigation.navigate('DropComposer')}
          accessibilityLabel="Drop a new verse at your location"
          size={60}
          variant="solid"
          iconSize={30}
        />
      </View>

      {selectedDrop && (
        <DropDetailSheet
          drop={selectedDrop}
          onClose={() => setSelectedDrop(null)}
          onPickedUp={refresh}
        />
      )}

      <LocationDeniedBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg,
  },
  topBarBlur: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
  },
  brand: {
    ...type.headline,
    color: colors.text,
    letterSpacing: -0.2,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  statText: { ...type.footnote, color: colors.textSecondary },
  statValue: { color: colors.text, fontWeight: '600' as const },
  statValueGold: { color: colors.gold, fontWeight: '700' as const },

  votdCard: {
    position: 'absolute', left: spacing.lg, right: spacing.lg,
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    ...shadows.lg,
  },
  votdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  votdLabel: { ...type.caption2, color: colors.gold, letterSpacing: 1 },
  votdText: { ...type.callout, color: colors.text, fontStyle: 'italic', marginBottom: spacing.xs },
  votdRef: { ...type.footnote, color: colors.textSecondary, fontWeight: '600' as const },

  leftControls: {
    position: 'absolute', left: spacing.lg,
  },
  fabWrapper: {
    position: 'absolute', right: spacing.lg,
  },

  userMarker: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  userMarkerHalo: {
    position: 'absolute', width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(212,168,87,0.18)',
  },
  userMarkerInner: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.gold,
    borderWidth: 3, borderColor: colors.bg,
  },

  orbContainer: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  orb: { width: 18, height: 18, borderRadius: 9 },
  orbGold: {
    backgroundColor: colors.gold,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
  },
  orbDim: { backgroundColor: '#3A3A42', opacity: 0.55 },
  orbGlow: {
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85, shadowRadius: 14, elevation: 8,
  },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#15151B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#15151B' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6A6A75' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#22222B' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#15151B' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#52525B' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A0A10' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1B1B22' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#52525B' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1A2218' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1B1B22' }] },
];

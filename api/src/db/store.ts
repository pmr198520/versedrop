import { v4 as uuidv4 } from 'uuid';

// ---- Types ----
export interface DropRow {
  id: string;
  user_token: string;
  verse_reference: string;
  verse_text: string;
  verse_translation: string;
  custom_message: string | null;
  latitude: number;
  longitude: number;
  pickup_count: number;
  moderation_status: string;
  created_at: string;
}

export interface PickupRow {
  id: string;
  user_token: string;
  drop_id: string;
  picked_up_at: string;
}

export interface ReactionRow {
  id: string;
  user_token: string;
  drop_id: string;
  reaction_type: string;
  created_at: string;
}

export interface NoteRow {
  id: string;
  user_token: string;
  drop_id: string;
  text: string;
  created_at: string;
}

// ---- In-memory store ----
const drops: DropRow[] = [];
const pickups: PickupRow[] = [];
const notes: NoteRow[] = [];
const reactions: ReactionRow[] = [];

// ---- Haversine distance (meters) ----
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- Drop operations ----

export function getNearbyDrops(lat: number, lng: number, radiusMeters: number, userToken: string) {
  return drops
    .filter((d) => d.moderation_status === 'approved')
    .map((d) => {
      const dist = haversine(lat, lng, d.latitude, d.longitude);
      const isPickedUp = pickups.some((p) => p.drop_id === d.id && p.user_token === userToken);

      // aggregate reactions
      const dropReactions = reactions.filter((r) => r.drop_id === d.id);
      const amen = dropReactions.filter((r) => r.reaction_type === 'amen').length;
      const heart = dropReactions.filter((r) => r.reaction_type === 'heart').length;
      const pray = dropReactions.filter((r) => r.reaction_type === 'pray').length;
      const userReaction = dropReactions.find((r) => r.user_token === userToken)?.reaction_type || null;

      return {
        id: d.id,
        user_token: d.user_token,
        verse_reference: d.verse_reference,
        verse_text: d.verse_text,
        verse_translation: d.verse_translation,
        custom_message: d.custom_message,
        latitude: d.latitude,
        longitude: d.longitude,
        distance_meters: Math.round(dist * 10) / 10,
        pickup_count: d.pickup_count,
        is_picked_up: isPickedUp,
        reactions: { amen, heart, pray, user_reaction: userReaction },
        created_at: d.created_at,
      };
    })
    .filter((d) => d.distance_meters <= radiusMeters)
    .sort((a, b) => a.distance_meters - b.distance_meters)
    .slice(0, 50);
}

export function createDrop(data: {
  user_token: string;
  verse_reference: string;
  verse_text: string;
  verse_translation?: string;
  custom_message?: string;
  latitude: number;
  longitude: number;
}) {
  const drop: DropRow = {
    id: uuidv4(),
    user_token: data.user_token,
    verse_reference: data.verse_reference,
    verse_text: data.verse_text,
    verse_translation: data.verse_translation || 'KJV',
    custom_message: data.custom_message || null,
    latitude: data.latitude,
    longitude: data.longitude,
    pickup_count: 0,
    moderation_status: 'approved',
    created_at: new Date().toISOString(),
  };
  drops.push(drop);
  return drop;
}

export function pickupDrop(dropId: string, userToken: string): { success: boolean; alreadyPickedUp: boolean } {
  const drop = drops.find((d) => d.id === dropId);
  if (!drop) return { success: false, alreadyPickedUp: false };

  const existing = pickups.find((p) => p.drop_id === dropId && p.user_token === userToken);
  if (existing) return { success: false, alreadyPickedUp: true };

  pickups.push({
    id: uuidv4(),
    user_token: userToken,
    drop_id: dropId,
    picked_up_at: new Date().toISOString(),
  });
  drop.pickup_count += 1;
  return { success: true, alreadyPickedUp: false };
}

export function getDrop(dropId: string, userToken: string) {
  const d = drops.find((dd) => dd.id === dropId);
  if (!d) return null;
  const isPickedUp = pickups.some((p) => p.drop_id === d.id && p.user_token === userToken);
  const dropReactions = reactions.filter((r) => r.drop_id === d.id);
  return {
    ...d,
    is_picked_up: isPickedUp,
    reactions: {
      amen: dropReactions.filter((r) => r.reaction_type === 'amen').length,
      heart: dropReactions.filter((r) => r.reaction_type === 'heart').length,
      pray: dropReactions.filter((r) => r.reaction_type === 'pray').length,
      user_reaction: dropReactions.find((r) => r.user_token === userToken)?.reaction_type || null,
    },
  };
}

export function addReaction(dropId: string, userToken: string, reactionType: string) {
  const existing = reactions.find(
    (r) => r.drop_id === dropId && r.user_token === userToken && r.reaction_type === reactionType
  );
  if (!existing) {
    reactions.push({
      id: uuidv4(),
      user_token: userToken,
      drop_id: dropId,
      reaction_type: reactionType,
      created_at: new Date().toISOString(),
    });
  }

  const dropReactions = reactions.filter((r) => r.drop_id === dropId);
  return {
    amen: dropReactions.filter((r) => r.reaction_type === 'amen').length,
    heart: dropReactions.filter((r) => r.reaction_type === 'heart').length,
    pray: dropReactions.filter((r) => r.reaction_type === 'pray').length,
    user_reaction: reactionType,
  };
}

export function getMyPickups(userToken: string) {
  const myPickups = pickups
    .filter((p) => p.user_token === userToken)
    .sort((a, b) => new Date(b.picked_up_at).getTime() - new Date(a.picked_up_at).getTime());

  const result = myPickups.map((p) => {
    const d = drops.find((dd) => dd.id === p.drop_id);
    if (!d) return null;
    return {
      ...d,
      is_picked_up: true,
      picked_up_at: p.picked_up_at,
      reactions: { amen: 0, heart: 0, pray: 0, user_reaction: null },
    };
  }).filter(Boolean);

  // Calculate streak
  const dates = [...new Set(
    myPickups.map((p) => new Date(p.picked_up_at).toISOString().slice(0, 10))
  )].sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (dates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return { drops: result, streak, total: result.length };
}

export function getUserStats(userToken: string) {
  const totalPickups = pickups.filter((p) => p.user_token === userToken).length;
  const totalDrops = drops.filter((d) => d.user_token === userToken).length;
  const { streak } = getMyPickups(userToken);
  return {
    user_token: userToken,
    is_plus_subscriber: false,
    total_pickups: totalPickups,
    total_drops: totalDrops,
    streak_days: streak,
  };
}

// ---- Seed demo drops near a location ----
let seededLocations: { lat: number; lng: number }[] = [];

export function seedDrops(centerLat: number, centerLng: number) {
  // Check if we already seeded near this location (within 1km)
  const alreadySeeded = seededLocations.some((loc) => {
    return haversine(loc.lat, loc.lng, centerLat, centerLng) < 1000;
  });
  if (alreadySeeded) return;
  seededLocations.push({ lat: centerLat, lng: centerLng });

  const demoVerses = [
    { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
    { ref: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.' },
    { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
    { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.' },
    { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.' },
    { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
    { ref: 'Isaiah 40:31', text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
    { ref: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.' },
    { ref: 'Psalm 46:10', text: 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.' },
    { ref: 'Joshua 1:9', text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.' },
    { ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
    { ref: 'Romans 12:2', text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.' },
  ];

  demoVerses.forEach((v, i) => {
    // scatter within ~300m of center in random directions
    const angle = (i / demoVerses.length) * 2 * Math.PI + (Math.random() * 0.5);
    const dist = 30 + Math.random() * 250; // 30-280m away
    const dLat = (dist * Math.cos(angle)) / 111320;
    const dLng = (dist * Math.sin(angle)) / (111320 * Math.cos(centerLat * Math.PI / 180));

    createDrop({
      user_token: 'seed-user',
      verse_reference: v.ref,
      verse_text: v.text,
      latitude: centerLat + dLat,
      longitude: centerLng + dLng,
    });
  });

  console.log(`Seeded ${demoVerses.length} demo drops near [${centerLat}, ${centerLng}]`);
}

// ---- Notes ----
export function addNote(dropId: string, userToken: string, text: string) {
  const note: NoteRow = {
    id: uuidv4(),
    user_token: userToken,
    drop_id: dropId,
    text,
    created_at: new Date().toISOString(),
  };
  notes.push(note);
  return note;
}

export function getNotes(dropId: string) {
  return notes
    .filter((n) => n.drop_id === dropId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

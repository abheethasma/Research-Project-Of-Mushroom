// src/screens/environment/EnvironmentVarietyScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';

import {
  fetchEnvironmentRecommendation,
  fetchEnvironmentAvailableDates,
  fetchEnvironmentProfile,
  fetchOptimalRange,
} from '../../services/environmentApi';
import styles, { C } from './styles';

function ymdLocal(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function pickDefaultDate(dates) {
  const today = ymdLocal(new Date());
  if (Array.isArray(dates) && dates.includes(today)) return today;
  if (Array.isArray(dates) && dates.length > 0) return dates[0];
  return null;
}

function SelectModal({ visible, title, items, onClose, onPick }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>

          <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            ListEmptyComponent={<Text style={styles.modalEmpty}>No dates available.</Text>}
            renderItem={({ item }) => (
              <Pressable style={styles.modalItem} onPress={() => onPick(item)}>
                <Text style={styles.modalItemText}>{item.label}</Text>
              </Pressable>
            )}
          />

          <Pressable style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function formatSourceLabel(source, selectedDate) {
  if (source === 'current') return 'Current Readings';
  if (source === 'last_1h') return 'Based on last 1 hour average';
  if (source === 'date') return selectedDate ? `Based on ${selectedDate}` : 'Based on selected date';
  return 'Based on selected data';
}

function ScoreBadge({ score, highlight = false }) {
  return (
    <View
      style={{
        minWidth: highlight ? 96 : 86,
        paddingHorizontal: 14,
        paddingVertical: highlight ? 10 : 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: highlight ? 'rgba(37, 99, 235, 0.24)' : 'rgba(37, 99, 235, 0.18)',
        backgroundColor: highlight ? 'rgba(37, 99, 235, 0.10)' : 'rgba(37, 99, 235, 0.08)',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: C.primary,
          fontWeight: '800',
          fontSize: highlight ? 20 : 18,
        }}
      >
        {Number(score).toFixed(2)}
      </Text>
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>score</Text>
    </View>
  );
}

function ReasonChips({ reason }) {
  const parts = String(reason || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!parts.length) return null;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {parts.map((part, index) => (
        <View
          key={`${part}-${index}`}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.surface2,
          }}
        >
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }}>{part}</Text>
        </View>
      ))}
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[styles.subtle, { marginTop: 0 }]}>{label}</Text>
      <Text style={{ color: C.text, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function RecommendationCard({
  item,
  index,
  expanded,
  onToggle,
  ensureRangeLoaded,
  rangeCache,
  profileStage,
  highlight = false,
}) {
  const cacheKey = `${item.mushroom_type}__${profileStage || 'no_stage'}`;
  const cached = rangeCache[cacheKey];
  const rg = cached?.range;

  return (
    <Pressable
      onPress={async () => {
        if (!expanded) {
          await ensureRangeLoaded(item.mushroom_type);
        }
        onToggle();
      }}
      style={{
        marginTop: 12,
        padding: highlight ? 18 : 16,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: highlight ? 'rgba(37, 99, 235, 0.24)' : C.border,
        backgroundColor: highlight ? 'rgba(37, 99, 235, 0.05)' : C.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              color: C.text,
              fontWeight: '800',
              fontSize: highlight ? 20 : 18,
              lineHeight: highlight ? 28 : 24,
            }}
          >
            {index + 1}. {item.mushroom_type}
          </Text>

          {highlight ? (
            <Text style={[styles.subtle, { marginTop: 8, lineHeight: 20 }]}>
              Closest match for the selected environment condition.
            </Text>
          ) : null}

          <ReasonChips reason={item.reason} />
        </View>

        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <ScoreBadge score={item.score} highlight={highlight} />
          <Text style={{ color: C.muted, fontWeight: '700', fontSize: 13 }}>
            {expanded ? 'Hide' : 'Details'}
          </Text>
        </View>
      </View>

      {expanded ? (
        <View
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: C.border,
          }}
        >
          {rg ? (
            <>
              <DetailRow label="Target temperature" value={`${rg.temp_min} to ${rg.temp_max} °C`} />
              <DetailRow label="Target humidity" value={`${rg.rh_min} to ${rg.rh_max} %RH`} />
            </>
          ) : cached?.loading ? (
            <Text style={styles.subtle}>Loading target range...</Text>
          ) : cached?.error ? (
            <Text style={[styles.subtle, { color: C.bad }]}>Failed to load target range.</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function getPenalty(value, min, max) {
  const v = Number(value);
  const mn = Number(min);
  const mx = Number(max);

  if (!Number.isFinite(v) || !Number.isFinite(mn) || !Number.isFinite(mx)) return null;
  if (v < mn) return Number((mn - v).toFixed(2));
  if (v > mx) return Number((v - mx).toFixed(2));
  return 0;
}

function ScoreExplanationCard({ recommendation, profile, rangeCache, expandedKey }) {
  const top = recommendation?.recommendations?.[0];

  if (!recommendation || !top) return null;

  const temp = recommendation?.temperature;
  const rh = recommendation?.humidity;

  const cacheKey = `${top.mushroom_type}__${profile?.stage || 'no_stage'}`;
  const rg = rangeCache?.[cacheKey]?.range;

  if (temp == null || rh == null || !rg) {
    return (
      <View
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.surface2,
        }}
      >
        <Text style={[styles.subtle, { marginTop: 0, lineHeight: 20 }]}>
          The score is based on how far the current temperature and humidity are from the ideal range.
          Lower score means a better match.
        </Text>
      </View>
    );
  }

  const tempPenalty = getPenalty(temp, rg.temp_min, rg.temp_max);
  const rhPenalty = getPenalty(rh, rg.rh_min, rg.rh_max);
  const finalScore =
    tempPenalty != null && rhPenalty != null
      ? Number((tempPenalty * 1.0 + rhPenalty * 0.5).toFixed(2))
      : null;

  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.surface2,
      }}
    >
      <Text style={[styles.subtle, { marginTop: 0, lineHeight: 17 }]}>
        The system compares the current temperature and humidity with the ideal fruiting range of
        each mushroom variety.
      </Text>

      <Text style={[styles.subtle, { marginTop: 8, lineHeight: 17 }]}>
        If a value is inside the range, its penalty is 0. If it is outside the range, the penalty is
        the distance from the nearest limit.
      </Text>

      <Text style={[styles.subtle, { marginTop: 8, lineHeight: 17, fontWeight: '700', color: C.text }]}>
        Score = Temperature penalty × 1.0 + Humidity penalty × 0.5
      </Text>

      <Text style={[styles.subtle, { marginTop: 14, color: C.text, fontWeight: '700' } ]}>Example using current best match</Text>

      <Text style={[styles.subtle, { marginTop: 8, lineHeight: 17 }]}>
        Current temperature = {Number(temp).toFixed(1)}°C
      </Text>
      <Text style={[styles.subtle, { marginTop:0, lineHeight: 17 }]}>
        Current humidity = {Number(rh).toFixed(1)}%RH
      </Text>

      <Text style={[styles.subtle, { marginTop: 10, lineHeight: 17 }]}>
        {top.mushroom_type} target temperature = {rg.temp_min} to {rg.temp_max}°C
      </Text>
      <Text style={[styles.subtle, { marginTop: 0, lineHeight: 17 }]}>
        Temperature penalty = {tempPenalty}
      </Text>

      <Text style={[styles.subtle, { marginTop: 10, lineHeight: 17 }]}>
        {top.mushroom_type} target humidity = {rg.rh_min} to {rg.rh_max}%RH
      </Text>
      <Text style={[styles.subtle, { marginTop: 0, lineHeight: 17 }]}>
        Humidity penalty = {rhPenalty}
      </Text>

      <Text style={[styles.subtle, { marginTop: 10, lineHeight: 17, fontWeight: '700', color: C.text }]}>
        Final score = ({tempPenalty} × 1.0) + ({rhPenalty} × 0.5) = {finalScore}
      </Text>

      <Text style={[styles.subtle, { marginTop: 10, lineHeight: 17 }]}>
        Lower score means the environment is closer to that variety’s ideal range.
      </Text>
    </View>
  );
}

export default function EnvironmentVarietyScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [profile, setProfile] = useState({ mushroom_type: null, stage: null });
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  const [recSource, setRecSource] = useState('current');
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const [expandedKey, setExpandedKey] = useState(null);
  const [rangeCache, setRangeCache] = useState({});

  const dateItems = useMemo(
    () => (availableDates || []).map((d) => ({ key: d, label: d })),
    [availableDates]
  );

  const summaryText = useMemo(() => {
    const sourceText = formatSourceLabel(recSource, selectedDate);

    if (recommendation?.temperature != null && recommendation?.humidity != null) {
      return `${sourceText} • Temp ${Number(recommendation.temperature).toFixed(1)} °C • RH ${Number(
        recommendation.humidity
      ).toFixed(1)} %RH`;
    }

    return sourceText;
  }, [recSource, selectedDate, recommendation]);

  const topPick = recommendation?.recommendations?.[0] || null;
  const otherPicks = recommendation?.recommendations?.slice(1) || [];

  async function ensureRangeLoaded(mushroomType) {
    if (!profile?.stage) return;

    const cacheKey = `${mushroomType}__${profile.stage}`;
    const existing = rangeCache[cacheKey];
    if (existing?.loading || existing?.range || existing?.error) return;

    setRangeCache((prev) => ({
      ...prev,
      [cacheKey]: { loading: true, range: null, error: false },
    }));

    try {
      const rg = await fetchOptimalRange(mushroomType, profile.stage);
      setRangeCache((prev) => ({
        ...prev,
        [cacheKey]: { loading: false, range: rg, error: false },
      }));
    } catch {
      setRangeCache((prev) => ({
        ...prev,
        [cacheKey]: { loading: false, range: null, error: true },
      }));
    }
  }

  async function loadRecommendation(forceSource, forceDate) {
    const src = forceSource ?? recSource;
    const dt = forceDate ?? selectedDate;

    if (src === 'date' && !dt) {
      setRecommendation(null);
      return;
    }

    setRecLoading(true);
    try {
      const rec = await fetchEnvironmentRecommendation(src, dt);
      setRecommendation(rec);
      setExpandedKey(null);
      setRangeCache({});
    } catch (e) {
      console.log('fetchEnvironmentRecommendation error:', e);
      setRecommendation(null);
    } finally {
      setRecLoading(false);
    }
  }

  async function loadInitial() {
    setLoading(true);
    try {
      const [prof, datesRes] = await Promise.all([
        fetchEnvironmentProfile(),
        fetchEnvironmentAvailableDates(),
      ]);

      setProfile(prof || { mushroom_type: null, stage: null });

      const dates = datesRes?.dates || [];
      setAvailableDates(dates);

      const def = pickDefaultDate(dates);
      setSelectedDate(def);

      await loadRecommendation('current', def);
    } catch (e) {
      console.log('EnvironmentVarietyScreen loadInitial error:', e);
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadInitial();
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => {
    const top = recommendation?.recommendations?.[0];
    if (top?.mushroom_type && profile?.stage) {
      ensureRangeLoaded(top.mushroom_type);
    }
  }, [recommendation, profile?.stage]);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.subtle}>Loading variety recommendation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Variety recommendation</Text>
          </View>

          <View style={styles.segmentWrap}>
            <Pressable
              style={[styles.segmentBtn, recSource === 'current' && styles.segmentBtnActive]}
              onPress={() => setRecSource('current')}
            >
              <Text style={[styles.segmentText, recSource === 'current' && styles.segmentTextActive]}>
                Current
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentBtn, recSource === 'last_1h' && styles.segmentBtnActive]}
              onPress={() => setRecSource('last_1h')}
            >
              <Text style={[styles.segmentText, recSource === 'last_1h' && styles.segmentTextActive]}>
                Last 1h
              </Text>
            </Pressable>

            <Pressable
              style={[styles.segmentBtn, recSource === 'date' && styles.segmentBtnActive]}
              onPress={() => {
                setRecSource('date');
                setShowDateModal(true);
              }}
            >
              <Text style={[styles.segmentText, recSource === 'date' && styles.segmentTextActive]}>
                Date
              </Text>
              <Text style={[styles.segmentSub, recSource === 'date' && styles.segmentSubActive]}>
                {selectedDate || 'Select'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.primaryBtn, recLoading && { opacity: 0.7 }]}
            onPress={() => loadRecommendation()}
            disabled={recLoading}
          >
            <Text style={styles.primaryBtnText}>
              {recLoading ? 'Loading...' : 'Get recommendation'}
            </Text>
          </Pressable>

          <Text style={[styles.subtle, { lineHeight: 20 }]}>{summaryText}</Text>

          {topPick ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 12}]}>Best match</Text>
              <Text style={[styles.subtle, { marginTop: 2 }]}>Lower score means a better match.</Text>

              <RecommendationCard
                item={topPick}
                index={0}
                expanded={expandedKey === `top-${topPick.mushroom_type}`}
                onToggle={() =>
                  setExpandedKey((prev) =>
                    prev === `top-${topPick.mushroom_type}` ? null : `top-${topPick.mushroom_type}`
                  )
                }
                ensureRangeLoaded={ensureRangeLoaded}
                rangeCache={rangeCache}
                profileStage={profile?.stage}
                highlight
              />

              {otherPicks.length > 0 ? (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Other options</Text>

                  {otherPicks.map((r, idx) => {
                    const key = `other-${r.mushroom_type}-${idx}`;
                    return (
                      <RecommendationCard
                        key={key}
                        item={r}
                        index={idx + 1}
                        expanded={expandedKey === key}
                        onToggle={() => setExpandedKey((prev) => (prev === key ? null : key))}
                        ensureRangeLoaded={ensureRangeLoaded}
                        rangeCache={rangeCache}
                        profileStage={profile?.stage}
                      />
                    );
                  })}
                </>
              ) : null}

              
            </>
          ) : (
            <Text style={styles.subtle}>No data available for the selected source yet.</Text>
          )}
        </View>

        <View style={{ marginTop: 14 }}>
          <Pressable
            onPress={() => setShowScoreInfo((prev) => !prev)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.surface2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: C.text }}>
              How is this score calculated?
            </Text>
            <Text style={{ color: C.muted, fontWeight: '800' }}>
              {showScoreInfo ? '▴' : '▾'}
            </Text>
          </Pressable>

          {showScoreInfo ? (
            <ScoreExplanationCard
              recommendation={recommendation}
              profile={profile}
              rangeCache={rangeCache}
              expandedKey={expandedKey}
            />
          ) : null}
        </View>
      </ScrollView>

      <SelectModal
        visible={showDateModal}
        title="Select date"
        items={dateItems}
        onClose={() => setShowDateModal(false)}
        onPick={(item) => {
          setShowDateModal(false);
          setSelectedDate(item.key);
          setRecSource('date');
        }}
      />
    </SafeAreaView>
  );
}
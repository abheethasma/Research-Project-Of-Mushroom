// src/screens/environment/EnvironmentScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, Text, View, ActivityIndicator, ScrollView } from 'react-native';

import {
  fetchEnvironmentStatus,
  fetchEnvironmentOptions,
  fetchEnvironmentProfile,
  updateEnvironmentProfile,
  fetchOptimalRange,
  fetchEnvironmentHistory,
  fetchEnvironmentAvailableDates,
  fetchEnvironmentHealth,
} from '../../services/environmentApi';

import styles from './styles';
import EnvironmentView from './EnvironmentView';

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

export default function EnvironmentScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  const prevAlertActiveRef = useRef({ temperature: false, humidity: false });
  const [alerts, setAlerts] = useState([]);

  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(false);

  const [reading, setReading] = useState(null);
  const [options, setOptions] = useState({ mushrooms: [], stages: [] });

  const [profile, setProfile] = useState({ mushroom_type: null, stage: null });
  const [range, setRange] = useState(null);

  const [showMushroomModal, setShowMushroomModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);

  const timerRef = useRef(null);
  const historyTimerRef = useRef(null);

  const [profileUpdating, setProfileUpdating] = useState(false);

  const [graphMode, setGraphMode] = useState('last_1h');
  const [historyPoints, setHistoryPoints] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

  const graphModeRef = useRef(graphMode);
  const selectedDateRef = useRef(selectedDate);

  useEffect(() => {
    graphModeRef.current = graphMode;
    selectedDateRef.current = selectedDate;
  }, [graphMode, selectedDate]);

  const stageItems = useMemo(
    () => (options.stages || []).map((s) => ({ key: s.key, label: s.label })),
    [options.stages]
  );

  const mushroomItems = useMemo(
    () => (options.mushrooms || []).map((m) => ({ key: m, label: m })),
    [options.mushrooms]
  );

  const dateItems = useMemo(
    () => (availableDates || []).map((d) => ({ key: d, label: d })),
    [availableDates]
  );

  const stageLabel = useMemo(() => {
    if (!profile.stage) return null;
    return stageItems.find((s) => s.key === profile.stage)?.label ?? profile.stage;
  }, [profile.stage, stageItems]);

  const co2Value = reading?.co2 ?? reading?.co2_estimated ?? null;

  const tempInRange =
    reading && range
      ? reading.temperature >= range.temp_min && reading.temperature <= range.temp_max
      : null;

  const rhInRange =
    reading && range ? reading.humidity >= range.rh_min && reading.humidity <= range.rh_max : null;

  const co2Min = range?.co2_min;
  const co2Max = range?.co2_max;

  const hasCo2Min = co2Min != null && Number.isFinite(Number(co2Min));
  const hasCo2Max = co2Max != null && Number.isFinite(Number(co2Max));
  const hasAnyCo2 = !!range && (hasCo2Min || hasCo2Max);

  const co2InRange =
    co2Value != null && hasAnyCo2
      ? (hasCo2Min ? Number(co2Value) >= Number(co2Min) : true) &&
        (hasCo2Max ? Number(co2Value) <= Number(co2Max) : true)
      : null;

  const co2RangeLabel = useMemo(() => {
    if (!hasAnyCo2) return null;
    if (hasCo2Min && hasCo2Max) return `${Number(co2Min)}–${Number(co2Max)} ppm`;
    if (hasCo2Max) return `≤ ${Number(co2Max)} ppm`;
    return `≥ ${Number(co2Min)} ppm`;
  }, [hasAnyCo2, hasCo2Min, hasCo2Max, co2Min, co2Max]);

  const headerStatus = useMemo(() => {
    if (!health) return { text: 'Checking...', tone: 'muted' };
    if (!health.online) return { text: 'OFFLINE', tone: 'bad' };
    return { text: 'ONLINE', tone: 'ok' };
  }, [health]);

  const headerSubline = useMemo(() => {
    const parts = [];
    if (health?.seconds_since_last != null) parts.push(`Updated ${health.seconds_since_last}s ago`);
    if (profile.mushroom_type) parts.push(profile.mushroom_type);
    if (stageLabel) parts.push(stageLabel);
    return parts.length ? parts.join(' • ') : '—';
  }, [health?.seconds_since_last, profile.mushroom_type, stageLabel]);

  function deltaText(value, min, max, unit, decimals = 1) {
    if (value == null || min == null || max == null) return null;
    const v = Number(value);
    const mn = Number(min);
    const mx = Number(max);
    if (!Number.isFinite(v) || !Number.isFinite(mn) || !Number.isFinite(mx)) return null;

    if (v < mn) return `Low by ${(mn - v).toFixed(decimals)}${unit}`;
    if (v > mx) return `High by ${(v - mx).toFixed(decimals)}${unit}`;
    return `Within range`;
  }

  async function refreshHealth() {
    try {
      const h = await fetchEnvironmentHealth();
      setHealth(h);
      setHealthError(false);
    } catch {
      setHealthError(true);
    }
  }

  async function refreshStatus() {
    try {
      const st = await fetchEnvironmentStatus();
      setReading(st.reading ?? null);
      setAlerts(st.alerts || []);
      if (st.optimal_range) setRange(st.optimal_range);

      for (const a of st.alerts || []) {
        prevAlertActiveRef.current[a.param] = !!a.active;
      }
    } catch {
      // ignore
    }
  }

  async function refreshHistory(mode, date) {
    try {
      if (mode === 'date' && !date) {
        setHistoryPoints([]);
        return;
      }
      const hist = await fetchEnvironmentHistory(mode, date);
      setHistoryPoints(hist.points || []);
    } catch {
      setHistoryPoints([]);
    }
  }

  async function applyProfile(next) {
    setProfileUpdating(true);
    try {
      const saved = await updateEnvironmentProfile(next);
      const nextProfile = { mushroom_type: saved.mushroom_type, stage: saved.stage };
      setProfile(nextProfile);

      const rg = await fetchOptimalRange(nextProfile.mushroom_type, nextProfile.stage);
      setRange(rg);

      const st = await fetchEnvironmentStatus();
      setReading(st.reading ?? null);
      setAlerts(st.alerts || []);
      if (st.optimal_range) setRange(st.optimal_range);

      const nextPrev = { temperature: false, humidity: false };
      for (const a of st.alerts || []) nextPrev[a.param] = !!a.active;
      prevAlertActiveRef.current = nextPrev;
    } finally {
      setProfileUpdating(false);
    }
  }

  async function loadInitial() {
    setLoading(true);
    try {
      const [opt, prof, st] = await Promise.all([
        fetchEnvironmentOptions(),
        fetchEnvironmentProfile(),
        fetchEnvironmentStatus(),
      ]);

      setOptions(opt);

      setReading(st.reading ?? null);
      setAlerts(st.alerts || []);
      await refreshHealth();

      const nextPrev = { temperature: false, humidity: false };
      for (const a of st.alerts || []) nextPrev[a.param] = !!a.active;
      prevAlertActiveRef.current = nextPrev;

      const nextProfile = {
        mushroom_type: st.profile?.mushroom_type ?? prof.mushroom_type ?? null,
        stage: st.profile?.stage ?? prof.stage ?? null,
      };
      setProfile(nextProfile);

      if (st.optimal_range) setRange(st.optimal_range);
      else if (nextProfile.mushroom_type && nextProfile.stage) {
        const rg = await fetchOptimalRange(nextProfile.mushroom_type, nextProfile.stage);
        setRange(rg);
      } else {
        setRange(null);
      }

      const datesRes = await fetchEnvironmentAvailableDates();
      const dates = datesRes.dates || [];
      setAvailableDates(dates);

      const def = selectedDate ?? pickDefaultDate(dates);
      if (!selectedDate && def) setSelectedDate(def);

      await refreshHistory(graphMode, def);
    } finally {
      setLoading(false);
    }
  }

  async function openGraphDatePicker() {
    setGraphMode('date');
    const datesRes = await fetchEnvironmentAvailableDates();
    const dates = datesRes.dates || [];
    setAvailableDates(dates);

    if (!selectedDate) {
      const def = pickDefaultDate(dates);
      if (def) setSelectedDate(def);
    }

    setShowDateModal(true);
  }

  useEffect(() => {
    loadInitial();

    timerRef.current = setInterval(() => {
      refreshStatus();
      refreshHealth();
    }, 5000);

    historyTimerRef.current = setInterval(() => {
      refreshHistory(graphModeRef.current, selectedDateRef.current);
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (historyTimerRef.current) clearInterval(historyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) refreshHistory(graphMode, selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphMode, selectedDate]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.subtle}>Loading environment data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeAlerts = (alerts || []).filter((a) => a.active);

  const dateForButtons = selectedDate ?? ymdLocal(new Date());

  const graphHint =
    graphMode === 'last_1h'
      ? 'Last 1 hour (5-min avg)'
      : selectedDate
      ? `Date view (${selectedDate})`
      : 'Date view';

  const tempSubtitle = range ? `Target ${range.temp_min}–${range.temp_max}°C` : null;
  const rhSubtitle = range ? `Target ${range.rh_min}–${range.rh_max}%` : null;
  const co2Subtitle = hasAnyCo2 ? `Target ${co2RangeLabel}` : 'No CO₂ range for this variety';

  function openSolutionRecommendationScreen() {
    navigation.navigate('EnvironmentSolution');
  }

  function openForecastScreen() {
    navigation.navigate('EnvironmentForecast');
  }

  function openVarietyRecommendationScreen() {
    navigation.navigate('EnvironmentVariety');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        <EnvironmentView
          headerStatus={headerStatus}
          headerSubline={headerSubline}
          health={health}
          healthError={healthError}
          reading={reading}
          range={range}
          tempInRange={tempInRange}
          rhInRange={rhInRange}
          co2Value={co2Value}
          co2InRange={co2InRange}
          tempSubtitle={tempSubtitle}
          rhSubtitle={rhSubtitle}
          co2Subtitle={co2Subtitle}
          activeAlerts={activeAlerts}
          profileUpdating={profileUpdating}
          deltaText={deltaText}
          profile={profile}
          stageLabel={stageLabel}
          hasAnyCo2={hasAnyCo2}
          co2RangeLabel={co2RangeLabel}
          graphMode={graphMode}
          setGraphMode={setGraphMode}
          historyPoints={historyPoints}
          dateForButtons={dateForButtons}
          graphHint={graphHint}
          openGraphDatePicker={openGraphDatePicker}
          onOpenSolutionRecommendation={openSolutionRecommendationScreen}
          onOpenVarietyRecommendation={openVarietyRecommendationScreen}
          onOpenForecast={openForecastScreen}
          showMushroomModal={showMushroomModal}
          setShowMushroomModal={setShowMushroomModal}
          showStageModal={showStageModal}
          setShowStageModal={setShowStageModal}
          showDateModal={showDateModal}
          setShowDateModal={setShowDateModal}
          mushroomItems={mushroomItems}
          stageItems={stageItems}
          dateItems={dateItems}
          onPickMushroom={async (item) => {
            setShowMushroomModal(false);
            const next = { ...profile, mushroom_type: item.key };
            if (next.mushroom_type && next.stage) await applyProfile(next);
            else setProfile(next);
          }}
          onPickStage={async (item) => {
            setShowStageModal(false);
            const next = { ...profile, stage: item.key };
            if (next.mushroom_type && next.stage) await applyProfile(next);
            else setProfile(next);
          }}
          onPickGraphDate={async (item) => {
            setShowDateModal(false);
            setSelectedDate(item.key);
            setGraphMode('date');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
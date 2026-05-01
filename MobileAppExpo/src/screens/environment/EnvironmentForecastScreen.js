// src/screens/environment/EnvironmentForecastScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';

import { fetchEnvironmentForecast } from '../../services/environmentApi';
import styles, { C } from './styles';

const FORECAST_CACHE = {};
const FORECAST_CACHE_TTL_MS = 60 * 1000; // 1 minute

const HORIZON_OPTIONS = [
  { key: '1h', label: '1h' },
  { key: '6h', label: '6h' },
  { key: '24h', label: '24h' },
];

function ToneChip({ text, tone = 'muted' }) {
  const toneStyle = useMemo(() => {
    if (tone === 'bad') {
      return {
        borderColor: 'rgba(225, 29, 72, 0.25)',
        backgroundColor: 'rgba(225, 29, 72, 0.08)',
        color: C.bad,
      };
    }
    if (tone === 'ok') {
      return {
        borderColor: 'rgba(22, 163, 74, 0.25)',
        backgroundColor: 'rgba(22, 163, 74, 0.08)',
        color: C.ok,
      };
    }
    if (tone === 'warn') {
      return {
        borderColor: 'rgba(217, 119, 6, 0.25)',
        backgroundColor: 'rgba(217, 119, 6, 0.08)',
        color: C.warn,
      };
    }
    return {
      borderColor: C.border,
      backgroundColor: C.surface2,
      color: C.muted,
    };
  }, [tone]);

  return (
    <View
      style={[
        styles.chip,
        {
          borderColor: toneStyle.borderColor,
          backgroundColor: toneStyle.backgroundColor,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: toneStyle.color }]}>{text}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={[styles.subtle, { marginTop: 0 }]}>{label}</Text>
      <Text style={{ color: C.text, fontWeight: '700', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function StatusChipRow({ label, status }) {
  let chipText = 'Within range';
  let chipTone = 'ok';

  if (status === 'high') {
    chipText = 'High risk';
    chipTone = 'bad';
  } else if (status === 'low') {
    chipText = 'Low risk';
    chipTone = 'warn';
  }

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={[styles.subtle, { marginTop: 0 }]}>{label}</Text>
      <View style={{ marginTop: 6, alignItems: 'flex-start' }}>
        <ToneChip text={chipText} tone={chipTone} />
      </View>
    </View>
  );
}

function BlockCard({ title, children }) {
  return (
    <View
      style={{
        marginTop: 14,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.surface2,
      }}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function horizonText(horizon) {
  if (horizon === '6h') return 'next 6 hours';
  if (horizon === '24h') return 'next 24 hours';
  return 'next hour';
}

function getShortMessage(forecast, horizon) {
  if (!forecast) return 'No forecast information available.';

  const label = horizonText(horizon);

  const tempHigh = forecast.temp_status === 'high';
  const tempLow = forecast.temp_status === 'low';
  const rhHigh = forecast.rh_status === 'high';
  const rhLow = forecast.rh_status === 'low';

  if (tempHigh && rhLow) {
    return `In the ${label}, temperature may go too high and humidity may go too low.`;
  }
  if (tempHigh && rhHigh) {
    return `In the ${label}, both temperature and humidity may go too high.`;
  }
  if (tempLow && rhLow) {
    return `In the ${label}, both temperature and humidity may go too low.`;
  }
  if (tempLow && rhHigh) {
    return `In the ${label}, temperature may go too low and humidity may go too high.`;
  }
  if (tempHigh) {
    return `In the ${label}, temperature may rise above the suitable range.`;
  }
  if (tempLow) {
    return `In the ${label}, temperature may fall below the suitable range.`;
  }
  if (rhHigh) {
    return `In the ${label}, humidity may rise above the suitable range.`;
  }
  if (rhLow) {
    return `In the ${label}, humidity may fall below the suitable range.`;
  }

  return `Temperature and humidity are expected to stay within the suitable range in the ${label}.`;
}

function getTitle(horizon) {
  if (horizon === '6h') return 'Next 6 hours forecast';
  if (horizon === '24h') return 'Next 24 hours forecast';
  return 'Next 1 hour forecast';
}

function getHorizonBadge(horizon) {
  if (horizon === '6h') return { text: 'Planning outlook', tone: 'warn' };
  if (horizon === '24h') return { text: 'Extended outlook', tone: 'muted' };
  return null;
}

function SmallInfoTile({ label, value, tone = 'normal' }) {
  let borderColor = C.border;
  let backgroundColor = C.surface2;
  let valueColor = C.text;

  if (tone === 'bad') {
    borderColor = 'rgba(225, 29, 72, 0.20)';
    backgroundColor = 'rgba(225, 29, 72, 0.06)';
    valueColor = C.bad;
  } else if (tone === 'warn') {
    borderColor = 'rgba(217, 119, 6, 0.20)';
    backgroundColor = 'rgba(217, 119, 6, 0.06)';
    valueColor = C.warn;
  } else if (tone === 'ok') {
    borderColor = 'rgba(22, 163, 74, 0.20)';
    backgroundColor = 'rgba(22, 163, 74, 0.06)';
    valueColor = C.ok;
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor,
        backgroundColor,
      }}
    >
      <Text style={[styles.subtle, { marginTop: 0 }]}>{label}</Text>
      <Text style={{ color: valueColor, fontWeight: '800', marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

export default function EnvironmentForecastScreen({ navigation }) {
  const [selectedHorizon, setSelectedHorizon] = useState('1h');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState('');

  const loadForecast = useCallback(
    async (horizon = selectedHorizon, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError('');

        const cached = FORECAST_CACHE[horizon];
        const now = Date.now();

        if (!isRefresh && cached && now - cached.ts < FORECAST_CACHE_TTL_MS) {
          setForecast(cached.data);
          return;
        }

        const data = await fetchEnvironmentForecast(horizon);

        FORECAST_CACHE[horizon] = {
          data,
          ts: now,
        };

        setForecast(data);
      } catch (e) {
        console.log('fetchEnvironmentForecast error:', e);
        setError(e?.message || 'Failed to load forecast');
        setForecast(null);
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [selectedHorizon]
  );

  useEffect(() => {
    loadForecast(selectedHorizon, false);
  }, [selectedHorizon, loadForecast]);

  const warningTone = forecast?.warning ? 'bad' : 'ok';
  const warningText = forecast?.warning ? 'Early warning' : 'Stable forecast';
  const shortMessage = getShortMessage(forecast, selectedHorizon);
  const badge = getHorizonBadge(selectedHorizon);

  const showRhCaution = selectedHorizon === '6h' || selectedHorizon === '24h';

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.subtle}>Loading {getTitle(selectedHorizon).toLowerCase()}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadForecast(selectedHorizon, true)} />
        }
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{getTitle(selectedHorizon)}</Text>
            <ToneChip text={warningText} tone={warningTone} />
          </View>

          <View style={[styles.segmentWrap, { marginTop: 12 }]}>
            {HORIZON_OPTIONS.map((item) => (
              <Pressable
                key={item.key}
                style={[
                  styles.segmentBtn,
                  selectedHorizon === item.key && styles.segmentBtnActive,
                ]}
                onPress={() => setSelectedHorizon(item.key)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    selectedHorizon === item.key && styles.segmentTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? (
            <Text style={[styles.subtle, { color: C.bad, marginTop: 0 }]}>{error}</Text>
          ) : null}

          {!error && forecast ? (
            <>
              <Text style={[styles.subtle, { marginTop: 12 }]}>
                Mushroom: {forecast.mushroom_type || '-'}
              </Text>
              <Text style={[styles.subtle, { marginTop: 0 }]}>
                Stage: {forecast.stage || '-'}
              </Text>

              <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
                What may happen in the {horizonText(selectedHorizon)}
              </Text>
              <Text style={[styles.subtle, { lineHeight: 21, marginTop: 0 }]}>
                {shortMessage}
              </Text>

              <View style={[styles.tileRow, { marginTop: 14 }]}>
                <View style={styles.tile}>
                  <Text style={styles.tileLabel}>Current temperature</Text>
                  <Text style={styles.tileValue}>
                    {forecast.current_temperature != null
                      ? Number(forecast.current_temperature).toFixed(1)
                      : '-'}
                  </Text>
                  <Text style={styles.subtle}>°C</Text>
                </View>

                <View style={styles.tile}>
                  <Text style={styles.tileLabel}>Predicted temperature</Text>
                  <Text style={styles.tileValue}>
                    {forecast.predicted_temperature != null
                      ? Number(forecast.predicted_temperature).toFixed(1)
                      : '-'}
                  </Text>
                  <Text style={styles.subtle}>°C</Text>
                </View>
              </View>

              <View style={[styles.tileRow, { marginTop: 10 }]}>
                <View style={styles.tile}>
                  <Text style={styles.tileLabel}>Current humidity</Text>
                  <Text style={styles.tileValue}>
                    {forecast.current_humidity != null
                      ? Number(forecast.current_humidity).toFixed(1)
                      : '-'}
                  </Text>
                  <Text style={styles.subtle}>%RH</Text>
                </View>

                <View style={styles.tile}>
                  <Text style={styles.tileLabel}>Predicted humidity</Text>
                  <Text style={styles.tileValue}>
                    {forecast.predicted_humidity != null
                      ? Number(forecast.predicted_humidity).toFixed(1)
                      : '-'}
                  </Text>
                  <Text style={styles.subtle}>%RH</Text>
                </View>
              </View>

              <BlockCard title="Suitable range">
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <SmallInfoTile
                    label="Temperature"
                    value={`${forecast.optimal_temp_min ?? '-'} to ${forecast.optimal_temp_max ?? '-'} °C`}
                  />
                  <SmallInfoTile
                    label="Humidity"
                    value={`${forecast.optimal_rh_min ?? '-'} to ${forecast.optimal_rh_max ?? '-'} %RH`}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <SmallInfoTile
                    label="Temp risk"
                    value={
                      forecast.temp_status === 'high'
                        ? 'High risk'
                        : forecast.temp_status === 'low'
                        ? 'Low risk'
                        : 'Within range'
                    }
                    tone={
                      forecast.temp_status === 'high'
                        ? 'bad'
                        : forecast.temp_status === 'low'
                        ? 'warn'
                        : 'ok'
                    }
                  />
                  <SmallInfoTile
                    label="RH risk"
                    value={
                      forecast.rh_status === 'high'
                        ? 'High risk'
                        : forecast.rh_status === 'low'
                        ? 'Low risk'
                        : 'Within range'
                    }
                    tone={
                      forecast.rh_status === 'high'
                        ? 'bad'
                        : forecast.rh_status === 'low'
                        ? 'warn'
                        : 'ok'
                    }
                  />
                </View>
              </BlockCard>

              <BlockCard title="Outdoor weather now">
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <SmallInfoTile
                    label="Outdoor temperature"
                    value={
                      forecast.outdoor?.temperature != null
                        ? `${Number(forecast.outdoor.temperature).toFixed(1)} °C`
                        : '-'
                    }
                  />
                  <SmallInfoTile
                    label="Outdoor humidity"
                    value={
                      forecast.outdoor?.humidity != null
                        ? `${Number(forecast.outdoor.humidity).toFixed(1)} %RH`
                        : '-'
                    }
                  />
                </View>

                <View style={{ marginTop: 10 }}>
                  <SmallInfoTile
                    label="Rainfall"
                    value={
                      forecast.outdoor?.rainfall != null
                        ? `${Number(forecast.outdoor.rainfall).toFixed(2)} mm`
                        : '-'
                    }
                  />
                </View>
              </BlockCard>

              {showRhCaution ? (
                <BlockCard title="Humidity note">
                  <Text style={[styles.subtle, { marginTop: 6, lineHeight: 21 }]}>
                    Long-range humidity forecast is less reliable than temperature. Use it as supportive guidance.
                  </Text>
                </BlockCard>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
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

import { fetchEnvironmentForecast60m } from '../../services/environmentApi';
import styles, { C } from './styles';

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

function getShortMessage(forecast) {
  if (!forecast) return 'No forecast information available.';

  const tempHigh = forecast.temp_status === 'high';
  const tempLow = forecast.temp_status === 'low';
  const rhHigh = forecast.rh_status === 'high';
  const rhLow = forecast.rh_status === 'low';

  if (tempHigh && rhLow) {
    return 'In the next hour, temperature may go too high and humidity may go too low.';
  }
  if (tempHigh && rhHigh) {
    return 'In the next hour, both temperature and humidity may go too high.';
  }
  if (tempLow && rhLow) {
    return 'In the next hour, both temperature and humidity may go too low.';
  }
  if (tempLow && rhHigh) {
    return 'In the next hour, temperature may go too low and humidity may go too high.';
  }
  if (tempHigh) {
    return 'In the next hour, temperature may rise above the suitable range.';
  }
  if (tempLow) {
    return 'In the next hour, temperature may fall below the suitable range.';
  }
  if (rhHigh) {
    return 'In the next hour, humidity may rise above the suitable range.';
  }
  if (rhLow) {
    return 'In the next hour, humidity may fall below the suitable range.';
  }

  return 'Temperature and humidity are expected to stay within the suitable range in the next hour.';
}

export default function EnvironmentForecastScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState('');

  const loadForecast = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');
      const data = await fetchEnvironmentForecast60m();
      setForecast(data);
    } catch (e) {
      console.log('fetchEnvironmentForecast60m error:', e);
      setError(e?.message || 'Failed to load forecast');
      setForecast(null);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForecast(false);
  }, [loadForecast]);

  const warningTone = forecast?.warning ? 'bad' : 'ok';
  const warningText = forecast?.warning ? 'Early warning' : 'Stable forecast';
  const shortMessage = getShortMessage(forecast);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.subtle}>Loading next 1 hour forecast...</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => loadForecast(true)} />
        }
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Next 1 hour forecast</Text>
            <ToneChip text={warningText} tone={warningTone} />
          </View>

          {error ? (
            <Text style={[styles.subtle, { color: C.bad, marginTop: 0 }]}>{error}</Text>
          ) : null}

          {!error && forecast ? (
            <>
              <Text style={[styles.subtle, { marginTop: 0 }]}>
                Mushroom: {forecast.mushroom_type || '-'} • Stage: {forecast.stage || '-'}
              </Text>

              <Text style={[styles.subtle, { marginTop: 8, lineHeight: 20 }]}>
                Based on the latest indoor sensor readings and outdoor weather.
              </Text>

              <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
                What may happen in the next hour
              </Text>
              <Text style={[styles.subtle, { lineHeight: 21, marginTop: 0 }]}>
                {shortMessage}
              </Text>

              {forecast.warning ? (
                <Pressable
                  style={[styles.primaryBtn, { marginTop: 14 }]}
                  onPress={() => navigation.navigate('EnvironmentSolution')}
                >
                  <Text style={styles.primaryBtnText}>See preventive action</Text>
                </Pressable>
              ) : null}

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
                <InfoRow
                  label="Temperature"
                  value={`${forecast.optimal_temp_min ?? '-'} to ${forecast.optimal_temp_max ?? '-'} °C`}
                />
                <StatusChipRow label="Temperature risk" status={forecast.temp_status} />

                <InfoRow
                  label="Humidity"
                  value={`${forecast.optimal_rh_min ?? '-'} to ${forecast.optimal_rh_max ?? '-'} %RH`}
                />
                <StatusChipRow label="Humidity risk" status={forecast.rh_status} />
              </BlockCard>

              <BlockCard title="Outdoor weather now">
                <InfoRow
                  label="Outdoor temperature"
                  value={
                    forecast.outdoor?.temperature != null
                      ? `${Number(forecast.outdoor.temperature).toFixed(1)} °C`
                      : '-'
                  }
                />
                <InfoRow
                  label="Outdoor humidity"
                  value={
                    forecast.outdoor?.humidity != null
                      ? `${Number(forecast.outdoor.humidity).toFixed(1)} %RH`
                      : '-'
                  }
                />
                <InfoRow
                  label="Rainfall"
                  value={
                    forecast.outdoor?.rainfall != null
                      ? `${Number(forecast.outdoor.rainfall).toFixed(2)} mm`
                      : '-'
                  }
                />
              </BlockCard>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
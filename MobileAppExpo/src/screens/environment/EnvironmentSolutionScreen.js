// src/screens/environment/EnvironmentSolutionScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { fetchEnvironmentSolutionRecommendation } from '../../services/environmentApi';
import styles, { C } from './styles';

function ActionSection({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <Text
          key={`${title}-${index}`}
          style={[styles.subtle, { marginTop: 8, lineHeight: 22 }]}
        >
          • {item}
        </Text>
      ))}
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
        borderColor: 'rgba(15, 23, 42, 0.12)',
        backgroundColor: '#F6F8FC',
      }}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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

function getCopy(lang) {
  const isSi = lang === 'si';

  return {
    pageTitle: isSi ? 'විසඳුම් මාර්ග' : 'Solution recommendation',
    currentCondition: isSi ? 'වර්තමාන තත්ත්වය' : 'Current condition',
    mushroom: isSi ? 'බිම්මල් වර්ගය' : 'Mushroom',
    stage: isSi ? 'අවධිය' : 'Stage',
    currentValue: isSi ? 'වත්මන් අගය' : 'Current value',
    optimalRange: isSi ? 'සුදුසු පරාසය' : 'Optimal range',
    immediate: isSi ? 'ක්ෂණික ක්‍රියාමාර්ග' : 'Immediate actions',
    shortTerm: isSi ? 'කෙටි කාලීන ක්‍රියාමාර්ග' : 'Short-term actions',
    longTerm: isSi ? 'දිගු කාලීන ක්‍රියාමාර්ග' : 'Long-term actions',
    safety: isSi ? 'ආරක්ෂාව' : 'Safety',
    loading: isSi ? 'විසඳුම් මාර්ග පූරණය වෙමින්...' : 'Loading recommended actions...',
    error: isSi ? 'විසඳුම් මාර්ග පූරණය කළ නොහැකි විය.' : 'Failed to load solution recommendation.',
    helper: isSi
      ? 'වත්මන් තත්ත්වය සහ සුදුසු පරාසය අනුව මෙම ක්‍රියාමාර්ග සකසා ඇත.'
      : 'These actions are based on the current condition and the suitable range.',
    shortSummary: isSi
      ? 'පහත දක්වා ඇති පියවර අනුගමනය කරන්න.'
      : 'Follow the steps below.',
    stageLabels: {
      spawn_run: isSi ? 'Spawn run' : 'Spawn run',
      fruiting: isSi ? 'Fruiting' : 'Fruiting',
      pinning: isSi ? 'Pinning' : 'Pinning',
      harvest: isSi ? 'Harvest' : 'Harvest',
    },
    metricLabels: {
      temperature: isSi ? 'වත්මන් උෂ්ණත්වය' : 'Current temperature',
      humidity: isSi ? 'වත්මන් ආර්ද්‍රතාවය' : 'Current humidity',
      co2: isSi ? 'වත්මන් CO₂ අගය' : 'Current CO₂ value',
    },
    rangeLabels: {
      temperature: isSi ? 'සුදුසු උෂ්ණත්ව පරාසය' : 'Suitable temperature range',
      humidity: isSi ? 'සුදුසු ආර්ද්‍රතා පරාසය' : 'Suitable humidity range',
      co2: isSi ? 'සුදුසු CO₂ පරාසය' : 'Suitable CO₂ range',
    },
  };
}

function formatStage(stage, copy) {
  if (!stage) return '-';
  return copy.stageLabels[stage] || String(stage).replace(/_/g, ' ');
}

function getMetricUnit(metric) {
  if (metric === 'temperature') return '°C';
  if (metric === 'humidity') return '%RH';
  if (metric === 'co2') return 'ppm';
  return '';
}

function formatNumber(value, decimals = 1) {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return Number(value).toFixed(decimals);
}

function formatSingleValue(value, metric) {
  if (value == null) return '-';

  const unit = getMetricUnit(metric);

  if (metric === 'co2') {
    return unit ? `${Math.round(Number(value))} ${unit}` : String(Math.round(Number(value)));
  }

  const formatted = formatNumber(value, 1);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatRange(min, max, metric) {
  if (min == null || max == null) return '-';

  const unit = getMetricUnit(metric);

  if (metric === 'co2') {
    const minVal = Math.round(Number(min));
    const maxVal = Math.round(Number(max));
    return unit ? `${minVal} to ${maxVal} ${unit}` : `${minVal} to ${maxVal}`;
  }

  const minVal = formatNumber(min, 1);
  const maxVal = formatNumber(max, 1);
  return unit ? `${minVal} to ${maxVal} ${unit}` : `${minVal} to ${maxVal}`;
}

export default function EnvironmentSolutionScreen() {
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const copy = useMemo(() => getCopy(lang), [lang]);

  async function loadRecommendation(nextLang = lang, isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');
      const res = await fetchEnvironmentSolutionRecommendation(nextLang);
      setData(res);
    } catch (e) {
      console.log('fetchEnvironmentSolutionRecommendation error:', e);
      setError(copy.error);
      setData(null);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendation(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.subtle}>{copy.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const metric = data?.metric || 'temperature';
  const currentValueLabel = copy.metricLabels[metric] || copy.currentValue;
  const rangeLabel = copy.rangeLabels[metric] || copy.optimalRange;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadRecommendation(lang, true)} />
        }
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{copy.pageTitle}</Text>

            <Pressable
              style={styles.selectBtn}
              onPress={() => setLang((prev) => (prev === 'en' ? 'si' : 'en'))}
            >
              <Text style={styles.selectBtnText}>
                {lang === 'en' ? 'සිංහල' : 'English'}
              </Text>
            </Pressable>
          </View>

          {error ? (
            <Text style={[styles.subtle, { color: C.bad, marginTop: 0 }]}>{error}</Text>
          ) : null}

          {!error && data?.note ? (
            <Text style={[styles.subtle, { marginTop: 0 }]}>{data.note}</Text>
          ) : null}

          {!error && !data?.note ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 4 }]}>
                {data?.title || copy.pageTitle}
              </Text>

              <Text style={[styles.subtle, { marginTop: 8, lineHeight: 20 }]}>
                {copy.helper}
              </Text>

              <Text style={[styles.subtle, { marginTop: 6, lineHeight: 20 }]}>
                {copy.shortSummary}
              </Text>

              <BlockCard title={copy.currentCondition}>
                <InfoRow
                  label={copy.mushroom}
                  value={data?.mushroom_type || '-'}
                />
                <InfoRow
                  label={copy.stage}
                  value={formatStage(data?.stage, copy)}
                />
                <InfoRow
                  label={currentValueLabel}
                  value={formatSingleValue(data?.current_value, metric)}
                />
                <InfoRow
                  label={rangeLabel}
                  value={formatRange(data?.optimal_min, data?.optimal_max, metric)}
                />
              </BlockCard>

              <ActionSection
                title={copy.immediate}
                items={data?.immediate || []}
              />

              <ActionSection
                title={copy.shortTerm}
                items={data?.short_term || []}
              />

              <ActionSection
                title={copy.longTerm}
                items={data?.long_term || []}
              />

              <ActionSection
                title={copy.safety}
                items={data?.safety || []}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
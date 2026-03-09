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

function SectionCard({ title, children, tint = '#F6F8FC', border = 'rgba(15, 23, 42, 0.10)' }) {
  return (
    <View
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: tint,
      }}
    >
      <Text style={[styles.sectionTitle, { marginTop: 0 }]}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value, valueColor = C.text }) {
  return (
    <View
      style={{
        marginTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(15, 23, 42, 0.08)',
      }}
    >
      <Text style={[styles.subtle, { marginTop: 0 }]}>{label}</Text>
      <Text style={{ color: valueColor, fontWeight: '800', marginTop: 4, fontSize: 15 }}>
        {value}
      </Text>
    </View>
  );
}

function ActionSection({ title, items, accent = '#2563EB' }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <SectionCard
      title={title}
      tint="#FFFFFF"
      border="rgba(15, 23, 42, 0.10)"
    >
      {items.map((item, index) => (
        <View
          key={`${title}-${index}`}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            marginTop: index === 0 ? 12 : 10,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>
              {index + 1}
            </Text>
          </View>

          <Text
            style={[
              styles.subtle,
              {
                flex: 1,
                marginTop: 0,
                lineHeight: 22,
                color: C.text,
              },
            ]}
          >
            {item}
          </Text>
        </View>
      ))}
    </SectionCard>
  );
}

function getCopy(lang) {
  const isSi = lang === 'si';

  return {
    pageTitle: isSi ? 'විසඳුම් මාර්ග' : 'Solution recommendation',
    pageSub: isSi
      ? 'වත්මන් පාරිසරික තත්ත්වය අනුව ගැළපෙන ක්‍රියාමාර්ග'
      : 'Recommended actions based on the current environmental condition',
    currentCondition: isSi ? 'වර්තමාන තත්ත්වය' : 'Current condition',
    mushroom: isSi ? 'බිම්මල් වර්ගය' : 'Mushroom',
    stage: isSi ? 'අවධිය' : 'Stage',
    currentValue: isSi ? 'වත්මන් අගය' : 'Current value',
    optimalRange: isSi ? 'සුදුසු පරාසය' : 'Optimal range',
    issueType: isSi ? 'ගැටලුව' : 'Issue',
    immediate: isSi ? 'ක්ෂණික ක්‍රියාමාර්ග' : 'Immediate actions',
    shortTerm: isSi ? 'කෙටි කාලීන ක්‍රියාමාර්ග' : 'Short-term actions',
    longTerm: isSi ? 'දිගු කාලීන ක්‍රියාමාර්ග' : 'Long-term actions',
    safety: isSi ? 'ආරක්ෂාව' : 'Safety',
    loading: isSi ? 'විසඳුම් මාර්ග පූරණය වෙමින්...' : 'Loading recommended actions...',
    error: isSi ? 'විසඳුම් මාර්ග පූරණය කළ නොහැකි විය.' : 'Failed to load solution recommendation.',
    helper: isSi
      ? 'මෙම පියවර වර්තමාන අගය සහ සුදුසු පරාසය අනුව සකසා ඇත.'
      : 'These actions are prepared based on the current value and the suitable range.',
    noIssueTitle: isSi ? 'දැනට විශේෂ ගැටලුවක් නැහැ' : 'No major issue detected',
    refresh: isSi ? 'නැවත පූරණය' : 'Refresh',
    languageLabel: isSi ? 'English' : 'සිංහල',
    stageLabels: {
      spawn_run: isSi ? 'Spawn run' : 'Spawn run',
      fruiting: isSi ? 'Fruiting' : 'Fruiting',
      pinning: isSi ? 'Pinning' : 'Pinning',
      harvest: isSi ? 'Harvest' : 'Harvest',
    },
    metricLabels: {
      temperature: isSi ? 'උෂ්ණත්වය' : 'Temperature',
      humidity: isSi ? 'ආර්ද්‍රතාවය' : 'Humidity',
      co2: isSi ? 'CO₂' : 'CO₂',
    },
    currentMetricLabels: {
      temperature: isSi ? 'වත්මන් උෂ්ණත්වය' : 'Current temperature',
      humidity: isSi ? 'වත්මන් ආර්ද්‍රතාවය' : 'Current humidity',
      co2: isSi ? 'වත්මන් CO₂ අගය' : 'Current CO₂ value',
    },
    rangeLabels: {
      temperature: isSi ? 'සුදුසු උෂ්ණත්ව පරාසය' : 'Suitable temperature range',
      humidity: isSi ? 'සුදුසු ආර්ද්‍රතා පරාසය' : 'Suitable humidity range',
      co2: isSi ? 'සුදුසු CO₂ මට්ටම' : 'Suitable CO₂ range',
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
    const rounded = Math.round(Number(value));
    return unit ? `${rounded} ${unit}` : String(rounded);
  }

  const formatted = formatNumber(value, 1);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatRange(min, max, metric) {
  const unit = getMetricUnit(metric);

  if (metric === 'co2') {
    if (max != null) {
      const maxVal = Math.round(Number(max));
      return unit ? `Up to ${maxVal} ${unit}` : `Up to ${maxVal}`;
    }
    if (min != null) {
      const minVal = Math.round(Number(min));
      return unit ? `${minVal} ${unit}` : String(minVal);
    }
    return '-';
  }

  if (min == null || max == null) return '-';

  const minVal = formatNumber(min, 1);
  const maxVal = formatNumber(max, 1);
  return unit ? `${minVal} to ${maxVal} ${unit}` : `${minVal} to ${maxVal}`;
}

function getMetricAccent(metric) {
  if (metric === 'temperature') return '#DC2626';
  if (metric === 'humidity') return '#2563EB';
  if (metric === 'co2') return '#7C3AED';
  return '#2563EB';
}

function getMetricChipBg(metric) {
  if (metric === 'temperature') return '#FEF2F2';
  if (metric === 'humidity') return '#EFF6FF';
  if (metric === 'co2') return '#F5F3FF';
  return '#EFF6FF';
}

export default function EnvironmentSolutionScreen() {
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const copy = useMemo(() => getCopy(lang), [lang]);

  async function loadRecommendation(nextLang = lang, isRefresh = false) {
    const nextCopy = getCopy(nextLang);

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');
      const res = await fetchEnvironmentSolutionRecommendation(nextLang);
      setData(res);
    } catch (e) {
      console.log('fetchEnvironmentSolutionRecommendation error:', e);
      setError(nextCopy.error);
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

  const metric = data?.metric || 'temperature';
  const accent = getMetricAccent(metric);
  const chipBg = getMetricChipBg(metric);
  const metricLabel = copy.metricLabels[metric] || metric;
  const currentValueLabel = copy.currentMetricLabels[metric] || copy.currentValue;
  const rangeLabel = copy.rangeLabels[metric] || copy.optimalRange;

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.subtle}>{copy.loading}</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => loadRecommendation(lang, true)} />
        }
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.cardTitle}>{copy.pageTitle}</Text>
              <Text style={[styles.subtle, { marginTop: 4, lineHeight: 20 }]}>
                {copy.pageSub}
              </Text>
            </View>

            <Pressable
              style={styles.selectBtn}
              onPress={() => setLang((prev) => (prev === 'en' ? 'si' : 'en'))}
            >
              <Text style={styles.selectBtnText}>{copy.languageLabel}</Text>
            </Pressable>
          </View>

          <View
            style={{
              marginTop: 14,
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: chipBg,
              borderWidth: 1,
              borderColor: accent + '33',
            }}
          >
            <Text style={{ color: accent, fontWeight: '800', fontSize: 12 }}>
              {metricLabel}
            </Text>
          </View>

          {error ? (
            <SectionCard
              title={copy.pageTitle}
              tint="#FEF2F2"
              border="#FECACA"
            >
              <Text style={[styles.subtle, { marginTop: 10, color: C.bad, lineHeight: 21 }]}>
                {error}
              </Text>

              <Pressable
                onPress={() => loadRecommendation(lang)}
                style={{
                  marginTop: 14,
                  alignSelf: 'flex-start',
                  backgroundColor: C.bad,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>{copy.refresh}</Text>
              </Pressable>
            </SectionCard>
          ) : null}

          {!error && data?.note ? (
            <>
              <SectionCard
                title={copy.noIssueTitle}
                tint="#ECFDF5"
                border="#BBF7D0"
              >
                <Text style={[styles.subtle, { marginTop: 10, color: C.text, lineHeight: 21 }]}>
                  {data.note}
                </Text>
              </SectionCard>

              <SectionCard title={copy.currentCondition}>
                <InfoRow
                  label={copy.mushroom}
                  value={data?.mushroom_type || '-'}
                />
                <InfoRow
                  label={copy.stage}
                  value={formatStage(data?.stage, copy)}
                />
              </SectionCard>
            </>
          ) : null}

          {!error && !data?.note ? (
            <>
              <SectionCard title={data?.title || copy.pageTitle}>
                <Text style={[styles.subtle, { marginTop: 10, lineHeight: 20 }]}>
                  {copy.helper}
                </Text>

                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: 'rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <InfoRow
                    label={copy.issueType}
                    value={data?.title || '-'}
                    valueColor={accent}
                  />
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
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.subtle, { marginTop: 0 }]}>{rangeLabel}</Text>
                    <Text style={{ color: C.text, fontWeight: '800', marginTop: 4, fontSize: 15 }}>
                      {formatRange(data?.optimal_min, data?.optimal_max, metric)}
                    </Text>
                  </View>
                </View>
              </SectionCard>

              <ActionSection
                title={copy.immediate}
                items={data?.immediate || []}
                accent="#E57373"
              />

              <ActionSection
                title={copy.shortTerm}
                items={data?.short_term || []}
                accent="#E0A458"
              />

              <ActionSection
                title={copy.longTerm}
                items={data?.long_term || []}
                accent="#6FA8DC"
              />

              <ActionSection
                title={copy.safety}
                items={data?.safety || []}
                accent="#9B8AE6"
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
// src/screens/environment/EnvironmentView.js
import React, { useMemo, useState } from 'react';
import { Text, View, Pressable, Modal, FlatList } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

import styles, { C } from './styles';

function Chip({ tone = 'muted', text }) {
  const color =
    tone === 'ok' ? C.ok : tone === 'bad' ? C.bad : tone === 'warn' ? C.warn : C.muted;

  const bg =
    tone === 'ok'
      ? 'rgba(22, 163, 74, 0.12)'
      : tone === 'bad'
      ? 'rgba(225, 29, 72, 0.12)'
      : tone === 'warn'
      ? 'rgba(217, 119, 6, 0.12)'
      : 'rgba(15, 23, 42, 0.06)';

  return (
    <View style={[styles.chip, { borderColor: color, backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]}>{text}</Text>
    </View>
  );
}

function Card({ title, right, children }) {
  return (
    <View style={styles.card}>
      {(title || right) && (
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{title}</Text>
          {right ? <View>{right}</View> : null}
        </View>
      )}
      {children}
    </View>
  );
}

function StatTile({ label, value, unit, status, subtitle }) {
  const tone = status === 'within' ? 'ok' : status === 'out' ? 'bad' : 'muted';
  const chipText = status === 'within' ? 'Within' : status === 'out' ? 'Out' : '—';

  return (
    <View style={styles.tile}>
      <View style={styles.tileTopRow}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Chip tone={tone} text={chipText} />
      </View>

      <Text style={styles.tileValue}>
        {value}
        <Text style={styles.tileUnit}> {unit}</Text>
      </Text>

      {!!subtitle && <Text style={styles.tileSub}>{subtitle}</Text>}
    </View>
  );
}

function AlertRow({ title, message, rightText, severity = 'bad' }) {
  const isWarn = severity === 'warn';
  const tintBg = isWarn ? 'rgba(217, 119, 6, 0.10)' : 'rgba(225, 29, 72, 0.10)';
  const tintBorder = isWarn ? 'rgba(217, 119, 6, 0.22)' : 'rgba(225, 29, 72, 0.22)';
  const dotColor = isWarn ? C.warn : C.bad;

  return (
    <View style={[styles.alertBanner, { backgroundColor: tintBg, borderColor: tintBorder }]}>
      <View style={[styles.alertDot, { backgroundColor: dotColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMsg}>{message}</Text>
      </View>
      {!!rightText && <Text style={[styles.alertRight, { color: dotColor }]}>{rightText}</Text>}
    </View>
  );
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

function SimpleLineChart({ points, field, yMin, yMax, height = 150, yTicks = null }) {
  const [width, setWidth] = useState(0);

  const paddingLeft = 44;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 24;

  const n = points?.length || 0;

  const computedYTicks = useMemo(() => {
    if (Array.isArray(yTicks) && yTicks.length > 0) return yTicks;

    const t0 = yMin;
    const t1 = yMin + (yMax - yMin) * 0.33;
    const t2 = yMin + (yMax - yMin) * 0.66;
    const t3 = yMax;
    return [t0, t1, t2, t3].map((v) => Number(v.toFixed(0)));
  }, [yTicks, yMin, yMax]);

  const xTickIndices = useMemo(() => {
    if (!n) return [];
    if (n === 1) return [0];
    const q1 = Math.round((n - 1) * 0.25);
    const q2 = Math.round((n - 1) * 0.5);
    const q3 = Math.round((n - 1) * 0.75);
    return Array.from(new Set([0, q1, q2, q3, n - 1]));
  }, [n]);

  const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const { linePath, areaPaths, plotW, plotH } = useMemo(() => {
    if (!width) {
      return { linePath: '', areaPaths: [], plotW: 0, plotH: 0 };
    }

    const w = width;
    const h = height;

    const pw = Math.max(10, w - paddingLeft - paddingRight);
    const ph = Math.max(10, h - paddingTop - paddingBottom);
    const bY = paddingTop + ph;

    if (!points || points.length < 2) {
      return { linePath: '', areaPaths: [], plotW: pw, plotH: ph, baseY: bY };
    }

    const scaleX = (i) => paddingLeft + (i / (points.length - 1)) * pw;

    const scaleY = (v) => {
      const clamped = Math.max(yMin, Math.min(yMax, v));
      const t = (clamped - yMin) / (yMax - yMin);
      return paddingTop + (1 - t) * ph;
    };

    let lp = '';
    let started = false;

    const segments = [];
    let current = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const v = p?.[field];
      const x = scaleX(i);

      if (v === null || v === undefined) {
        if (current.length >= 2) segments.push(current);
        current = [];
        started = false;
        continue;
      }

      const y = scaleY(Number(v));

      if (!started) {
        lp += `M ${x.toFixed(2)} ${y.toFixed(2)} `;
        started = true;
      } else {
        lp += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
      }

      current.push({ x, y });
    }

    if (current.length >= 2) segments.push(current);

    const ap = segments.map((seg) => {
      const first = seg[0];
      const last = seg[seg.length - 1];

      let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} `;
      for (let i = 1; i < seg.length; i++) {
        d += `L ${seg[i].x.toFixed(2)} ${seg[i].y.toFixed(2)} `;
      }

      d += `L ${last.x.toFixed(2)} ${bY.toFixed(2)} `;
      d += `L ${first.x.toFixed(2)} ${bY.toFixed(2)} Z`;
      return d;
    });

    return { linePath: lp.trim(), areaPaths: ap, plotW: pw, plotH: ph, baseY: bY };
  }, [width, height, points, field, yMin, yMax]);

  const gradientId = `areaGrad_${field}`;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ width: '100%', height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={C.primary} stopOpacity="0.28" />
              <Stop offset="60%" stopColor={C.primary} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={C.primary} stopOpacity="0.00" />
            </LinearGradient>
          </Defs>

          <Line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + plotH}
            stroke={C.chartAxis}
            strokeWidth="1"
          />
          <Line
            x1={paddingLeft}
            y1={paddingTop + plotH}
            x2={paddingLeft + plotW}
            y2={paddingTop + plotH}
            stroke={C.chartAxis}
            strokeWidth="1"
          />

          {computedYTicks.map((tickVal, idx) => {
            const t = (tickVal - yMin) / (yMax - yMin);
            const y = paddingTop + (1 - t) * plotH;

            return (
              <React.Fragment key={`y-${idx}`}>
                <Line
                  x1={paddingLeft - 4}
                  y1={y}
                  x2={paddingLeft}
                  y2={y}
                  stroke={C.chartAxis}
                  strokeWidth="1"
                />
                <SvgText x={paddingLeft - 8} y={y + 3} fontSize="10" fill={C.chartTick} textAnchor="end">
                  {Number(tickVal).toFixed(0)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {xTickIndices.map((i) => {
            const denom = Math.max(1, n - 1);
            const x = paddingLeft + (i / denom) * plotW;
            const label = fmtTime(points?.[i]?.ts);

            return (
              <React.Fragment key={`x-${i}`}>
                <Line
                  x1={x}
                  y1={paddingTop + plotH}
                  x2={x}
                  y2={paddingTop + plotH + 4}
                  stroke={C.chartAxis}
                  strokeWidth="1"
                />
                <SvgText x={x} y={paddingTop + plotH + 16} fontSize="10" fill={C.chartTick} textAnchor="middle">
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}

          {areaPaths.map((d, idx) => (
            <Path key={`area-${idx}`} d={d} fill={`url(#${gradientId})`} stroke="none" />
          ))}

          {linePath ? <Path d={linePath} stroke={C.primary} strokeWidth="2.5" fill="none" /> : null}
        </Svg>
      ) : null}
    </View>
  );
}

export default function EnvironmentView(props) {
  const {
    headerStatus,
    headerSubline,
    health,
    healthError,

    reading,
    range,
    tempInRange,
    rhInRange,
    co2Value,
    co2InRange,
    tempSubtitle,
    rhSubtitle,
    co2Subtitle,

    activeAlerts,
    profileUpdating,
    deltaText,

    profile,
    stageLabel,
    hasAnyCo2,
    co2RangeLabel,

    graphMode,
    setGraphMode,
    historyPoints,
    dateForButtons,
    graphHint,
    openGraphDatePicker,

    recSource,
    setRecSource,
    recHint,
    recLoading,
    recommendation,
    loadRecommendation,
    openRecDatePicker,

    ensureRecRangeLoaded,
    recRangeCache,
    recExpandedKey,
    setRecExpandedKey,
    showAllRecs,
    setShowAllRecs,

    showMushroomModal,
    setShowMushroomModal,
    showStageModal,
    setShowStageModal,
    showDateModal,
    setShowDateModal,
    showRecDateModal,
    setShowRecDateModal,

    mushroomItems,
    stageItems,
    dateItems,

    onOpenSolutionRecommendation,
    onOpenForecast,

    onPickMushroom,
    onPickStage,
    onPickGraphDate,
    onPickRecDate,
  } = props;

  return (
    <>
      <View style={styles.header}>
        <Chip tone={headerStatus?.tone} text={headerStatus?.text} />
      </View>

      <Text style={styles.headerSub}>{headerSubline}</Text>

      {!health && healthError ? (
        <Text style={[styles.subtle, { marginTop: 6 }]}>Unable to read sensor status.</Text>
      ) : null}

      {health && !health.online ? (
        <Text style={[styles.subtle, { marginTop: 6 }]}>
          No data received recently. Check ESP32 power/Wi-Fi and server IP.
        </Text>
      ) : null}

      <Card title="Live readings">
        <View style={styles.tileRow}>
          <StatTile
            label="Temp"
            value={reading?.temperature?.toFixed?.(1) ?? '-'}
            unit="°C"
            status={tempInRange === null ? 'muted' : tempInRange ? 'within' : 'out'}
            subtitle={tempSubtitle}
          />
          <StatTile
            label="RH"
            value={reading?.humidity?.toFixed?.(1) ?? '-'}
            unit="%"
            status={rhInRange === null ? 'muted' : rhInRange ? 'within' : 'out'}
            subtitle={rhSubtitle}
          />
        </View>

        <View style={{ height: 10 }} />

        <StatTile
          label="CO₂ (estimated)"
          value={co2Value?.toFixed?.(0) ?? '-'}
          unit="ppm"
          status={co2InRange === null ? 'muted' : co2InRange ? 'within' : 'out'}
          subtitle={co2Subtitle}
        />
      </Card>

      <Card title="Alerts" right={profileUpdating ? <Chip tone="warn" text="Updating..." /> : null}>
        {profileUpdating ? (
          <Text style={styles.subtle}>Refreshing alerts for the selected mushroom type...</Text>
        ) : null}

        {activeAlerts?.length > 0 ? (
          <View style={{ marginTop: 2 }}>
            {activeAlerts.map((a) => {
              const isTemp = a.param === 'temperature';
              const isHum = a.param === 'humidity';

              const delta =
                range && reading
                  ? isTemp
                    ? deltaText(reading.temperature, range.temp_min, range.temp_max, '°C', 1)
                    : isHum
                    ? deltaText(reading.humidity, range.rh_min, range.rh_max, '%', 1)
                    : null
                  : null;

              const targetText =
                range
                  ? isTemp
                    ? `Target ${range.temp_min}–${range.temp_max}°C`
                    : isHum
                    ? `Target ${range.rh_min}–${range.rh_max}%`
                    : null
                  : null;

              const cleanMessage = targetText
                ? `${isTemp ? 'Temperature' : 'Humidity'} out of range. ${targetText}.`
                : a.last_message || 'Out of range';

              return (
                <AlertRow
                  key={a.param}
                  title={isTemp ? 'Temperature' : isHum ? 'Humidity' : String(a.param)}
                  message={cleanMessage}
                  rightText={delta && delta !== 'Within range' ? delta : null}
                  severity="bad"
                />
              );
            })}
          </View>
        ) : (
          <Text style={styles.subtle}>No active alerts.</Text>
        )}
        <View style={{ marginTop: 12, gap: 10 }}>
          <Pressable style={styles.primaryBtn} onPress={onOpenForecast}>
            <Text style={styles.primaryBtnText}>View 60-minute forecast</Text>
          </Pressable>

          <Pressable style={styles.primaryBtn} onPress={onOpenSolutionRecommendation}>
            <Text style={styles.primaryBtnText}>View solution recommendation</Text>
          </Pressable>
        </View>
      </Card>

      <Card title="Mushroom profile">
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Mushroom type</Text>
          <Pressable style={styles.selectBtn} onPress={() => setShowMushroomModal(true)}>
            <Text style={styles.selectBtnText}>{profile?.mushroom_type ?? 'Select'}</Text>
          </Pressable>
        </View>

        <View style={[styles.rowBetween, { marginTop: 10 }]}>
          <Text style={styles.label}>Stage</Text>
          <Pressable style={styles.selectBtn} onPress={() => setShowStageModal(true)}>
            <Text style={styles.selectBtnText}>{stageLabel ?? 'Select'}</Text>
          </Pressable>
        </View>

        {range ? (
          <View style={{ marginTop: 14 }}>
            <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 18 }]}>Optimal comparison</Text>

            <View style={styles.optRow}>
              <Text style={styles.optLeft}>Temp</Text>
              <Text style={styles.optMid}>
                <Text style={styles.optMuted}>
                  Target {range.temp_min}–{range.temp_max}°C
                </Text>
              </Text>
              <Text
                style={[
                  styles.optRight,
                  tempInRange === null ? null : tempInRange ? styles.okText : styles.badText,
                ]}
              >
                {tempInRange === null ? '—' : tempInRange ? 'Within' : 'Out'}
              </Text>
            </View>

            <View style={[styles.optRow, { marginTop: 10 }]}>
              <Text style={styles.optLeft}>RH</Text>
              <Text style={styles.optMid}>
                <Text style={styles.optMuted}>
                  Target {range.rh_min}–{range.rh_max}%
                </Text>
              </Text>
              <Text
                style={[
                  styles.optRight,
                  rhInRange === null ? null : rhInRange ? styles.okText : styles.badText,
                ]}
              >
                {rhInRange === null ? '—' : rhInRange ? 'Within' : 'Out'}
              </Text>
            </View>

            <View style={[styles.optRow, { marginTop: 10 }]}>
              <Text style={styles.optLeft}>CO₂</Text>
              <Text style={styles.optMid}>
                <Text style={styles.optMuted}>{hasAnyCo2 ? `Target ${co2RangeLabel}` : 'No target'}</Text>
              </Text>
              <Text
                style={[
                  styles.optRight,
                  co2InRange === null ? null : co2InRange ? styles.okText : styles.badText,
                ]}
              >
                {co2InRange === null ? '—' : co2InRange ? 'Within' : 'Out'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.subtle}>Select mushroom type and stage to see optimal ranges.</Text>
        )}
      </Card>

      <Card title="Graphs">
        <View style={styles.segmentWrap}>
          <Pressable
            style={[styles.segmentBtn, graphMode === 'last_1h' && styles.segmentBtnActive]}
            onPress={() => setGraphMode('last_1h')}
          >
            <Text style={[styles.segmentText, graphMode === 'last_1h' && styles.segmentTextActive]}>
              Last 1h
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, graphMode === 'date' && styles.segmentBtnActive]}
            onPress={openGraphDatePicker}
          >
            <Text style={[styles.segmentText, graphMode === 'date' && styles.segmentTextActive]}>
              Date
            </Text>
            <Text style={[styles.segmentSub, graphMode === 'date' && styles.segmentSubActive]}>
              {dateForButtons}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.subtle}>{graphHint}</Text>

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Temperature (0–45°C)</Text>
        <SimpleLineChart points={historyPoints} field="temperature" yMin={0} yMax={45} yTicks={[0, 15, 30, 45]} />

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Humidity (0–100%RH)</Text>
        <SimpleLineChart points={historyPoints} field="humidity" yMin={0} yMax={100} yTicks={[0, 50, 100]} />

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>CO₂ (0–5000 ppm)</Text>
        <SimpleLineChart points={historyPoints} field="co2" yMin={0} yMax={5000} yTicks={[0, 2500, 5000]} />
      </Card>

      <Card title="Variety recommendation">
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
            onPress={openRecDatePicker}
          >
            <Text style={[styles.segmentText, recSource === 'date' && styles.segmentTextActive]}>
              Date
            </Text>
            <Text style={[styles.segmentSub, recSource === 'date' && styles.segmentSubActive]}>
              {dateForButtons}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.subtle}>{recHint}</Text>

        <Pressable
          style={[styles.primaryBtn, recLoading && { opacity: 0.7 }]}
          onPress={() => loadRecommendation()}
          disabled={recLoading}
        >
          <Text style={styles.primaryBtnText}>{recLoading ? 'Loading...' : 'Get recommendation'}</Text>
        </Pressable>

        {recommendation?.temperature != null && recommendation?.humidity != null ? (
          <Text style={styles.subtle}>
            Used: Temp {recommendation.temperature.toFixed(1)}°C, RH {recommendation.humidity.toFixed(1)}%
            {recommendation.points_used ? ` (points: ${recommendation.points_used})` : ''}
          </Text>
        ) : (
          <Text style={styles.subtle}>No data available for the selected source yet.</Text>
        )}

        {recommendation?.recommendations?.length > 0 ? (
          <View style={{ marginTop: 10 }}>
            {(showAllRecs ? recommendation.recommendations : recommendation.recommendations.slice(0, 3)).map(
              (r, idx) => {
                const key = `${r.mushroom_type}-${idx}`;
                const expanded = recExpandedKey === key;

                const parts = String(r.reason || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);

                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      const next = expanded ? null : key;
                      setRecExpandedKey(next);
                      if (!expanded) ensureRecRangeLoaded(r.mushroom_type);
                    }}
                    style={[styles.recItem, expanded && styles.recItemExpanded]}
                  >
                    <View style={styles.recTopRow}>
                      <Text style={styles.recTitle}>
                        {idx + 1}. {r.mushroom_type}
                      </Text>

                      <View style={styles.recRightGroup}>
                        <Text style={styles.recScore}>{Number(r.score).toFixed(2)}</Text>
                        <Text style={styles.recChevron}>{expanded ? '▴' : '▾'}</Text>
                      </View>
                    </View>

                    {!expanded ? (
                      <Text style={styles.recHint} numberOfLines={1}>
                        {r.reason}
                      </Text>
                    ) : (
                      <View style={styles.recDetails}>
                        {parts.length > 0 ? (
                          parts.map((p, i) => (
                            <Text key={i} style={styles.recDetailText}>
                              {p}
                            </Text>
                          ))
                        ) : (
                          <Text style={styles.recDetailText}>No details available</Text>
                        )}

                        <View style={{ marginTop: 10 }}>
                          {!profile?.stage ? (
                            <Text style={styles.recDetailText}>Select a stage to show target ranges.</Text>
                          ) : (() => {
                              const cacheKey = `${r.mushroom_type}__${profile.stage || 'no_stage'}`;
                              const cache = recRangeCache?.[cacheKey];
                              const rg = cache?.range;

                              const usedT = recommendation?.temperature;
                              const usedH = recommendation?.humidity;

                              if (cache?.loading) return <Text style={styles.recDetailText}>Loading target ranges...</Text>;
                              if (cache?.error) return <Text style={styles.recDetailText}>Could not load target ranges.</Text>;
                              if (!rg) return null;

                              const hasCo2Min2 = rg.co2_min != null && Number.isFinite(Number(rg.co2_min));
                              const hasCo2Max2 = rg.co2_max != null && Number.isFinite(Number(rg.co2_max));
                              const co2Label2 =
                                hasCo2Min2 && hasCo2Max2
                                  ? `${Number(rg.co2_min)}–${Number(rg.co2_max)} ppm`
                                  : hasCo2Max2
                                  ? `≤ ${Number(rg.co2_max)} ppm`
                                  : hasCo2Min2
                                  ? `≥ ${Number(rg.co2_min)} ppm`
                                  : null;

                              return (
                                <>
                                  <Text style={[styles.recDetailText, { fontWeight: '900', color: C.text }]}>
                                    Target ranges ({stageLabel || profile.stage})
                                  </Text>

                                  <Text style={styles.recDetailText}>
                                    Temp target: {rg.temp_min}–{rg.temp_max}°C
                                    {usedT != null ? ` • Used: ${Number(usedT).toFixed(1)}°C` : ''}
                                  </Text>

                                  <Text style={styles.recDetailText}>
                                    RH target: {rg.rh_min}–{rg.rh_max}%
                                    {usedH != null ? ` • Used: ${Number(usedH).toFixed(1)}%` : ''}
                                  </Text>

                                  {co2Label2 ? (
                                    <Text style={styles.recDetailText}>CO₂ target: {co2Label2}</Text>
                                  ) : null}
                                </>
                              );
                            })()}
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              }
            )}

            {recommendation.recommendations.length > 3 ? (
              <Pressable style={styles.showMoreBtn} onPress={() => setShowAllRecs((v) => !v)}>
                <Text style={styles.showMoreText}>{showAllRecs ? 'Show top 3 only' : 'Show all'}</Text>
              </Pressable>
            ) : null}

            <Text style={[styles.subtle, { marginTop: 8 }]}>Lower score means a better match.</Text>
          </View>
        ) : null}
      </Card>

      <SelectModal
        visible={!!showMushroomModal}
        title="Select mushroom type"
        items={mushroomItems || []}
        onClose={() => setShowMushroomModal(false)}
        onPick={onPickMushroom}
      />

      <SelectModal
        visible={!!showStageModal}
        title="Select stage"
        items={stageItems || []}
        onClose={() => setShowStageModal(false)}
        onPick={onPickStage}
      />

      <SelectModal
        visible={!!showDateModal}
        title="Select date"
        items={dateItems || []}
        onClose={() => setShowDateModal(false)}
        onPick={onPickGraphDate}
      />

      <SelectModal
        visible={!!showRecDateModal}
        title="Select date for recommendation"
        items={dateItems || []}
        onClose={() => setShowRecDateModal(false)}
        onPick={onPickRecDate}
      />
    </>
  );
}
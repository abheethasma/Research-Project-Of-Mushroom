// src/screens/environment/styles.js
import { StyleSheet } from 'react-native';

export const C = {
  // App surfaces
  bg: '#F3F6FB',
  surface: '#FFFFFF',
  surface2: '#F6F8FC',
  border: 'rgba(15, 23, 42, 0.12)',

  // Text
  text: '#0F172A',
  muted: 'rgba(15, 23, 42, 0.62)',
  faint: 'rgba(15, 23, 42, 0.42)',

  // Accents
  primary: '#2563EB',

  // Status colors
  ok: '#16A34A',
  bad: '#E11D48',
  warn: '#D97706',

  // Chart helpers
  chartAxis: 'rgba(15, 23, 42, 0.20)',
  chartTick: 'rgba(15, 23, 42, 0.55)',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 16 },
  scrollContent: { paddingBottom: 32 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSub: { marginTop: 10, color: C.muted, fontSize: 13 },

  subtle: { color: C.muted, marginTop: 10, fontSize: 12 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: { color: C.text, fontWeight: '800', fontSize: 16 },

  sectionTitle: { color: C.text, fontWeight: '800', marginBottom: 8 },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  chipText: { fontSize: 12, fontWeight: '800' },

  tileRow: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  tileTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileLabel: { color: C.muted, fontSize: 12, fontWeight: '700' },
  tileValue: { color: C.text, fontSize: 22, fontWeight: '900', marginTop: 8 },
  tileUnit: { color: C.muted, fontSize: 12, fontWeight: '800' },
  tileSub: { color: C.muted, fontSize: 12, marginTop: 6 },

  alertBanner: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    marginTop: 4,
  },
  alertTitle: { color: C.text, fontSize: 14, fontWeight: '900' },
  alertMsg: { color: C.muted, fontSize: 13, marginTop: 2 },
  alertRight: { fontSize: 13, fontWeight: '900', marginLeft: 8 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: C.muted, fontWeight: '700' },

  selectBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
    maxWidth: 220,
  },
  selectBtnText: { color: C.text, fontWeight: '800' },

  okText: { color: C.ok, fontWeight: '900' },
  badText: { color: C.bad, fontWeight: '900' },

  optRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optLeft: { width: 46, color: C.text, fontWeight: '900' },
  optMid: { flex: 1, color: C.text, fontWeight: '800' },
  optMuted: { color: C.muted, fontWeight: '700' },
  optRight: { minWidth: 54, textAlign: 'right', color: C.muted, fontWeight: '900' },

  segmentWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    borderColor: 'rgba(37, 99, 235, 0.28)',
  },
  segmentText: { color: C.text, fontWeight: '900' },
  segmentTextActive: { color: C.primary },
  segmentSub: { color: C.muted, fontSize: 11, marginTop: 2, fontWeight: '800' },
  segmentSubActive: { color: 'rgba(37, 99, 235, 0.85)' },

  primaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.28)',
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    alignItems: 'center',
  },
  primaryBtnText: { color: C.primary, fontWeight: '900' },

  recRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recChevron: { color: C.faint, fontSize: 14, fontWeight: '900' },

  recItem: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  recItemExpanded: {
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    borderColor: 'rgba(37, 99, 235, 0.22)',
  },
  recTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  recHint: { color: C.muted, marginTop: 6, fontSize: 12, lineHeight: 16 },
  recDetails: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  recDetailText: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },

  showMoreBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  showMoreText: { color: C.text, fontWeight: '900', fontSize: 12 },

  recTitle: { color: C.text, fontWeight: '900' },
  recScore: { color: C.text, fontWeight: '900', minWidth: 60, textAlign: 'right' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: '80%',
  },
  modalTitle: { color: C.text, fontWeight: '900', marginBottom: 12, fontSize: 16 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  modalItemText: { color: C.text, fontWeight: '800' },
  modalEmpty: { color: C.muted, paddingVertical: 12, fontSize: 12 },
  modalCloseBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  modalCloseText: { color: C.text, fontWeight: '900' },
});

export default styles;
// src/screens/GrowthPredictionScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  predictGrowthStage,
  fetchGrowthHistory,
} from '../services/growthApi';

import { BACKEND_URL } from '../services/api';


const BACKEND_BASE_URL = BACKEND_URL;


export default function GrowthPredictionScreen() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [bagId, setBagId] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(false);
  const [backendOk, setBackendOk] = useState(false);
  const [backendMessage, setBackendMessage] = useState('Not checked yet');
  const [result, setResult] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);

  const confidencePercent = useMemo(() => {
    if (result?.confidence === undefined || result?.confidence === null) {
      return null;
    }
    return (Number(result.confidence) * 100).toFixed(2);
  }, [result]);

  const sortedHistory = useMemo(() => {
    return [...historyItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [historyItems]);

  const checkBackend = useCallback(async () => {
    try {
      setCheckingBackend(true);

      const response = await fetch(`${BACKEND_BASE_URL}/ping`);
      const data = await response.json();

      if (response.ok) {
        setBackendOk(true);
        setBackendMessage(data?.message || 'Backend is working');
      } else {
        setBackendOk(false);
        setBackendMessage('Backend responded with an error');
      }
    } catch (error) {
      setBackendOk(false);
      setBackendMessage('Cannot connect to backend');
    } finally {
      setCheckingBackend(false);
    }
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow gallery access.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!pickerResult.canceled) {
        setSelectedAsset(pickerResult.assets[0]);
        setResult(null);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow camera access.');
        return;
      }

      const cameraResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!cameraResult.canceled) {
        setSelectedAsset(cameraResult.assets[0]);
        setResult(null);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const clearImage = () => {
    setSelectedAsset(null);
    setResult(null);
  };

  const loadHistory = async () => {
    if (!bagId.trim()) {
      Alert.alert('Bag ID required', 'Please enter a bag ID first.');
      return;
    }

    try {
      setHistoryLoading(true);
      const data = await fetchGrowthHistory(bagId.trim());
      setHistoryItems(Array.isArray(data.history) ? data.history : []);
    } catch (error) {
      Alert.alert('History load failed', error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!bagId.trim()) {
      Alert.alert('Bag ID required', 'Please enter a bag ID first.');
      return;
    }

    if (!selectedAsset) {
      Alert.alert('No image selected', 'Please select an image first.');
      return;
    }

    try {
      setLoading(true);
      const response = await predictGrowthStage(selectedAsset, bagId.trim());
      setResult(response);

      const historyData = await fetchGrowthHistory(bagId.trim());
      setHistoryItems(Array.isArray(historyData.history) ? historyData.history : []);
    } catch (error) {
      Alert.alert('Prediction failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleString();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageTitleWrap}>
        <Text style={styles.pageTitle}>Growth Stage Prediction</Text>
        <Text style={styles.pageSubtitle}>
          Primordia • Fruitbody • Harvest Readiness
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Backend Status</Text>

          <TouchableOpacity
            style={styles.smallOutlineButton}
            onPress={checkBackend}
            disabled={checkingBackend}
          >
            <Text style={styles.smallOutlineButtonText}>
              {checkingBackend ? 'Checking...' : 'Recheck'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.statusText,
            backendOk ? styles.statusOk : styles.statusError,
          ]}
        >
          {backendOk ? 'Connected (Backend is working)' : 'Disconnected'}
        </Text>

        <Text style={styles.statusSubText}>{backendMessage}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bag ID</Text>

        <TextInput
          value={bagId}
          onChangeText={setBagId}
          placeholder="Enter bag ID (e.g. BAG_001)"
          placeholderTextColor="#98a2b3"
          style={styles.input}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={loadHistory}
          disabled={historyLoading}
        >
          <Text style={styles.primaryButtonText}>
            {historyLoading ? 'Loading History...' : 'Load Bag History'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Image</Text>

        <View style={styles.buttonRow}>
          <View style={styles.buttonHalf}>
            <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
              <Text style={styles.primaryButtonText}>Pick from Gallery</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonHalf}>
            <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
              <Text style={styles.primaryButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedAsset ? (
          <>
            <Image
              source={{ uri: selectedAsset.uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />

            <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
              <Text style={styles.primaryButtonText}>Clear</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyPreviewText}>No image selected</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prediction</Text>

        <TouchableOpacity
          style={styles.predictButton}
          onPress={handlePredict}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Predicting...' : 'Predict Growth Stage'}
          </Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" style={styles.loader} />}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultHeading}>Result</Text>

            <Text style={styles.resultLine}>
              <Text style={styles.resultLabel}>Current Stage: </Text>
              {result.growth_stage}
            </Text>

            <Text style={styles.resultLine}>
              <Text style={styles.resultLabel}>Confidence: </Text>
              {confidencePercent}%
            </Text>

            <Text style={styles.resultLine}>
              <Text style={styles.resultLabel}>Next Stage: </Text>
              {result.next_stage}
            </Text>

            <Text style={styles.resultLine}>
              <Text style={styles.resultLabel}>Estimated Time: </Text>
              {result.estimated_days_to_next_stage || 'Unknown'}
            </Text>

            {result.warning ? (
              <Text style={styles.warningText}>
                Warning: {result.warning}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Growth History</Text>

        {historyLoading ? (
          <ActivityIndicator size="small" style={styles.loader} />
        ) : sortedHistory.length === 0 ? (
          <View style={styles.emptyHistoryBox}>
            <Text style={styles.emptyHistoryText}>
              No history available for this bag yet.
            </Text>
          </View>
        ) : (
          sortedHistory.map((item, index) => (
            <View key={`${item.timestamp}-${index}`} style={styles.historyItem}>
              <Text style={styles.historyStage}>{item.growth_stage}</Text>

              <Text style={styles.historyLine}>
                <Text style={styles.resultLabel}>Confidence: </Text>
                {(Number(item.confidence) * 100).toFixed(2)}%
              </Text>

              <Text style={styles.historyLine}>
                <Text style={styles.resultLabel}>Next Stage: </Text>
                {item.next_stage}
              </Text>

              <Text style={styles.historyLine}>
                <Text style={styles.resultLabel}>Estimated Time: </Text>
                {item.estimated_days_to_next_stage || 'Unknown'}
              </Text>

              {item.warning ? (
                <Text style={styles.warningText}>Warning: {item.warning}</Text>
              ) : null}

              <Text style={styles.historyTimestamp}>
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const COLORS = {
  navy: '#071632',
  blue: '#2f66e8',
  green: '#26a844',
  greenText: '#188235',
  redText: '#c62828',
  border: '#e4e8ef',
  cardBg: '#ffffff',
  resultBg: '#eceff3',
  muted: '#8a94a6',
  text: '#101828',
  white: '#ffffff',
  warning: '#d97706',
  historyBg: '#f8fafc',
};

const styles = StyleSheet.create({
  screen: {
    padding: 14,
    paddingBottom: 30,
    backgroundColor: '#f5f7fb',
    flexGrow: 1,
  },
  pageTitleWrap: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  smallOutlineButton: {
    borderWidth: 1,
    borderColor: COLORS.blue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smallOutlineButtonText: {
    color: COLORS.blue,
    fontWeight: '600',
    fontSize: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusOk: {
    color: COLORS.greenText,
  },
  statusError: {
    color: COLORS.redText,
  },
  statusSubText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    marginBottom: 12,
    color: COLORS.text,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    marginLeft: 5,
  },
  secondaryButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  emptyPreview: {
    height: 220,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafbfc',
  },
  emptyPreviewText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  loader: {
    marginTop: 14,
  },
  resultBox: {
    marginTop: 14,
    backgroundColor: COLORS.resultBg,
    borderRadius: 10,
    padding: 12,
  },
  resultHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  resultLine: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 6,
  },
  resultLabel: {
    fontWeight: '700',
  },
  warningText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.warning,
  },
  emptyHistoryBox: {
    backgroundColor: COLORS.historyBg,
    borderRadius: 10,
    padding: 12,
  },
  emptyHistoryText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  historyItem: {
    backgroundColor: COLORS.historyBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  historyStage: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  historyLine: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
  },
  historyTimestamp: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.muted,
  },
});
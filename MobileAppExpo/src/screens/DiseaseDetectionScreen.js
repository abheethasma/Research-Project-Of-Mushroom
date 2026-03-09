// src/screens/DiseaseDetectionScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
  pingBackend,
  predictDiseaseFromImage,
  getDiseaseHistory,
} from '../services/api';

const DiseaseDetectionScreen = () => {
  const [imageUri, setImageUri] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const [loading, setLoading] = useState(false); // prediction loading
  const [historyLoading, setHistoryLoading] = useState(false); // history loading

  const [backendStatus, setBackendStatus] = useState('Checking...');

  const [bagId, setBagId] = useState('Bag-1');
  const [history, setHistory] = useState([]);
  const [trendMessage, setTrendMessage] = useState(null);

  const getImagesMediaType = () => {
    if (ImagePicker.MediaType) return ImagePicker.MediaType.Images;
    return ImagePicker.MediaTypeOptions.Images;
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission needed',
            'We need access to your gallery to pick mushroom images.'
          );
        }
      } catch (e) {
        console.log('Permission error (gallery):', e);
      }
    })();

    (async () => {
      try {
        const res = await pingBackend();
        setBackendStatus(res ? 'Online' : 'Offline');
      } catch {
        setBackendStatus('Offline');
      }
    })();
  }, []);

  const computeTrendFromHistory = (hist) => {
    if (!hist || hist.length < 2) {
      return 'Not enough previous records to estimate disease spread yet.';
    }

    const prev = hist[hist.length - 2];
    const curr = hist[hist.length - 1];

    const prevScore = prev.severity_score ?? 0;
    const currScore = curr.severity_score ?? 0;

    if (currScore > prevScore) {
      return 'Compared to the last check, the disease seems to be spreading / getting worse.';
    }
    if (currScore < prevScore) {
      return 'Compared to the last check, the disease severity has reduced. Treatment seems to be helping.';
    }
    return 'Disease severity is similar to the last check. Keep monitoring and following the treatment.';
  };

  const loadHistory = async (id) => {
    const cleanId = (id || '').trim();
    if (!cleanId) {
      Alert.alert('Bag ID required', 'Please enter a Bag / Batch ID.');
      return;
    }

    try {
      setHistoryLoading(true);
      const data = await getDiseaseHistory(cleanId);
      setHistory(data);

      const trend = computeTrendFromHistory(data);
      setTrendMessage(trend);

      if (!data || data.length === 0) {
        Alert.alert('No records', `No history found for "${cleanId}".`);
      }
    } catch (e) {
      console.log('getDiseaseHistory error:', e);
      Alert.alert('Error', e.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const clearHistoryDisplay = () => {
    setHistory([]);
    setTrendMessage(null);
  };

  const pickImage = async () => {
    try {
      setPrediction(null);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: getImagesMediaType(),
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('pickImage error:', e);
      Alert.alert('Error', e.message || 'Failed to open image picker (gallery).');
    }
  };

  const takePhoto = async () => {
    try {
      setPrediction(null);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'We need access to your camera to capture mushroom images.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: getImagesMediaType(),
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('takePhoto error:', e);
      Alert.alert('Error', e.message || 'Failed to open camera.');
    }
  };

  const handlePredict = async () => {
    if (!imageUri) {
      Alert.alert('No image', 'Please choose or capture a mushroom image first.');
      return;
    }

    try {
      setLoading(true);
      setPrediction(null);

      const data = await predictDiseaseFromImage(imageUri, bagId);
      setPrediction(data);

      // refresh history automatically after prediction
      await loadHistory(bagId);
    } catch (error) {
      console.log('predictDisease error:', error);
      Alert.alert('Error', error.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImageUri(null);
    setPrediction(null);
    setLoading(false);
  };

  const statusColor =
    backendStatus === 'Online' ? styles.statusOnline : styles.statusOffline;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mushroom Disease Detection</Text>

        <Text style={styles.statusText}>
          Backend status: <Text style={statusColor}>{backendStatus}</Text>
        </Text>

        {/* Bag / Batch ID section with View History + Clear History */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Bag / Batch ID</Text>
          <Text style={styles.sectionSubtitle}>
            Enter the bag ID and tap “View History” to see previous records.
          </Text>

          <View style={styles.bagRow}>
            <TextInput
              style={styles.input}
              value={bagId}
              onChangeText={setBagId}
              placeholder="e.g. Room1-Bag07"
            />

            <View style={styles.bagActions}>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => loadHistory(bagId)}
                disabled={historyLoading}
              >
                <Text style={styles.historyButtonText}>
                  {historyLoading ? 'Loading...' : 'View History'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearHistoryButton}
                onPress={clearHistoryDisplay}
                disabled={historyLoading}
              >
                <Text style={styles.clearHistoryButtonText}>Clear History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.imageBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Text style={styles.placeholder}>No image selected</Text>
          )}
        </View>

        {/* Section 1: Select Image */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Select Image</Text>
          <Text style={styles.sectionSubtitle}>
            Choose an existing photo or capture a new image.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
              <Text style={styles.buttonText}>Choose Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
              <Text style={styles.buttonText}>Capture Image</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Disease Prediction */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Disease Prediction</Text>
          <Text style={styles.sectionSubtitle}>
            Click predict to analyze the mushroom disease.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePredict}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Predicting...' : 'Predict Disease'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

        {/* Prediction Output */}
        {prediction &&
          (prediction.label === 'invalid_image' ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Prediction</Text>
              <Text style={styles.resultText}>Invalid Image</Text>
              <Text style={styles.resultConf}>
                Confidence: {(prediction.confidence * 100).toFixed(1)}%
              </Text>
              {prediction.treatment ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.resultLabel}>Treatment Recommendation</Text>
                  <Text style={styles.resultHint}>{prediction.treatment}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Prediction</Text>
              <Text style={styles.resultText}>
                {prediction.label ? prediction.label.replace(/_/g, ' ') : ''}
              </Text>

              <Text style={styles.resultConf}>
                Confidence: {(prediction.confidence * 100).toFixed(1)}%
              </Text>

              {prediction.severity && prediction.severity !== 'none' && (
                <Text style={styles.resultConf}>
                  Severity:{' '}
                  {prediction.severity.charAt(0).toUpperCase() +
                    prediction.severity.slice(1)}
                </Text>
              )}

              {prediction.treatment && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.resultLabel}>Treatment Recommendation</Text>
                  <Text style={styles.resultHint}>{prediction.treatment}</Text>
                </View>
              )}
            </View>
          ))}

        {/* History / time series */}
        {history && history.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={styles.sectionTitle}>Disease History</Text>
            <Text style={styles.sectionSubtitle}>
              Recent predictions for bag: {bagId}
            </Text>

            {history.slice(-5).map((item, idx) => {
              let dateStr = item.timestamp;
              try {
                const d = new Date(item.timestamp);
                if (!isNaN(d.getTime())) dateStr = d.toLocaleString();
              } catch {
                // keep raw string
              }

              return (
                <View key={`${item.timestamp}-${idx}`} style={styles.historyItem}>
                  <Text style={styles.historyLine}>{dateStr}</Text>
                  <Text style={styles.historyLine}>
                    {item.label.replace(/_/g, ' ')} ({item.severity}) –{' '}
                    {(item.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Trend analysis */}
        {trendMessage && (
          <View style={styles.trendBox}>
            <Text style={styles.trendTitle}>Trend</Text>
            <Text style={styles.trendText}>{trendMessage}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#e5e7eb' },
  container: { padding: 16, paddingBottom: 32 },
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  statusText: { marginBottom: 12, fontSize: 14 },
  statusOnline: { color: '#16a34a', fontWeight: '600' },
  statusOffline: { color: '#dc2626', fontWeight: '600' },

  imageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { color: '#9ca3af' },

  sectionBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 10 },

  bagRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  bagActions: {
    marginLeft: 8,
    justifyContent: 'space-between',
  },
  historyButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  historyButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },

  clearHistoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearHistoryButtonText: { color: '#374151', fontWeight: '600', fontSize: 12 },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  primaryButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButton: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  clearButtonText: { color: '#4b5563', fontWeight: '600', fontSize: 14 },

  resultBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  resultLabel: { fontWeight: '600', marginBottom: 4, fontSize: 14 },
  resultText: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  resultConf: { marginTop: 4, fontSize: 14 },
  resultHint: { marginTop: 4, fontSize: 13, color: '#6b7280' },

  historyBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
  },
  historyItem: {
    marginTop: 6,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c7d2fe',
  },
  historyLine: { fontSize: 12, color: '#4b5563' },

  trendBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#67e8f9',
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#0f766e',
  },
  trendText: { fontSize: 13, color: '#115e59' },
});

export default DiseaseDetectionScreen;
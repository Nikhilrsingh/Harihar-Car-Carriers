import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { WebView } from 'react-native-webview';

// Import Site Engine & Safe Fallbacks
import * as SiteEngineModule from '../utils/siteEngine';
import { generateLoadingHtml } from '../templates/loadingTemplate';

// Safely extract siteEngine object or module exports
const siteEngine = SiteEngineModule?.siteEngine || SiteEngineModule || {};

// Master Lists with Fallbacks so app NEVER crashes
const CAR_NAMES = siteEngine?.CAR_NAMES || SiteEngineModule?.CAR_NAMES || [
  'MARUTI SWIFT', 'MARUTI BALENO', 'MARUTI BREZZA', 'MARUTI WAGON R', 'MARUTI ALTO',
  'HYUNDAI CRETA', 'HYUNDAI VENUE', 'HYUNDAI I20', 'TATA NEXON', 'TATA HARRIER',
  'MAHINDRA THAR', 'MAHINDRA SCORPIO', 'TOYOTA FORTUNER', 'HONDA CITY'
];

const CITY_NAMES = siteEngine?.CITY_NAMES || SiteEngineModule?.CITY_NAMES || [
  'NAGPUR', 'MUMBAI', 'PUNE', 'DELHI', 'BENGALURU', 'HYDERABAD', 'KOLKATA',
  'AHMEDABAD', 'JAIPUR', 'INDORE', 'RAIPUR', 'CHANDIGARH'
];

const PACKER_NAMES = siteEngine?.PACKER_NAMES || SiteEngineModule?.PACKER_NAMES || [
  'HARIHAR CARGO', 'EXPRESS CAR PACKERS', 'STANDARD PACKERS'
];

const getFormattedTodayDate = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default function LoadingFormScreen({ route, navigation }) {
  const existingRecords = route.params?.existingRecords || [];
  const editItem = route.params?.editItem || null;

  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Import Pickup States
  const [showImportModal, setShowImportModal] = useState(false);
  const [fetchingPickups, setFetchingPickups] = useState(false);
  const [pickupRecords, setPickupRecords] = useState([]);

  // Active Field Suggestion State
  const [activeSuggestionField, setActiveSuggestionField] = useState(null);
  const [suggestionList, setSuggestionList] = useState([]);

  // Form Fields
  const [loadingNo] = useState(
    editItem ? editItem.docId || editItem.loadingNo : `HCC-LOADING-${Date.now().toString().slice(-4)}`
  );
  const [loadingDate, setLoadingDate] = useState(
    editItem ? editItem.loadingDate || editItem.date : getFormattedTodayDate()
  );
  const [truckNo, setTruckNo] = useState(editItem ? editItem.truckNo || editItem.trailerNo || '' : '');
  const [transporter, setTransporter] = useState(editItem ? editItem.transporter || '' : '');
  const [driverNo, setDriverNo] = useState(editItem ? editItem.driverMobile || editItem.driverNo || '' : '');

  const [vehicles, setVehicles] = useState(() => {
    if (editItem && Array.isArray(editItem.cars) && editItem.cars.length > 0) return editItem.cars;
    return [
      {
        carName: '',
        carNumber: '',
        partyName: '',
        partyNumber: '',
        fromLocation: 'NAGPUR',
        toLocation: '',
        pincodeState: '',
        carValue: '',
        packerName: '',
        pickupId: '',
      },
    ];
  });

  // Crash-Safe Auto Suggestion Handler
  const handleInputChange = (index, field, value) => {
    updateVehicleField(index, field, value);

    let masterList = [];
    if (field === 'carName') masterList = CAR_NAMES;
    else if (field === 'fromLocation' || field === 'toLocation') masterList = CITY_NAMES;
    else if (field === 'packerName') masterList = PACKER_NAMES;

    if (value && value.trim().length > 0 && Array.isArray(masterList)) {
      const filtered = masterList.filter((item) =>
        item && String(item).toLowerCase().includes(value.toLowerCase())
      );
      setSuggestionList(filtered);
      setActiveSuggestionField({ index, field });
    } else {
      setActiveSuggestionField(null);
    }
  };

  const selectSuggestion = (index, field, selectedValue) => {
    updateVehicleField(index, field, selectedValue);
    setActiveSuggestionField(null);
  };

  // Safe Fetch Pickups for Import
  const handleOpenImportModal = async () => {
    setShowImportModal(true);
    setFetchingPickups(true);
    try {
      if (typeof siteEngine?.fetchSheetRecords === 'function') {
        const records = await siteEngine.fetchSheetRecords('Pickup');
        setPickupRecords(Array.isArray(records) ? records : []);
      } else {
        setPickupRecords([]);
      }
    } catch (err) {
      console.log('Fetch Pickup Error:', err);
      setPickupRecords([]);
    } finally {
      setFetchingPickups(false);
    }
  };

  const handleSelectPickupToImport = (pickupItem) => {
    const importedVehicle = {
      carName: pickupItem.carName || pickupItem.car || '',
      carNumber: pickupItem.carNumber || pickupItem.carNo || '',
      partyName: pickupItem.partyName || pickupItem.party || '',
      partyNumber: pickupItem.partyNumber || pickupItem.mobile || '',
      fromLocation: pickupItem.fromLocation || 'NAGPUR',
      toLocation: pickupItem.toLocation || '',
      pincodeState: pickupItem.pincode || pickupItem.pincodeState || '',
      carValue: pickupItem.carValue ? String(pickupItem.carValue) : '',
      packerName: pickupItem.packerName || '',
      pickupId: pickupItem.pickupId || pickupItem.docId || '',
    };

    if (
      vehicles.length === 1 &&
      !vehicles[0].carName.trim() &&
      !vehicles[0].carNumber.trim()
    ) {
      setVehicles([importedVehicle]);
    } else {
      setVehicles([...vehicles, importedVehicle]);
    }

    setShowImportModal(false);
  };

  const updateVehicleField = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  const handleAddVehicle = () => {
    setVehicles([
      ...vehicles,
      {
        carName: '',
        carNumber: '',
        partyName: '',
        partyNumber: '',
        fromLocation: 'NAGPUR',
        toLocation: '',
        pincodeState: '',
        carValue: '',
        packerName: '',
        pickupId: '',
      },
    ]);
  };

  const handleRemoveVehicle = (index) => {
    if (vehicles.length === 1) return;
    setVehicles(vehicles.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!truckNo.trim()) {
      Alert.alert('Notice', 'Please enter Trailer Number.');
      return;
    }

    setLoading(true);
    const payload = {
      docId: loadingNo,
      loadingNo,
      date: loadingDate,
      loadingDate,
      truckNo,
      trailerNo: truckNo,
      transporter,
      driverNo,
      driverMobile: driverNo,
      cars: vehicles,
    };

    const updatedList = editItem
      ? existingRecords.map((r) => (r.docId === loadingNo || r.loadingNo === loadingNo ? payload : r))
      : [payload, ...existingRecords];

    try {
      if (typeof siteEngine?.saveSheetRecords === 'function') {
        await siteEngine.saveSheetRecords('Loading', updatedList);
      }
      Alert.alert('Saved', 'Loading record saved successfully!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save loading record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerBar}>
        <Text style={styles.formTitle}>Trailer Loading Form</Text>
        <TouchableOpacity style={styles.importBtn} onPress={handleOpenImportModal}>
          <Text style={styles.importBtnText}>📥 IMPORT PICKUP</Text>
        </TouchableOpacity>
      </View>

      {/* Trailer Information */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Trailer Information</Text>

        <Text style={styles.label}>LOADING DATE:</Text>
        <TextInput
          style={styles.input}
          value={loadingDate}
          onChangeText={setLoadingDate}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#64748b"
        />

        <View style={[styles.row, { marginTop: 8 }]}>
          <View style={styles.flex1}>
            <Text style={styles.label}>TRAILER NO:</Text>
            <TextInput
              style={styles.input}
              value={truckNo}
              onChangeText={setTruckNo}
              placeholder="NL01AB3252"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
            />
          </View>
          <View style={{ width: 8 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>TRANSPORTER:</Text>
            <TextInput
              style={styles.input}
              value={transporter}
              onChangeText={setTransporter}
              placeholder="TRANSPORTER NAME"
              placeholderTextColor="#64748b"
            />
          </View>
          <View style={{ width: 8 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>DRIVER NO.:</Text>
            <TextInput
              style={styles.input}
              value={driverNo}
              onChangeText={setDriverNo}
              placeholder="MOBILE NO."
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>

      {/* Loaded Cars Header */}
      <View style={styles.vehiclesHeaderRow}>
        <Text style={styles.sectionTitle}>LOADED CARS ({vehicles.length})</Text>
        <TouchableOpacity style={styles.addVehicleBtn} onPress={handleAddVehicle}>
          <Text style={styles.addVehicleBtnText}>+ ADD CAR</Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle Cards */}
      {vehicles.map((v, idx) => (
        <View key={idx} style={styles.vehicleCard}>
          <View style={styles.vehicleCardHeader}>
            <Text style={styles.vehicleCardTitle}>
              🚘 CAR #{idx + 1} {v.pickupId ? `(Pickup ID: ${v.pickupId})` : ''}
            </Text>
            {vehicles.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveVehicle(idx)}>
                <Text style={styles.removeText}>🗑️ Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Car Name Field + Suggestions */}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>CAR NAME:</Text>
              <TextInput
                style={styles.input}
                value={v.carName}
                onChangeText={(txt) => handleInputChange(idx, 'carName', txt)}
                placeholder="CAR NAME"
                placeholderTextColor="#64748b"
              />
              {activeSuggestionField?.index === idx && activeSuggestionField?.field === 'carName' && suggestionList.length > 0 && (
                <View style={styles.suggestionBox}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 110 }}>
                    {suggestionList.map((sug, sIdx) => (
                      <TouchableOpacity
                        key={sIdx}
                        style={styles.suggestionItem}
                        onPress={() => selectSuggestion(idx, 'carName', sug)}
                      >
                        <Text style={styles.suggestionText}>{sug}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={{ width: 8 }} />
            <View style={styles.flex1}>
              <Text style={styles.label}>CAR NUMBER:</Text>
              <TextInput
                style={styles.input}
                value={v.carNumber}
                onChangeText={(txt) => updateVehicleField(idx, 'carNumber', txt)}
                placeholder="CAR NO."
                placeholderTextColor="#64748b"
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Party Details */}
          <View style={[styles.row, { marginTop: 8 }]}>
            <View style={styles.flex1}>
              <Text style={styles.label}>PARTY NAME:</Text>
              <TextInput
                style={styles.input}
                value={v.partyName}
                onChangeText={(txt) => updateVehicleField(idx, 'partyName', txt)}
                placeholder="PARTY NAME"
                placeholderTextColor="#64748b"
              />
            </View>
            <View style={{ width: 8 }} />
            <View style={styles.flex1}>
              <Text style={styles.label}>PARTY MOBILE:</Text>
              <TextInput
                style={styles.input}
                value={v.partyNumber}
                onChangeText={(txt) => updateVehicleField(idx, 'partyNumber', txt)}
                placeholder="PARTY MOBILE"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Route Fields + Suggestions */}
          <View style={[styles.row, { marginTop: 8 }]}>
            <View style={styles.flex1}>
              <Text style={styles.label}>FROM LOCATION:</Text>
              <TextInput
                style={styles.input}
                value={v.fromLocation}
                onChangeText={(txt) => handleInputChange(idx, 'fromLocation', txt)}
                placeholder="NAGPUR"
                placeholderTextColor="#64748b"
              />
              {activeSuggestionField?.index === idx && activeSuggestionField?.field === 'fromLocation' && suggestionList.length > 0 && (
                <View style={styles.suggestionBox}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 110 }}>
                    {suggestionList.map((sug, sIdx) => (
                      <TouchableOpacity
                        key={sIdx}
                        style={styles.suggestionItem}
                        onPress={() => selectSuggestion(idx, 'fromLocation', sug)}
                      >
                        <Text style={styles.suggestionText}>{sug}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={{ width: 8 }} />
            <View style={styles.flex1}>
              <Text style={styles.label}>TO LOCATION:</Text>
              <TextInput
                style={styles.input}
                value={v.toLocation}
                onChangeText={(txt) => handleInputChange(idx, 'toLocation', txt)}
                placeholder="TO LOCATION"
                placeholderTextColor="#64748b"
              />
              {activeSuggestionField?.index === idx && activeSuggestionField?.field === 'toLocation' && suggestionList.length > 0 && (
                <View style={styles.suggestionBox}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 110 }}>
                    {suggestionList.map((sug, sIdx) => (
                      <TouchableOpacity
                        key={sIdx}
                        style={styles.suggestionItem}
                        onPress={() => selectSuggestion(idx, 'toLocation', sug)}
                      >
                        <Text style={styles.suggestionText}>{sug}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Value & Packer */}
          <View style={[styles.row, { marginTop: 8 }]}>
            <View style={styles.flex1}>
              <Text style={styles.label}>PINCODE / STATE:</Text>
              <TextInput
                style={styles.input}
                value={v.pincodeState}
                onChangeText={(txt) => updateVehicleField(idx, 'pincodeState', txt)}
                placeholder="PINCODE (STATE)"
                placeholderTextColor="#64748b"
              />
            </View>
            <View style={{ width: 8 }} />
            <View style={styles.flex1}>
              <Text style={styles.label}>CAR VALUE (₹):</Text>
              <TextInput
                style={styles.input}
                value={v.carValue}
                onChangeText={(txt) => updateVehicleField(idx, 'carValue', txt)}
                placeholder="CAR VALUE (₹)"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={styles.label}>PACKER NAME:</Text>
            <TextInput
              style={styles.input}
              value={v.packerName}
              onChangeText={(txt) => handleInputChange(idx, 'packerName', txt)}
              placeholder="PACKER NAME"
              placeholderTextColor="#64748b"
            />
            {activeSuggestionField?.index === idx && activeSuggestionField?.field === 'packerName' && suggestionList.length > 0 && (
              <View style={styles.suggestionBox}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 110 }}>
                  {suggestionList.map((sug, sIdx) => (
                    <TouchableOpacity
                      key={sIdx}
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(idx, 'packerName', sug)}
                    >
                      <Text style={styles.suggestionText}>{sug}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Actions */}
      <TouchableOpacity
        style={styles.previewBtn}
        onPress={() => {
          setShowPreviewModal(true);
          generateLoadingHtml({ docId: loadingNo, loadingDate, truckNo, transporter, driverNo, cars: vehicles }).then(setPreviewHtml);
        }}
      >
        <Text style={styles.previewBtnText}>👁️ LIVE PREVIEW</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 SAVE LOADING</Text>}
      </TouchableOpacity>

      {/* Preview Modal */}
      <Modal visible={showPreviewModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#0f172a', paddingTop: 40 }}>
          <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 12 }} onPress={() => setShowPreviewModal(false)}>
            <Text style={{ color: '#ffffff', fontWeight: '800' }}>✕ Close</Text>
          </TouchableOpacity>
          <WebView source={{ html: previewHtml }} style={{ flex: 1 }} />
        </View>
      </Modal>

      {/* Import Pickup Modal */}
      <Modal visible={showImportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.importModalContent}>
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>Import From Pickup</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Text style={{ color: '#ef4444', fontWeight: '900' }}>✕ CLOSE</Text>
              </TouchableOpacity>
            </View>

            {fetchingPickups ? (
              <ActivityIndicator color="#dc2626" style={{ marginVertical: 30 }} />
            ) : pickupRecords.length === 0 ? (
              <Text style={{ color: '#94a3b8', textAlign: 'center', marginVertical: 20 }}>
                No Pickups found in sheet database.
              </Text>
            ) : (
              <FlatList
                data={pickupRecords}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.pickupCard} onPress={() => handleSelectPickupToImport(item)}>
                    <Text style={styles.pickupCardTitle}>
                      🚘 {item.carName || item.car || 'Unknown Car'} ({item.carNumber || item.carNo || 'N/A'})
                    </Text>
                    <Text style={styles.pickupCardSub}>
                      Party: {item.partyName || item.party || '-'} ({item.partyNumber || item.mobile || '-'})
                    </Text>
                    <Text style={styles.pickupCardSub}>
                      Route: {item.fromLocation || 'NAGPUR'} → {item.toLocation || '-'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  contentContainer: { padding: 16, paddingBottom: 60 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  formTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  importBtn: { backgroundColor: '#2563eb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  importBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  card: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  sectionHeader: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  label: { color: '#94a3b8', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  input: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suggestionBox: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 6,
    marginTop: 4,
    zIndex: 999,
  },
  suggestionItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  suggestionText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },
  vehiclesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  addVehicleBtn: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addVehicleBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  vehicleCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  vehicleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  vehicleCardTitle: { color: '#dc2626', fontWeight: '800', fontSize: 13 },
  removeText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },
  previewBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#dc2626', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  previewBtnText: { color: '#dc2626', fontWeight: '800', fontSize: 12 },
  saveBtn: { backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
  importModalContent: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, maxHeight: '80%' },
  importModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  importModalTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  pickupCard: { backgroundColor: '#0f172a', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  pickupCardTitle: { color: '#38bdf8', fontWeight: '800', fontSize: 12 },
  pickupCardSub: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
});
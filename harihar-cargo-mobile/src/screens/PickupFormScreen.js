import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { cargoService } from '../services/cargoService';
import { generatePickupHtml } from '../templates/pickupTemplate';
import {
  CITY_DATA,
  MASTER_CARS,
  MASTER_CITIES,
  MASTER_PACKERS,
  MASTER_DRIVERS,
  fetchPincodeDetails,
  recordMRUItem,
} from '../utils/siteEngine';
import { PRESET_CUSTOMERS } from '../data/suggestionData';

const getFormattedTodayDate = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export default function PickupFormScreen({ route, navigation }) {
  const existingRecords = route.params?.existingRecords || [];
  const editItem = route.params?.editItem || null;

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [selectedVehicleIndices, setSelectedVehicleIndices] = useState([]);

  const generateNewPickupId = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const seq = String(existingRecords.length + 1).padStart(2, '0');
    return `HCC-PickUp-${dd}${mm}${yy}-${seq}`;
  };

  const [pickupId] = useState(
    editItem ? editItem.pickupId || editItem.pickupNo : generateNewPickupId()
  );
  const [pickupDate, setPickupDate] = useState(
    editItem ? editItem.pickupDate || editItem.date : getFormattedTodayDate()
  );
  const [whoPicked, setWhoPicked] = useState(editItem ? editItem.whoPicked || '' : '');

  const [cars, setCars] = useState(() => {
    if (editItem && Array.isArray(editItem.cars) && editItem.cars.length > 0) {
      return editItem.cars.map((c) => ({
        carName: c.carName || '',
        carNumber: c.carNumber || c.carNo || '',
        partyName: c.partyName || '',
        partyNumber: c.partyNumber || c.partyNo || '',
        fromLocation: c.fromLocation || 'NAGPUR',
        toLocation: c.toLocation || '',
        pincode: c.pincode || '',
        carValue: c.carValue || c.value || '',
        packerName: c.packerName || '',
      }));
    }
    return [
      {
        carName: editItem?.carName || '',
        carNumber: editItem?.carNumber || editItem?.carNo || '',
        partyName: editItem?.partyName || '',
        partyNumber: editItem?.partyNumber || editItem?.partyNo || '',
        fromLocation: editItem?.fromLocation || 'NAGPUR',
        toLocation: editItem?.toLocation || '',
        pincode: editItem?.pincode || '',
        carValue: editItem?.carValue || editItem?.value || '',
        packerName: editItem?.packerName || '',
      },
    ];
  });

  useEffect(() => {
    setSelectedVehicleIndices(cars.map((_, i) => i));
  }, [cars]);

  useEffect(() => {
    if (showPreviewModal) {
      setPreviewHtml('');
      generatePickupHtml(getFullBatchPayload()).then((html) => setPreviewHtml(html));
    }
  }, [showPreviewModal]);

  const [activeCarIdx, setActiveCarIdx] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const updateCarField = (index, field, value) => {
    const updated = [...cars];
    updated[index][field] = value;
    setCars(updated);
  };

  const handlePincodeChange = async (text, carIndex) => {
    updateCarField(carIndex, 'pincode', text);
    if (text.length === 6) {
      const details = await fetchPincodeDetails(text);
      if (details) {
        updateCarField(carIndex, 'toLocation', `${details.city}, ${details.state}`);
      }
    }
  };

  const handleInputChange = (text, carIndex, field, searchType) => {
    if (carIndex !== null) {
      updateCarField(carIndex, field, text);
    } else if (field === 'whoPicked') {
      setWhoPicked(text);
    }

    const query = text.trim().toLowerCase();

    if (query.length > 0) {
      setActiveCarIdx(carIndex);
      setActiveField(field);

      const matches = [];

      const filterItem = (itemString, fullObj) => {
        if (!itemString) return;
        const lower = itemString.toLowerCase();
        if (lower.startsWith(query) || lower.includes(` ${query}`)) {
          if (!matches.some((m) => m.value.toLowerCase() === lower)) {
            matches.push({ label: itemString, value: itemString, fullData: fullObj });
          }
        }
      };

      if (searchType === 'carName') {
        MASTER_CARS.forEach((c) => filterItem(c, { carName: c }));
      } else if (searchType === 'toLocation') {
        MASTER_CITIES.forEach((city) => {
          if (city.toLowerCase().startsWith(query)) {
            const info = CITY_DATA[city];
            const formatted = `${city.toUpperCase()}, ${info.state.toUpperCase()}`;
            matches.push({
              label: formatted,
              value: formatted,
              fullData: { toLocation: formatted, pincode: info.pincode },
            });
          }
        });
      } else if (searchType === 'partyName') {
        PRESET_CUSTOMERS.forEach((c) => filterItem(c.partyName, c));
      } else if (searchType === 'whoPicked') {
        MASTER_DRIVERS.forEach((d) => filterItem(d, { whoPicked: d }));
      } else if (searchType === 'packerName') {
        MASTER_PACKERS.forEach((p) => filterItem(p, { packerName: p }));
      }

      existingRecords.forEach((rec) => {
        const list = Array.isArray(rec.cars)
          ? rec.cars
          : Array.isArray(rec.vehicles)
          ? rec.vehicles
          : [rec];
        list.forEach((c) => {
          const val = c[field] || c.carNumber || c.partyNumber;
          if (val && typeof val === 'string') {
            filterItem(val, c);
          }
        });
      });

      setSuggestions(matches.slice(0, 6));
    } else {
      setActiveCarIdx(null);
      setActiveField(null);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item, carIndex) => {
    const data = item.fullData;

    if (activeField === 'whoPicked') {
      setWhoPicked(data.whoPicked || item.value);
      recordMRUItem('mru_drivers', data.whoPicked || item.value);
    } else {
      const updated = [...cars];
      if (data.partyName) updated[carIndex].partyName = data.partyName;
      if (data.partyNumber || data.partyNo)
        updated[carIndex].partyNumber = data.partyNumber || data.partyNo;
      if (data.carName) {
        updated[carIndex].carName = data.carName;
        recordMRUItem('mru_cars', data.carName);
      }
      if (data.carNumber || data.carNo)
        updated[carIndex].carNumber = data.carNumber || data.carNo;
      if (data.toLocation || data.location) {
        updated[carIndex].toLocation = data.toLocation || data.location;
        recordMRUItem('mru_cities', data.toLocation || data.location);
      }
      if (data.pincode) updated[carIndex].pincode = data.pincode;
      if (data.carValue || data.value)
        updated[carIndex].carValue = data.carValue || data.value;
      if (data.packerName) updated[carIndex].packerName = data.packerName;
      setCars(updated);
    }

    setActiveCarIdx(null);
    setActiveField(null);
    setSuggestions([]);
  };

  const handleAddCar = () => {
    setCars([
      ...cars,
      {
        carName: '',
        carNumber: '',
        partyName: '',
        partyNumber: '',
        fromLocation: 'NAGPUR',
        toLocation: '',
        pincode: '',
        carValue: '',
        packerName: '',
      },
    ]);
  };

  const handleRemoveCar = (index) => {
    if (cars.length === 1) {
      Alert.alert('Notice', 'At least one vehicle is required.');
      return;
    }
    setCars(cars.filter((_, idx) => idx !== index));
  };

  const toggleVehicleSelection = (idx) => {
    if (selectedVehicleIndices.includes(idx)) {
      if (selectedVehicleIndices.length === 1) {
        Alert.alert('Selection Error', 'Please select at least one car.');
        return;
      }
      setSelectedVehicleIndices(selectedVehicleIndices.filter((i) => i !== idx));
    } else {
      setSelectedVehicleIndices([...selectedVehicleIndices, idx]);
    }
  };

  const getFullBatchPayload = () => ({
    pickupId,
    pickupNo: pickupId,
    pickupDate,
    date: pickupDate,
    whoPicked,
    cars,
  });

  const getFilteredPayload = () => {
    const filteredCars = cars.filter((_, idx) => selectedVehicleIndices.includes(idx));
    return {
      pickupId,
      pickupNo: pickupId,
      pickupDate,
      date: pickupDate,
      whoPicked,
      cars: filteredCars,
    };
  };

  // NAMING: [DRIVER]_[FROM]_[TO]_[PACKER]_[CARNAME].pdf
  const generatePdfFilename = () => {
    const cleanStr = (val) => (val || '').replace(/[^a-zA-Z0-9]/g, '');
    const selectedCars = cars.filter((_, idx) => selectedVehicleIndices.includes(idx));
    
    const driver = cleanStr(whoPicked) || 'Driver';

    if (selectedCars.length === 1) {
      const c = selectedCars[0];
      const from = cleanStr((c.fromLocation || 'Nagpur').split(',')[0]);
      const to = cleanStr((c.toLocation || 'Destination').split(',')[0]);
      const packer = cleanStr(c.packerName) || 'HariharCargo';
      const carName = cleanStr(c.carName) || 'Vehicle';

      return `${driver}_${from}_${to}_${packer}_${carName}.pdf`;
    }

    return `${driver}_MultipleVehicles_Batch.pdf`;
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const html = await generatePickupHtml(getFilteredPayload());
      const { uri } = await Print.printToFileAsync({ html });
      const customFilename = generatePdfFilename();

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const savedUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, customFilename, 'application/pdf');
          await FileSystem.writeAsStringAsync(savedUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
          Alert.alert('Download Complete 📥', `Saved directly as:\n${customFilename}`);
        } else {
          Alert.alert('Permission Denied', 'Storage permission required to save files.');
        }
      } else {
        const targetUri = `${FileSystem.documentDirectory}${customFilename}`;
        await FileSystem.copyAsync({ from: uri, to: targetUri });
        Alert.alert('Download Complete 📥', `PDF saved to Files:\n${customFilename}`);
      }
    } catch (err) {
      console.error('PDF Download error:', err);
      Alert.alert('Download Error', err.message || 'Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSharePdf = async () => {
    setSharing(true);
    try {
      const html = await generatePickupHtml(getFilteredPayload());
      const { uri } = await Print.printToFileAsync({ html });
      const customFilename = generatePdfFilename();
      const targetUri = `${FileSystem.cacheDirectory}${customFilename}`;

      await FileSystem.copyAsync({ from: uri, to: targetUri });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Notice', 'Sharing is not supported on this device');
        return;
      }

      await Sharing.shareAsync(targetUri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Select app to share PDF',
      });
    } catch (err) {
      console.error('PDF Share error:', err);
      Alert.alert('Share Error', err.message || 'Failed to share PDF.');
    } finally {
      setSharing(false);
    }
  };

  const handleSave = async () => {
    const hasValidCar = cars.some((c) => c.carName && c.carNumber);
    if (!hasValidCar) {
      Alert.alert('Incomplete Form', 'Please enter Car Name and Car Number for at least one vehicle.');
      return;
    }

    setLoading(true);
    const currentPayload = getFullBatchPayload();

    const updatedList = editItem
      ? existingRecords.map((r) =>
          r.pickupId === pickupId || r.pickupNo === pickupId ? currentPayload : r
        )
      : [currentPayload, ...existingRecords];

    try {
      await cargoService.saveRecord('pickup', updatedList);
      setShowPostSaveModal(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      enableOnAndroid={true}
      extraScrollHeight={120}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.formTitle}>Pickup Manifest Entry</Text>

      {/* Batch Details */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Batch Details</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>PICKUP DATE:</Text>
            <TextInput style={styles.input} value={pickupDate} onChangeText={setPickupDate} />
          </View>
          <View style={{ width: 10 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>WHO PICKED?:</Text>
            <TextInput
              style={styles.input}
              value={whoPicked}
              onChangeText={(txt) => handleInputChange(txt, null, 'whoPicked', 'whoPicked')}
              placeholder="DRIVER NAME"
              placeholderTextColor="#94a3b8"
            />
            {activeField === 'whoPicked' && suggestions.length > 0 && (
              <View style={styles.dropdownOverlay}>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {suggestions.map((item, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectSuggestion(item, null)}
                    >
                      <Text style={styles.dropdownText}>👤 {item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Vehicles Header */}
      <View style={styles.vehiclesHeaderRow}>
        <Text style={styles.sectionTitle}>PICKED VEHICLES ({cars.length})</Text>
        <TouchableOpacity style={styles.addVehicleBtn} onPress={handleAddCar}>
          <Text style={styles.addVehicleBtnText}>+ ADD VEHICLE</Text>
        </TouchableOpacity>
      </View>

      {/* Vehicles Cards */}
      {cars.map((c, idx) => (
        <View key={idx} style={styles.vehicleCard}>
          <View style={styles.vehicleCardHeader}>
            <Text style={styles.vehicleCardTitle}>🚘 VEHICLE #{idx + 1}</Text>
            {cars.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveCar(idx)}>
                <Text style={styles.removeText}>🗑️ Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Row 1: Car Name & Car Number */}
          <View
            style={[
              styles.row,
              { zIndex: activeCarIdx === idx && activeField === 'carName' ? 9999 : 1 },
            ]}
          >
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={c.carName}
                onChangeText={(txt) => handleInputChange(txt, idx, 'carName', 'carName')}
                placeholder="CAR NAME (E.G. CRETA)"
                placeholderTextColor="#94a3b8"
              />
              {activeCarIdx === idx && activeField === 'carName' && suggestions.length > 0 && (
                <View style={styles.dropdownOverlay}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {suggestions.map((item, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectSuggestion(item, idx)}
                      >
                        <Text style={styles.dropdownText}>🚘 {item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={{ width: 8 }} />
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={c.carNumber}
                onChangeText={(txt) => updateCarField(idx, 'carNumber', txt)}
                placeholder="CAR NO. (MH31AB1234)"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Row 2: Party Name & Party Mobile */}
          <View
            style={[
              styles.row,
              {
                marginTop: 8,
                zIndex: activeCarIdx === idx && activeField === 'partyName' ? 9999 : 1,
              },
            ]}
          >
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={c.partyName}
                onChangeText={(txt) => handleInputChange(txt, idx, 'partyName', 'partyName')}
                placeholder="PARTY NAME"
                placeholderTextColor="#94a3b8"
              />
              {activeCarIdx === idx && activeField === 'partyName' && suggestions.length > 0 && (
                <View style={styles.dropdownOverlay}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {suggestions.map((item, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectSuggestion(item, idx)}
                      >
                        <Text style={styles.dropdownText}>👤 {item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={{ width: 8 }} />
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={c.partyNumber}
                onChangeText={(txt) => updateCarField(idx, 'partyNumber', txt)}
                placeholder="PARTY MOBILE"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Row 3: From & To Location */}
          <View
            style={[
              styles.row,
              {
                marginTop: 8,
                zIndex: activeCarIdx === idx && activeField === 'toLocation' ? 9999 : 1,
              },
            ]}
          >
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={c.fromLocation}
                onChangeText={(txt) => updateCarField(idx, 'fromLocation', txt)}
                placeholder="NAGPUR"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={{ width: 8 }} />
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={c.toLocation}
                onChangeText={(txt) => handleInputChange(txt, idx, 'toLocation', 'toLocation')}
                placeholder="TO LOCATION"
                placeholderTextColor="#94a3b8"
              />
              {activeCarIdx === idx && activeField === 'toLocation' && suggestions.length > 0 && (
                <View style={styles.dropdownOverlay}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {suggestions.map((item, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectSuggestion(item, idx)}
                      >
                        <Text style={styles.dropdownText}>📍 {item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Row 4: Pincode & Car Value */}
          <View style={[styles.row, { marginTop: 8 }]}>
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={c.pincode}
                onChangeText={(txt) => handlePincodeChange(txt, idx)}
                placeholder="PINCODE (STATE)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <View style={{ width: 8 }} />
            <View style={styles.flex1}>
              <TextInput
                style={styles.input}
                value={c.carValue}
                onChangeText={(txt) => updateCarField(idx, 'carValue', txt)}
                placeholder="CAR VALUE (₹)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Row 5: Packer Name */}
          <View
            style={{
              zIndex: activeCarIdx === idx && activeField === 'packerName' ? 9999 : 1,
              marginTop: 8,
            }}
          >
            <TextInput
              style={styles.input}
              value={c.packerName}
              onChangeText={(txt) => handleInputChange(txt, idx, 'packerName', 'packerName')}
              placeholder="PACKER NAME"
              placeholderTextColor="#94a3b8"
            />
            {activeCarIdx === idx && activeField === 'packerName' && suggestions.length > 0 && (
              <View style={styles.dropdownOverlay}>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {suggestions.map((item, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectSuggestion(item, idx)}
                    >
                      <Text style={styles.dropdownText}>📦 {item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Main Buttons */}
      <TouchableOpacity style={styles.previewFullBtn} onPress={() => setShowPreviewModal(true)}>
        <Text style={styles.previewBtnText}>👁️ LIVE MANIFEST PREVIEW</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveMainBtn} onPress={handleSave} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveMainBtnText}>💾 SAVE & SYNC TO GOOGLE SHEETS</Text>
        )}
      </TouchableOpacity>

      {/* Post-Save Pop-up Modal */}
      <Modal visible={showPostSaveModal} animationType="fade" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pickup Manifest Saved! 🎉</Text>
            <Text style={styles.modalSub}>Select vehicles to include for Download or Share:</Text>

            <ScrollView style={{ maxHeight: 180, marginVertical: 8 }}>
              {cars.map((c, i) => {
                const isChecked = selectedVehicleIndices.includes(i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.carSelectItem}
                    onPress={() => toggleVehicleSelection(i)}
                  >
                    <Text style={styles.checkboxText}>{isChecked ? '☑️' : '⏹️'}</Text>
                    <Text style={styles.carSelectText}>
                      #{i + 1} {c.carName || 'Vehicle'} ({c.carNumber || 'N/A'})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.downloadModalBtn} onPress={handleDownloadPdf} disabled={downloading}>
                {downloading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>📥 DOWNLOAD</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareModalBtn} onPress={handleSharePdf} disabled={sharing}>
                {sharing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>📲 SHARE PDF</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.doneModalBtn}
              onPress={() => {
                setShowPostSaveModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.doneBtnText}>DONE & RETURN TO LIST</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Live Preview Modal */}
      <Modal visible={showPreviewModal} animationType="slide">
        <View style={styles.previewModalContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Pickup Manifest Preview ({cars.length} Cars)</Text>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowPreviewModal(false)}>
              <Text style={styles.closeModalText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.webViewWrapper}>
            {previewHtml ? (
              <WebView
                originWhitelist={['*']}
                source={{ html: previewHtml }}
                style={{ flex: 1 }}
                scalesPageToFit={true}
              />
            ) : (
              <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 50 }} />
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
  formTitle: { fontSize: 20, fontWeight: '800', color: '#dc2626', marginBottom: 14 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: { color: '#dc2626', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  vehiclesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  addVehicleBtn: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addVehicleBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  vehicleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  vehicleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  vehicleCardTitle: { color: '#dc2626', fontWeight: '800', fontSize: 13 },
  removeText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
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
  row: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },
  previewFullBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  previewBtnText: { color: '#dc2626', fontWeight: '800', fontSize: 12 },
  saveMainBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveMainBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  dropdownOverlay: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    maxHeight: 150,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  dropdownText: { color: '#ffffff', fontSize: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#dc2626', textAlign: 'center' },
  modalSub: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginVertical: 8 },
  carSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  checkboxText: { fontSize: 16, marginRight: 10 },
  carSelectText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  downloadModalBtn: { flex: 0.48, backgroundColor: '#0284c7', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  shareModalBtn: { flex: 0.48, backgroundColor: '#16a34a', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  doneModalBtn: { backgroundColor: '#334155', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  doneBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 11 },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  previewModalContainer: { flex: 1, backgroundColor: '#0f172a', paddingTop: 40 },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  previewTitle: { color: '#dc2626', fontSize: 13, fontWeight: '800' },
  closeModalBtn: { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  closeModalText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  webViewWrapper: { flex: 1, backgroundColor: '#ffffff' },
});
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { cargoService } from '../services/cargoService';
import { shareDocumentPdf } from '../utils/documentGenerator';

export default function BiltyFormScreen({ route, navigation }) {
  const existingRecords = route.params?.existingRecords || [];
  const editItem = route.params?.editItem || null;

  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pickupList, setPickupList] = useState([]);
  const [loadingPickups, setLoadingPickups] = useState(false);

  // Exact Fields
  const [lrNo, setLrNo] = useState(editItem ? editItem.lrNo : `${5500 + existingRecords.length + 1}`);
  const [date, setDate] = useState(editItem ? editItem.date : new Date().toISOString().split('T')[0]);
  
  // Consignor & Consignee
  const [consignorName, setConsignorName] = useState(editItem ? editItem.consignorName : '');
  const [consignorPhone, setConsignorPhone] = useState(editItem ? editItem.consignorPhone : '');
  const [consignorAddress, setConsignorAddress] = useState(editItem ? editItem.consignorAddress : 'NAGPUR');
  
  const [consigneeName, setConsigneeName] = useState(editItem ? editItem.consigneeName : '');
  const [consigneePhone, setConsigneePhone] = useState(editItem ? editItem.consigneePhone : '');
  const [consigneeAddress, setConsigneeAddress] = useState(editItem ? editItem.consigneeAddress : '');
  const [pincode, setPincode] = useState(editItem ? editItem.pincode : '');

  const [fromLocation, setFromLocation] = useState(editItem ? editItem.fromLocation : 'NAGPUR');
  const [toLocation, setToLocation] = useState(editItem ? editItem.toLocation : '');
  
  // Cargo Details
  const [carName, setCarName] = useState(editItem ? editItem.carName : '');
  const [carNumber, setCarNumber] = useState(editItem ? editItem.carNumber : '');
  const [lorryNo, setLorryNo] = useState(editItem ? editItem.lorryNo : 'Part Load');
  const [declaredValue, setDeclaredValue] = useState(editItem ? editItem.declaredValue : '');
  const [freightAmount, setFreightAmount] = useState(editItem ? editItem.freightAmount : 'Fixed');
  const [packerName, setPackerName] = useState(editItem ? editItem.packerName : '');

  // Floating Suggestions
  const [activeField, setActiveField] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Pincode Lookup API
  const handlePincodeChange = async (text) => {
    setPincode(text);
    if (text.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${text}`);
        const data = await res.json();
        if (data[0] && data[0].Status === 'Success') {
          const po = data[0].PostOffice[0];
          const cityState = `${po.District.toUpperCase()}, ${po.State.toUpperCase()}`;
          setToLocation(po.District.toUpperCase());
          setConsigneeAddress(prev => prev ? `${prev}, ${cityState}` : cityState);
        }
      } catch (err) {}
    }
  };

  // Import from Pickup
  const handleOpenImportModal = async () => {
    setShowImportModal(true);
    setLoadingPickups(true);
    try {
      const res = await cargoService.fetchRecords('pickup');
      setPickupList(Array.isArray(res) ? res : []);
    } catch (err) {
      Alert.alert('Import Failed', 'Could not fetch Pickup records.');
    } finally {
      setLoadingPickups(false);
    }
  };

  const handleSelectPickup = (pickup) => {
    setConsignorName(pickup.partyName || pickup.consignorName || '');
    setConsignorPhone(pickup.partyNo || pickup.consignorPhone || '');
    setCarName(pickup.carName || '');
    setCarNumber(pickup.carNo || pickup.carNumber || '');
    setFromLocation(pickup.fromLocation || 'NAGPUR');
    setToLocation(pickup.toLocation || '');
    setDeclaredValue(pickup.value || pickup.declaredValue || '');
    setPackerName(pickup.packerName || '');
    setShowImportModal(false);
  };

  // Suggestion Filter
  const handleInputChange = (text, setter, keyName) => {
    setter(text);
    if (text.length > 1) {
      setActiveField(keyName);
      const matches = existingRecords
        .map(r => r[keyName])
        .filter((v, i, self) => v && v.toLowerCase().includes(text.toLowerCase()) && self.indexOf(v) === i);
      setSuggestions(matches.slice(0, 4));
    } else {
      setActiveField(null);
      setSuggestions([]);
    }
  };

  const handleSave = async () => {
    if (!consignorName || !carName || !carNumber) {
      Alert.alert('Missing Fields', 'Please complete Consignor Name, Car Name, and Car Registration Number.');
      return;
    }

    setLoading(true);
    const payload = {
      lrNo,
      date,
      consignorName,
      consignorPhone,
      consignorAddress,
      consigneeName,
      consigneePhone,
      consigneeAddress,
      pincode,
      fromLocation,
      toLocation,
      carName,
      carNumber,
      lorryNo,
      declaredValue,
      freightAmount,
      packerName,
    };

    try {
      const updatedList = editItem
        ? existingRecords.map(r => (r.lrNo === editItem.lrNo ? payload : r))
        : [payload, ...existingRecords];

      await cargoService.saveRecord('bilty', updatedList);
      Alert.alert('Saved', 'Bilty synced successfully with Google Sheets!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Sync Error', 'Failed to save record to Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      enableOnAndroid={true}
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={styles.importBtn} onPress={handleOpenImportModal}>
        <Text style={styles.importBtnText}>📥 Import Details from Existing Pickup Ticket</Text>
      </TouchableOpacity>

      {/* Meta */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>LR NO</Text>
            <TextInput style={[styles.input, styles.readOnly]} value={lrNo} editable={false} />
          </View>
          <View style={{ width: 10 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>DATE</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} />
          </View>
        </View>
      </View>

      {/* Consignor */}
      <View style={[styles.card, { zIndex: activeField === 'consignorName' ? 999 : 1 }]}>
        <Text style={styles.sectionHeader}>CONSIGNOR (SENDER)</Text>
        <Text style={styles.label}>Consignor Name</Text>
        <TextInput
          style={styles.input}
          value={consignorName}
          onChangeText={(txt) => handleInputChange(txt, setConsignorName, 'consignorName')}
          placeholder="Client / Dealer Name"
          placeholderTextColor="#64748b"
        />
        {activeField === 'consignorName' && suggestions.length > 0 && (
          <View style={styles.suggestionDropdown}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionItem}
                onPress={() => {
                  setConsignorName(item);
                  setActiveField(null);
                }}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={consignorPhone} onChangeText={setConsignorPhone} keyboardType="phone-pad" />
          </View>
          <View style={{ width: 10 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>From City</Text>
            <TextInput style={styles.input} value={fromLocation} onChangeText={setFromLocation} />
          </View>
        </View>
      </View>

      {/* Consignee */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>CONSIGNEE (RECEIVER)</Text>
        <Text style={styles.label}>Consignee Name</Text>
        <TextInput style={styles.input} value={consigneeName} onChangeText={setConsigneeName} placeholder="Receiver Name" placeholderTextColor="#64748b" />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Pincode (Auto City)</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={handlePincodeChange}
              keyboardType="numeric"
              maxLength={6}
              placeholder="e.g. 400001"
              placeholderTextColor="#64748b"
            />
          </View>
          <View style={{ width: 10 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>To City</Text>
            <TextInput style={styles.input} value={toLocation} onChangeText={setToLocation} />
          </View>
        </View>
        <Text style={styles.label}>Full Destination Address</Text>
        <TextInput style={styles.input} value={consigneeAddress} onChangeText={setConsigneeAddress} placeholder="Street Address, Area" placeholderTextColor="#64748b" />
      </View>

      {/* Cargo Info */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>CARGO & TRANSPORT DETAILS</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Car Name / Model</Text>
            <TextInput style={styles.input} value={carName} onChangeText={setCarName} placeholder="Fortuner" placeholderTextColor="#64748b" />
          </View>
          <View style={{ width: 10 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>Car Registration No</Text>
            <TextInput style={styles.input} value={carNumber} onChangeText={setCarNumber} placeholder="MH 31 XX 1234" placeholderTextColor="#64748b" autoCapitalize="characters" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Lorry / Truck No</Text>
            <TextInput style={styles.input} value={lorryNo} onChangeText={setLorryNo} placeholder="Part Load" placeholderTextColor="#64748b" />
          </View>
          <View style={{ width: 10 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>Declared Value (₹)</Text>
            <TextInput style={styles.input} value={declaredValue} onChangeText={setDeclaredValue} keyboardType="numeric" placeholder="500000" placeholderTextColor="#64748b" />
          </View>
        </View>

        <Text style={styles.label}>Packer Name</Text>
        <TextInput style={styles.input} value={packerName} onChangeText={setPackerName} placeholder="Packer Name" placeholderTextColor="#64748b" />
      </View>

      {/* Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => shareDocumentPdf('bilty', { lrNo, date, consignorName, consignorPhone, consignorAddress, consigneeName, consigneePhone, consigneeAddress, fromLocation, toLocation, carName, carNumber, lorryNo, declaredValue, freightAmount, packerName })}
        >
          <Text style={styles.btnText}>📲 Share PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{editItem ? 'Update Sheet' : 'Save Sheet'}</Text>}
        </TouchableOpacity>
      </View>

      {/* Pickup Import Modal */}
      <Modal visible={showImportModal} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Import Data From Pickup Ticket</Text>
            <View style={styles.divider} />
            {loadingPickups ? (
              <ActivityIndicator size="large" color="#0284c7" style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={pickupList}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.importItem} onPress={() => handleSelectPickup(item)}>
                    <Text style={styles.importTitle}>{item.pickupNo || item.partyName || 'Pickup Record'}</Text>
                    <Text style={styles.importSub}>{item.carName} ({item.carNo || item.carNumber || 'N/A'}) ➔ {item.toLocation || 'N/A'}</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 300 }}
              />
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowImportModal(false)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  contentContainer: { padding: 16, paddingBottom: 60 },
  importBtn: { backgroundColor: '#0284c7', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  importBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12, position: 'relative' },
  sectionHeader: { color: '#38bdf8', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#334155', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  readOnly: { opacity: 0.6 },
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  shareBtn: { flex: 0.48, backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  saveBtn: { flex: 0.48, backgroundColor: '#0284c7', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  suggestionDropdown: { position: 'absolute', top: 75, left: 14, right: 14, backgroundColor: '#334155', borderRadius: 8, zIndex: 9999, elevation: 5 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  suggestionText: { color: '#f8fafc', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#cbd5e1', marginVertical: 10 },
  importItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  importTitle: { fontWeight: '700', color: '#0f172a', fontSize: 14 },
  importSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  closeBtn: { backgroundColor: '#0f172a', paddingVertical: 10, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  closeBtnText: { color: '#ffffff', fontWeight: '700' },
});